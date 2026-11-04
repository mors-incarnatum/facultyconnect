import { ACTIVE, canManageAppointment, isRequestOpen } from '../state/appointments.js';
import { isFutureSlot } from '../utils/clock.js';

// Each instance reads one React state snapshot; writes go through React setters.
export class AppointmentService {
  constructor({ appointments, setAppointments, slots, user, now, nextId }) {
    Object.assign(this, { appointments, setAppointments, slots, user, now, nextId });
  }

  getSlot = (id) => this.slots.find((slot) => slot.id === id);
  getAppointment = (id) => this.appointments.find((appointment) => appointment.id === id);
  holderOf = (slotId) => this.appointments.find((appointment) => (
    appointment.slotId === slotId && ACTIVE.includes(appointment.status)
  )) || null;
  isAvailable = (slot) => isFutureSlot(slot, this.now) && isRequestOpen(slot, this.now) && !this.holderOf(slot.id);
  availableSlotsFor = (facultyId) => this.slots
    .filter((slot) => slot.facultyId === facultyId && this.isAvailable(slot))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  createAppointment = ({ studentId, slotId, subject, topic, description }) => {
    const slot = this.getSlot(slotId);
    if (slot && isFutureSlot(slot, new Date()) && !isRequestOpen(slot, new Date())) {
      return { ok: false, reason: 'closed' };
    }
    if (!slot || !isFutureSlot(slot, new Date()) || this.holderOf(slot.id)) {
      return { ok: false, reason: 'conflict' };
    }
    const id = this.nextId('a');
    this.setAppointments((list) => [
      ...list,
      { id, studentId, slotId, status: 'pending', subject, topic, description },
    ]);
    return { ok: true, id };
  };

  updateAppointment(id, fields) {
    this.setAppointments((list) => list.map((appointment) => (
      appointment.id === id ? { ...appointment, ...fields } : appointment
    )));
  }

  updateTopic = (id, fields) => {
    const appointment = this.getAppointment(id);
    const slot = this.getSlot(appointment?.slotId);
    if (this.user?.role !== 'student' || appointment?.studentId !== this.user.id || !canManageAppointment(appointment, slot, new Date())) {
      return { ok: false, error: 'Topics can only be changed before a pending or confirmed consultation starts.' };
    }
    this.updateAppointment(id, fields);
    return { ok: true };
  };

  deleteTopic = (id) => this.updateTopic(id, { topic: null, description: null });

  setStatus = (id, status) => {
    if (this.user?.role === 'student') {
      const appointment = this.getAppointment(id);
      const slot = this.getSlot(appointment?.slotId);
      if (status !== 'cancelled' || appointment?.studentId !== this.user.id || !canManageAppointment(appointment, slot, new Date())) {
        return { ok: false, error: 'Appointments can only be cancelled before they start.' };
      }
    }
    this.updateAppointment(id, { status });
    return { ok: true };
  };
}