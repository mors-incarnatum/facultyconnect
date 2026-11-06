import { useMemo, useState } from 'react';
import { defaultWeeklyHours } from '../state/availability.js';
import { AvailabilityService } from '../services/AvailabilityService.js';
import { useScheduleDrafts } from './useScheduleDrafts.js';

export function useFacultyAvailability({
  user, session, slots, setSlots, appointments, nextId, getSlot, getAppointment, holderOf, setStatus,
}) {
  const [schedules, setSchedules] = useState({});
  const draftKey = session?.role === "faculty" ? session.id : "";
  const { scheduleDraft, setScheduleDraft } = useScheduleDrafts(draftKey);

  const service = useMemo(() => new AvailabilityService({
    user, slots, setSlots, appointments, nextId, getSlot, getAppointment, holderOf, setStatus,
    setSchedules, setScheduleDraft,
  }), [user, slots, setSlots, appointments, nextId, getSlot, getAppointment, holderOf, setStatus, setScheduleDraft]);
  const { updateFacultyStatus, saveFacultySlot, removeFacultySlot, saveFacultySchedule } = service;
  const facultySchedule = schedules[user?.id] || { weekly: defaultWeeklyHours(), exceptions: [], location: user?.office || '', weeks: 4 };

  return {
    scheduleDraft, setScheduleDraft, facultySchedule,
    updateFacultyStatus, saveFacultySlot, removeFacultySlot, saveFacultySchedule,
  };
}
