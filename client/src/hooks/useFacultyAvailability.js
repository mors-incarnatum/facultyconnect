import { useCallback, useState } from 'react';
import { apiUrl } from '../utils/api.js';
import { defaultWeeklyHours } from '../utils/presentation.js';
import { useScheduleDrafts } from './useScheduleDrafts.js';

export function useFacultyAvailability({
    user, session, setSlots, setAppointments,
}) {
    const [schedules, setSchedules] = useState({});
    const draftKey = session && session.role === 'faculty' ? session.id : '';
    const { scheduleDraft, setScheduleDraft } = useScheduleDrafts(draftKey);

    const updateFacultyStatus = useCallback(async function (id, status) {
        try {

            const response = await fetch(apiUrl(`/faculty/consultations/${encodeURIComponent(id)}/status`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status }),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error };
            }
            setAppointments(function (list) {
                return list.map(function (appointment) {
                    if (appointment.id === id) {
                        return data.appointment || Object.assign({}, appointment, { status: status });
                    }
                    return appointment;
                });
            });
            return { ok: true };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, [setAppointments]);

    const saveFacultySlot = useCallback(async function (fields, id) {
        try {
            const endpoint = id ? apiUrl(`/faculty/slots/${encodeURIComponent(id)}`) : apiUrl('/faculty/slots');

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facultyId: user ? user.id : undefined,
                    date: fields.date,
                    start: fields.start,
                    end: fields.end,
                    mode: fields.mode,
                    location: fields.location,
                    source: fields.source,
                }),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error };
            }
            setSlots(function (prev) {
                if (id) {
                    return prev.map(function (existing) {
                        return existing.id === id ? data.slot : existing;
                    });
                }
                return prev.concat([data.slot]);
            });
            return { ok: true, id: data.id, slot: data.slot };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, [user, setSlots]);

    const removeFacultySlot = useCallback(async function (id) {
        try {

            const response = await fetch(apiUrl(`/faculty/slots/${encodeURIComponent(id)}/remove`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ facultyId: user ? user.id : undefined }),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error };
            }
            setSlots(function (prev) {
                return prev.filter(function (existing) {
                    return existing.id !== id;
                });
            });
            return { ok: true, slot: data.slot };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, [user, setSlots]);

    const saveFacultySchedule = useCallback(async function (schedule) {
        try {

            const response = await fetch(apiUrl('/faculty/schedule'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facultyId: user ? user.id : undefined,
                    schedule: schedule,
                }),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error };
            }
            if (Array.isArray(data.slots)) {
                setSlots(data.slots);
            }
            if (data.schedule && user && user.id) {
                setSchedules(function (s) {
                    return Object.assign({}, s, { [user.id]: data.schedule });
                });
            }
            setScheduleDraft(null);
            return { ok: true };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, [user, setSlots, setScheduleDraft]);

    const facultySchedule = (user && schedules[user.id]) || {
        weekly: defaultWeeklyHours(),
        exceptions: [],
        location: (user && user.office) || '',
        weeks: 4,
    };

    return {
        schedules: schedules,
        setSchedules: setSchedules,
        scheduleDraft: scheduleDraft,
        setScheduleDraft: setScheduleDraft,
        facultySchedule: facultySchedule,
        updateFacultyStatus: updateFacultyStatus,
        saveFacultySlot: saveFacultySlot,
        removeFacultySlot: removeFacultySlot,
        saveFacultySchedule: saveFacultySchedule,
    };
}
