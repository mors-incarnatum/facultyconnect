import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountService } from './AccountService.js';
import { AppointmentService } from './AppointmentService.js';
import { AvailabilityService } from './AvailabilityService.js';
import { defaultWeeklyHours } from '../state/availability.js';

function stateHarness(initial) {
  const state = { ...initial };
  let counter = 100;
  const dependencies = { nextId: (prefix) => `${prefix}${++counter}` };
  for (const key of Object.keys(initial)) {
    dependencies[`set${key[0].toUpperCase()}${key.slice(1)}`] = (value) => {
      state[key] = typeof value === 'function' ? value(state[key]) : value;
    };
  }
  return { state, snapshot: () => ({ ...state, ...dependencies }) };
}

const slot = { id: 'sl1', facultyId: 'f1', date: '2099-11-03', start: '13:00', end: '13:30', location: 'Room 204' };

test('account actions retain session, normalized identity, and registration across snapshots', () => {
  const harness = stateHarness({
    faculty: [{ id: 'f1', email: 'faculty@example.edu' }],
    students: [], session: null, selection: { facultyId: 'f1', slotId: 'sl1' },
  });
  const values = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  } });
  try {
    let accounts = new AccountService(harness.snapshot());
    assert.equal(accounts.register({ role: 'student', name: 'Student', email: ' student@example.edu ' }).ok, true);
    accounts = new AccountService(harness.snapshot());
    assert.equal(accounts.register({ role: 'faculty', email: 'STUDENT@example.edu' }).ok, false);
    const { signIn } = accounts;
    assert.deepEqual(signIn(' STUDENT@EXAMPLE.EDU '), { ok: true, role: 'student' });
    accounts = new AccountService(harness.snapshot());
    assert.equal(accounts.getUser().name, 'Student');
    assert.deepEqual(AccountService.loadSession(), harness.state.session);
    accounts.signOut();
    assert.equal(AccountService.loadSession(), null);
    assert.deepEqual(harness.state.selection, { facultyId: null, slotId: null });
  } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else delete globalThis.sessionStorage;
  }
});

test('booking reserves a slot, protects ownership, clears a topic, and releases on cancellation', () => {
  const harness = stateHarness({ slots: [slot], appointments: [], user: { id: 's1', role: 'student' }, now: new Date() });
  let service = new AppointmentService(harness.snapshot());
  const { createAppointment } = service;
  const booking = createAppointment({ studentId: 's1', slotId: slot.id, topic: 'Question', description: 'Details' });
  assert.equal(booking.ok, true);
  service = new AppointmentService(harness.snapshot());
  assert.equal(service.isAvailable(slot), false);
  assert.equal(service.createAppointment({ studentId: 's2', slotId: slot.id }).reason, 'conflict');
  const outsider = new AppointmentService({ ...harness.snapshot(), user: { id: 's2', role: 'student' } });
  assert.equal(outsider.deleteTopic(booking.id).ok, false);
  assert.equal(outsider.setStatus(booking.id, 'cancelled').ok, false);
  assert.equal(service.deleteTopic(booking.id).ok, true);
  service = new AppointmentService(harness.snapshot());
  assert.equal(service.getAppointment(booking.id).topic, null);
  assert.equal(service.getAppointment(booking.id).status, 'pending');
  assert.equal(service.setStatus(booking.id, 'cancelled').ok, true);
  service = new AppointmentService(harness.snapshot());
  assert.equal(service.isAvailable(slot), true);
  assert.equal(service.getAppointment(booking.id).status, 'cancelled');
});

test('faculty service preserves reservation/history and publishes through React setters', () => {
  const harness = stateHarness({
    slots: [slot], appointments: [{ id: 'a1', slotId: slot.id, status: 'pending' }],
    user: { id: 'f1', role: 'faculty' }, now: new Date(), schedules: {}, scheduleDraft: { dirty: true },
  });
  const service = () => {
    const appointments = new AppointmentService(harness.snapshot());
    return new AvailabilityService({ ...harness.snapshot(),
      getSlot: appointments.getSlot, getAppointment: appointments.getAppointment,
      holderOf: appointments.holderOf, setStatus: appointments.setStatus,
    });
  };
  assert.equal(service().updateFacultyStatus('a1', 'completed').ok, false);
  const { updateFacultyStatus } = service();
  assert.equal(updateFacultyStatus('a1', 'confirmed').ok, true);
  assert.equal(service().saveFacultySlot({ ...slot, location: 'New room' }, slot.id).ok, false);
  assert.equal(service().removeFacultySlot(slot.id).ok, false);
  assert.equal(service().updateFacultyStatus('a1', 'cancelled').ok, true);
  assert.match(service().removeFacultySlot(slot.id).error, /history/);
  assert.match(service().saveFacultySlot(slot, slot.id).error, /history/);
  const schedule = { weekly: defaultWeeklyHours(), exceptions: [], location: 'Room 205' };
  assert.equal(service().saveFacultySchedule(schedule).ok, true);
  assert.deepEqual(harness.state.slots.find((record) => record.id === slot.id), slot);
  assert.ok(harness.state.slots.length > 1);
  assert.equal(harness.state.scheduleDraft, null);
  schedule.weekly[0].enabled = false;
  assert.equal(harness.state.schedules.f1.weekly[0].enabled, true);
  const added = service().saveFacultySlot({ ...slot, start: '14:00', end: '14:30' });
  assert.equal(added.ok, true);
  assert.equal(service().removeFacultySlot(added.id).ok, true);
});
