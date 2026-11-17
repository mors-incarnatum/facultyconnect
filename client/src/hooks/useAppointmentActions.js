import { useCallback } from 'react';
import { apiUrl } from '../utils/api.js';
import { ACTIVE, isRequestOpen } from '../utils/presentation.js';
import { isFutureSlot } from '../utils/clock.js';

export function useAppointmentActions({ appointments, setAppointments, slots, now }) {
    const getSlot = useCallback(function (id) {
        return slots.find(function (slot) {
            return slot.id === id;
        });
    }, [slots]);

    const getAppointment = useCallback(function (id) {
        return appointments.find(function (appointment) {
            return appointment.id === id;
        });
    }, [appointments]);

    const holderOf = useCallback(function (slotId) {
        return appointments.find(function (appointment) {
            return appointment.slotId === slotId && ACTIVE.includes(appointment.status);
        }) || null;
    }, [appointments]);

    const isAvailable = useCallback(function (slot) {
        return isFutureSlot(slot, now) && isRequestOpen(slot, now) && !holderOf(slot.id);
    }, [now, holderOf]);

    const availableSlotsFor = useCallback(function (facultyId) {
        return slots
            .filter(function (slot) {
                return slot.facultyId === facultyId && isAvailable(slot);
            })
            .sort(function (a, b) {
                return (a.date + a.start).localeCompare(b.date + b.start);
            });
    }, [slots, isAvailable]);

    const updateAppointmentState = useCallback(function (id, fields) {
        setAppointments(function (list) {
            return list.map(function (appointment) {
                if (appointment.id === id) {
                    return Object.assign({}, appointment, fields);
                }
                return appointment;
            });
        });
    }, [setAppointments]);

    const createAppointment = useCallback(async function ({ studentId, slotId, subject, topic, description }) {
        try {
            const queryString = new URLSearchParams({ slotId: slotId }).toString();

            const checkRes = await fetch(apiUrl(`/getCheckSlot?${queryString}`), {
                method: 'GET',
            });
            const checkData = await checkRes.json();
            if (!checkData.available) {
                const slot = checkData.slot || getSlot(slotId);
                if (slot && isFutureSlot(slot, new Date()) && !isRequestOpen(slot, new Date())) {
                    return { ok: false, reason: 'closed' };
                }
                return { ok: false, reason: 'conflict' };
            }

            const response = await fetch(apiUrl('/appointments'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: studentId,
                    slotId: slotId,
                    subject: subject,
                    topic: topic,
                    description: description,
                }),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, reason: data.reason || 'conflict', error: data.error };
            }
            setAppointments(function (list) {
                return list.concat([data.appointment]);
            });
            return { ok: true, id: data.id };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, reason: 'conflict', error: 'Unable to reach the server.' };
        }
    }, [getSlot, setAppointments]);

    const updateTopic = useCallback(async function (id, fields) {
        try {

            const response = await fetch(apiUrl(`/appointments/${encodeURIComponent(id)}/topic`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fields),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error };
            }
            updateAppointmentState(id, data.appointment || fields);
            return { ok: true };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, [updateAppointmentState]);

    const deleteTopic = useCallback(async function (id) {
        try {

            const response = await fetch(apiUrl(`/appointments/${encodeURIComponent(id)}/delete-topic`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error };
            }
            updateAppointmentState(id, data.appointment || { topic: null, description: null });
            return { ok: true };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, [updateAppointmentState]);

    const setStatus = useCallback(async function (id, status) {
        try {

            const response = await fetch(apiUrl(`/appointments/${encodeURIComponent(id)}/cancel`), {
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
            updateAppointmentState(id, data.appointment || { status: status });
            return { ok: true };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, [updateAppointmentState]);

    return {
        getSlot: getSlot,
        getAppointment: getAppointment,
        holderOf: holderOf,
        isAvailable: isAvailable,
        availableSlotsFor: availableSlotsFor,
        createAppointment: createAppointment,
        updateTopic: updateTopic,
        deleteTopic: deleteTopic,
        setStatus: setStatus,
    };
}
