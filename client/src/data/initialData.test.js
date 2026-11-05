import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData, initialFaculty, initialStudents } from './initialData.js';
import { isRequestOpen, applyAutoDecline } from '../state/appointments.js';
import { slotTime } from '../utils/clock.js';

for (const date of ['2026-11-05T23:59:00', '2026-12-31T23:59:00', '2028-02-29T00:01:00']) {
  test(`fresh demo has consistent, actionable records at ${date}`, () => {
    const now = new Date(date);
    const { initialSlots: slots, initialAppointments: appointments } = createDemoData(now);
    assert.ok(initialFaculty.length >= 5 && initialStudents.length >= 5);
    assert.ok(slots.length >= 5 && appointments.length >= 5);
    for (const list of [slots, appointments, initialFaculty, initialStudents]) {
      assert.equal(new Set(list.map(({ id }) => id)).size, list.length);
    }
    for (const appointment of appointments) {
      const slot = slots.find(({ id }) => id === appointment.slotId);
      assert.ok(slot, appointment.id);
      assert.ok(initialStudents.some(({ id }) => id === appointment.studentId));
      const faculty = initialFaculty.find(({ id }) => id === slot.facultyId);
      assert.ok(faculty.courses.includes(appointment.subject), appointment.id);
      if (appointment.status === 'pending') assert.ok(isRequestOpen(slot, now), appointment.id);
      if (['completed', 'cancelled', 'declined'].includes(appointment.status)) {
        assert.ok(slotTime(slot, 'end') < now.getTime());
      }
    }
    assert.deepEqual(applyAutoDecline(appointments, slots, now), appointments);
    for (const faculty of initialFaculty) {
      assert.ok(slots.some((slot) => slot.facultyId === faculty.id && isRequestOpen(slot, now)
        && !appointments.some((a) => a.slotId === slot.id && ['pending', 'confirmed'].includes(a.status))));
    }
    for (const slot of slots) {
      assert.ok(slotTime(slot, 'end') - slotTime(slot) === 30 * 60 * 1000);
      assert.ok(slot.location.trim());
      assert.ok(initialFaculty.some(({ id }) => id === slot.facultyId));
      assert.ok(appointments.filter((a) => a.slotId === slot.id && ['pending', 'confirmed'].includes(a.status)).length <= 1);
    }
  });
}
