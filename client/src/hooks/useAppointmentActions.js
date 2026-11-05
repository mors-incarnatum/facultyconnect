import { useMemo } from 'react';
import { AppointmentService } from '../services/AppointmentService.js';

export function useAppointmentActions({ appointments, setAppointments, slots, user, now, nextId }) {
  const service = useMemo(() => new AppointmentService({
    appointments, setAppointments, slots, user, now, nextId,
  }), [appointments, setAppointments, slots, user, now, nextId]);
  const {
    getSlot, getAppointment, holderOf, isAvailable, availableSlotsFor,
    createAppointment, updateTopic, deleteTopic, setStatus,
  } = service;
  return {
    getSlot, getAppointment, holderOf, isAvailable, availableSlotsFor,
    createAppointment, updateTopic, deleteTopic, setStatus,
  };
}
