import { facultyTransitions, publishSchedule, validateSlot } from '../state/availability.js';
import { isFutureSlot, localDate } from '../utils/clock.js';

export class AvailabilityService {
  constructor({ user, slots, setSlots, appointments, nextId, getSlot, getAppointment, holderOf, setStatus, setSchedules, setScheduleDraft }) {
    Object.assign(this, { user, slots, setSlots, appointments, nextId, getSlot, getAppointment, holderOf, setStatus, setSchedules, setScheduleDraft });
  }

  updateFacultyStatus = (id, status) => {
    const appointment = this.getAppointment(id);
    const slot = this.getSlot(appointment?.slotId);
    const allowed = facultyTransitions(appointment, slot, new Date());
    if (this.user?.role !== 'faculty' || slot?.facultyId !== this.user.id || !allowed.includes(status)) {
      return { ok: false, error: 'Status change unavailable. Only confirmed consultations that have ended can be completed.' };
    }
    this.setStatus(id, status);
    return { ok: true };
  };
  saveFacultySlot = (fields, id) => {
    if (this.user?.role !== 'faculty') return { ok: false, error: 'Sign in as faculty.' };
    if (id && (this.getSlot(id)?.facultyId !== this.user.id || this.holderOf(id))) {
      return { ok: false, error: 'Reserved slots cannot be edited.' };
    }
    const slot = { ...fields, facultyId: this.user.id, location: fields.location.trim() };
    const error = validateSlot(slot, this.slots, id) || (!isFutureSlot(slot, new Date()) ? 'Choose a future date and start time.' : '');
    if (error) return { ok: false, error };
    const slotId = id || this.nextId('sl');
    // Keep historical records attached to the original schedule.
    if (id && this.appointments.some((appointment) => appointment.slotId === id)) {
      return { ok: false, error: 'This slot has appointment history. Create a new slot instead.' };
    }
    this.setSlots((prev) => id
      ? prev.map((existing) => existing.id === id ? { ...slot, id } : existing)
      : [...prev, { ...slot, id: slotId }]);
    return { ok: true, id: slotId };
  };
  removeFacultySlot = (id) => {
    const slot = this.getSlot(id);
    if (this.user?.role !== 'faculty' || slot?.facultyId !== this.user.id || this.holderOf(id)) {
      return { ok: false, error: 'Reserved slots cannot be removed.' };
    }
    if (this.appointments.some((appointment) => appointment.slotId === id)) {
      return { ok: false, error: 'This slot has appointment history and must be retained.' };
    }
    this.setSlots((prev) => prev.filter((existing) => existing.id !== id));
    return { ok: true, slot };
  };
  saveFacultySchedule = (schedule) => {
    if (this.user?.role !== 'faculty') return { ok: false, error: 'Sign in as faculty.' };
    const current = new Date();
    const result = publishSchedule({
      slots: this.slots,
      appointments: this.appointments,
      facultyId: this.user.id,
      ...schedule,
      today: localDate(current),
      now: current,
      nextId: this.nextId,
    });
    if (!result.ok) return result;
    this.setSlots(result.slots);
    this.setSchedules((s) => ({ ...s, [this.user.id]: structuredClone(schedule) }));
    this.setScheduleDraft(null);
    return { ok: true };
  };
}
