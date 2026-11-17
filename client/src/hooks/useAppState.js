import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../utils/api.js';
import { applyAutoDecline } from '../utils/presentation.js';
import { localDate } from '../utils/clock.js';
import { useAccounts } from './useAccounts.js';
import { useAppointmentActions } from './useAppointmentActions.js';
import { useClock } from './useClock.js';
import { useFacultyAvailability } from './useFacultyAvailability.js';

export function useAppState() {
    const now = useClock();
    const today = localDate(now);
    const [slots, setSlots] = useState([]);
    const [rawAppointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const appointments = useMemo(function () {
        return applyAutoDecline(rawAppointments, slots, now);
    }, [rawAppointments, slots, now]);
    const [selection, setSelection] = useState({ facultyId: null, slotId: null });
    const [feedback, setFeedback] = useState('');

    const accounts = useAccounts({ setSelection: setSelection });
    const faculty = accounts.faculty;
    const students = accounts.students;
    const setFaculty = accounts.setFaculty;
    const setStudents = accounts.setStudents;
    const user = accounts.user;
    const session = accounts.session;

    const getFaculty = useCallback(function (id) {
        return faculty.find(function (f) {
            return f.id === id;
        });
    }, [faculty]);

    const getStudent = useCallback(function (id) {
        return students.find(function (s) {
            return s.id === id;
        });
    }, [students]);

    const appointmentActions = useAppointmentActions({
        appointments: appointments,
        setAppointments: setAppointments,
        slots: slots,
        now: now,
    });

    const availability = useFacultyAvailability({
        user: user,
        session: session,
        setSlots: setSlots,
        setAppointments: setAppointments,
    });
    const setSchedules = availability.setSchedules;

    useEffect(function () {
        let cancelled = false;

        async function loadApplication() {
            try {

                const response = await fetch(apiUrl('/bootstrap'), {
                    method: 'GET',
                });
                const data = await response.json();
                if (cancelled || !data) {
                    return;
                }
                if (Array.isArray(data.faculty)) {
                    setFaculty(data.faculty);
                }
                if (Array.isArray(data.students)) {
                    setStudents(data.students);
                }
                if (Array.isArray(data.slots)) {
                    setSlots(data.slots);
                }
                if (Array.isArray(data.appointments)) {
                    setAppointments(data.appointments);
                }
                if (data.schedules) {
                    setSchedules(data.schedules);
                }
            } catch (err) {
                console.error('Request error:', err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadApplication();
        return function () {
            cancelled = true;
        };
    }, [setFaculty, setStudents, setSchedules]);

    return Object.assign(
        {
            loading: loading,
            now: now,
            today: today,
            feedback: feedback,
            setFeedback: setFeedback,
            slots: slots,
            appointments: appointments,
            getFaculty: getFaculty,
            getStudent: getStudent,
            selection: selection,
            setSelection: setSelection,
        },
        accounts,
        appointmentActions,
        availability
    );
}
