import { useCallback, useRef, useState } from 'react';
import { initialAppointments, initialSlots } from '../data/initialData.js';
import { localDate } from '../utils/clock.js';
import { useAccounts } from './useAccounts.js';
import { useAppointmentActions } from './useAppointmentActions.js';
import { useClock } from './useClock.js';
import { useFacultyAvailability } from './useFacultyAvailability.js';

export function useAppState() {
  const now = useClock();
  const today = localDate(now);
  const [slots, setSlots] = useState(initialSlots);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selection, setSelection] = useState({ facultyId: null, slotId: null });
  const [feedback, setFeedback] = useState('');
  const counter = useRef(100);
  const nextId = useCallback((prefix) => `${prefix}${++counter.current}`, []);
  const accounts = useAccounts({ nextId, setSelection });
  const { faculty, students, user, session } = accounts;
  const getFaculty = useCallback((id) => faculty.find((f) => f.id === id), [faculty]);
  const getStudent = useCallback((id) => students.find((s) => s.id === id), [students]);
  const appointmentActions = useAppointmentActions({
    appointments, setAppointments, slots, user, now, nextId,
  });
  const { getSlot, getAppointment, holderOf, setStatus } = appointmentActions;
  const availability = useFacultyAvailability({
    user, session, slots, setSlots, appointments, nextId,
    getSlot, getAppointment, holderOf, setStatus,
  });

  return {
    now, today, feedback, setFeedback,
    ...accounts,
    slots, appointments, getFaculty, getStudent,
    ...appointmentActions,
    selection, setSelection,
    ...availability,
  };
}
