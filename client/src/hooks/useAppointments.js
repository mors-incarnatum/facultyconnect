import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from './useApp.js';

export function useDetailed() {
  const { getSlot, getFaculty, getStudent } = useApp();
  return useCallback((appointment) => {
    const slot = getSlot(appointment.slotId);
    return {
      ...appointment,
      slot,
      faculty: getFaculty(slot?.facultyId),
      student: getStudent(appointment.studentId),
    };
  }, [getSlot, getFaculty, getStudent]);
}

export function useFacultyRecords() {
  const { user, appointments, getSlot } = useApp();
  const detail = useDetailed();
  return appointments
    .filter((a) => user?.role === 'faculty' && getSlot(a.slotId)?.facultyId === user.id)
    .map(detail)
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start));
}

export function useStudentRecords() {
  const { user, appointments } = useApp();
  const detail = useDetailed();
  return appointments
    .filter((appointment) => user?.role === 'student' && appointment.studentId === user.id)
    .map(detail);
}

export function useAppointment() {
  const { id } = useParams();
  const { user, getAppointment, getSlot } = useApp();
  const detail = useDetailed();
  const appointment = getAppointment(id);
  if (!appointment) return null;
  const ownsAppointment = user?.role === 'student'
    ? appointment.studentId === user.id
    : user?.role === 'faculty' && getSlot(appointment.slotId)?.facultyId === user.id;
  return ownsAppointment ? detail(appointment) : null;
}
