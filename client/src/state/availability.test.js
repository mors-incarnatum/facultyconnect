import test from "node:test";
import assert from "node:assert/strict";
import { defaultWeeklyHours, facultyTransitions, publishSchedule, validateSlot } from "./availability.js";

const base = { facultyId: "f1", date: "2026-10-26", start: "13:00", end: "13:30", location: "Room 204" };
test("slot validation rejects overlaps and invalid duration", () => {
  assert.match(validateSlot({ ...base, start: "13:15", end: "13:45" }, [{ ...base, id: "s1" }]), /overlaps/);
  assert.equal(validateSlot(base, [{ ...base, id: "s1" }], "s1"), "");
  assert.match(validateSlot({ ...base, end: "14:00" }, []), /30 minutes/);
});
test("publishing protects occupied slots and other faculty while applying exceptions", () => {
  let n = 0;
  const slots = [{ ...base, id: "held", source: "weekly" }, { ...base, id: "free", start: "13:30", end: "14:00", source: "weekly" }, { ...base, id: "other", facultyId: "f2" }];
  const result = publishSchedule({ slots, appointments: [{ slotId: "held", status: "pending" }], facultyId: "f1", weekly: defaultWeeklyHours(), exceptions: [base.date], location: base.location, today: base.date, nextId: () => `s${++n}` });
  assert.equal(result.ok, true);
  assert.ok(result.slots.some((s) => s.id === "held"));
  assert.ok(result.slots.some((s) => s.id === "other"));
  assert.ok(!result.slots.some((s) => s.id === "free"));
  assert.equal(result.slots.filter((s) => s.facultyId === "f1" && s.date === base.date).length, 1);
  assert.ok(result.slots.some((s) => s.date === "2026-10-28"));
});
test("republishing is idempotent and disabling a day removes generated free slots", () => {
  let n = 0;
  const args = { appointments: [], facultyId: "f1", weekly: defaultWeeklyHours(), exceptions: [], location: base.location, today: base.date, nextId: () => `s${++n}` };
  const first = publishSchedule({ ...args, slots: [] });
  const second = publishSchedule({ ...args, slots: first.slots });
  assert.equal(second.slots.length, first.slots.length);
  const third = publishSchedule({ ...args, weekly: args.weekly.map((r) => ({ ...r, enabled: false })), slots: second.slots });
  assert.equal(third.slots.length, 0);
});

test("faculty transitions reject pending completion and early completion", () => {
  assert.deepEqual(facultyTransitions({ status: "pending" }, base, base.date), ["confirmed", "declined"]);
  assert.deepEqual(facultyTransitions({ status: "confirmed" }, base, base.date), ["cancelled"]);
  assert.deepEqual(facultyTransitions({ status: "confirmed" }, base, "2026-10-27"), ["completed", "cancelled"]);
  for (const status of ["completed", "declined", "cancelled"]) assert.deepEqual(facultyTransitions({ status }, base, "2026-10-27"), []);
});
test("multiple intervals publish both periods and reject overlapping intervals", () => {
  let n = 0;
  const weekly = defaultWeeklyHours().map((r, i) => ({ ...r, enabled: i === 0, intervals: [{ start: "09:15", end: "10:15" }, { start: "13:00", end: "14:00" }] }));
  const args = { slots: [], appointments: [], facultyId: "f1", weekly, exceptions: [], location: base.location, today: base.date, nextId: () => `new${++n}` };
  const result = publishSchedule(args);
  assert.equal(result.ok, true);
  assert.equal(result.slots.length, 16);
  assert.ok(result.slots.some((s) => s.start === "09:15"));
  assert.ok(result.slots.some((s) => s.start === "13:30"));
  weekly[0].intervals[1] = { start: "10:00", end: "11:00" };
  assert.match(publishSchedule(args).error, /overlap/);
});
test("range exceptions preserve active and historical references and other faculty", () => {
  let n = 0;
  const slots = ["pending", "confirmed", "completed", "declined", "cancelled"].map((id, i) => ({ ...base, id, date: `2026-10-${26 + i}`, source: "weekly" }));
  const appointments = slots.map((s) => ({ slotId: s.id, status: s.id }));
  const result = publishSchedule({ slots: [...slots, { ...base, id: "free" }, { ...base, id: "other", facultyId: "f2" }], appointments, facultyId: "f1", weekly: defaultWeeklyHours(), exceptions: [{ start: "2026-10-26", end: "2026-10-30" }], location: base.location, today: base.date, nextId: () => `new${++n}` });
  assert.equal(result.ok, true);
  for (const s of slots) assert.deepEqual(result.slots.find((v) => v.id === s.id), s);
  assert.ok(result.slots.some((s) => s.id === "other"));
  assert.ok(!result.slots.some((s) => s.id === "free"));
  assert.equal(result.slots.filter((s) => s.facultyId === "f1" && s.date <= "2026-10-30").length, 5);
});
test("slot discovery boundaries remain supported and invalid dates rejected", () => {
  for (const [date, start, end] of [["2026-10-31", "00:00", "00:30"], ["2026-11-01", "23:29", "23:59"], [base.date, "12:15", "12:45"]]) assert.equal(validateSlot({ ...base, date, start, end }, []), "");
  assert.match(validateSlot({ ...base, date: "2026-02-30" }, []), /valid calendar date/);
});
