import assert from "node:assert/strict";
import test from "node:test";
import { applyAutoDecline, isRequestOpen, requestDeadline, shouldAutoDecline } from "./appointments.js";

const slot = { id: "s", date: "2026-11-10", start: "10:00", end: "10:30" };
const at = (d, h, m = 0, s = 0) => new Date(2026, 10, d, h, m, s);

test("requests are open until exactly 24 hours before the slot starts", () => {
  assert.equal(requestDeadline(slot), at(9, 10).getTime());
  assert.equal(isRequestOpen(slot, at(9, 9, 59, 59)), true);
  assert.equal(isRequestOpen(slot, at(9, 10)), false);
});

test("only pending requests past the deadline are automatically declined", () => {
  const late = at(9, 10);
  assert.equal(shouldAutoDecline({ status: "pending" }, slot, at(9, 9, 59)), false);
  assert.equal(shouldAutoDecline({ status: "pending" }, slot, late), true);
  for (const status of ["confirmed", "completed", "declined", "cancelled"]) {
    assert.equal(shouldAutoDecline({ status }, slot, late), false);
  }
});

test("derived list marks overdue requests declined and leaves others untouched", () => {
  const list = [
    { id: "a", slotId: "s", status: "pending" },
    { id: "b", slotId: "s", status: "confirmed" },
  ];
  const early = applyAutoDecline(list, [slot], at(8, 9));
  assert.equal(early[0].status, "pending");
  const late = applyAutoDecline(list, [slot], at(9, 11));
  assert.equal(late[0].status, "declined");
  assert.equal(late[0].autoDeclined, true);
  assert.equal(late[1].status, "confirmed");
  assert.equal(list[0].status, "pending");
});