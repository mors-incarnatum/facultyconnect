import data from './initialData.json' with { type: 'json' };
import { addDays, toIso } from '../utils/format.js';

export const {
  UNIVERSITY,
  SEMESTER,
  departments,
  initialFaculty,
  initialStudents,
} = data;

// Resolve calendar-day offsets once per fresh load in the browser's timezone.
// Keeping this a factory also makes year rollover and cutoff checks deterministic.
export function createDemoData(now = new Date()) {
  const today = toIso(now);
  return {
    initialSlots: data.initialSlots.map(({ dayOffset, ...slot }) => ({
      ...slot, date: addDays(today, dayOffset),
    })),
    initialAppointments: data.initialAppointments.map((appointment) => ({ ...appointment })),
  };
}

export const { initialSlots, initialAppointments } = createDemoData();
