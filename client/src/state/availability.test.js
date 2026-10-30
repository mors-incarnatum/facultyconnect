import test from "node:test";
import assert from "node:assert/strict";
import { defaultWeeklyHours, publishSchedule, validateSlot } from "./availability.js";

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
