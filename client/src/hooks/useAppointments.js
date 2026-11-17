import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from './useApp.js';

export function useDetailed() {
    const { getSlot, getFaculty, getStudent } = useApp();
    return useCallback(function (appointment) {
        const slot = getSlot(appointment.slotId);
        return Object.assign({}, appointment, {
            slot: slot,
            faculty: getFaculty(slot ? slot.facultyId : undefined),
            student: getStudent(appointment.studentId),
        });
    }, [getSlot, getFaculty, getStudent]);
}

export function useFacultyRecords() {
    const { user, appointments, getSlot } = useApp();
    const detail = useDetailed();
    return appointments
        .filter(function (a) {
            const slot = getSlot(a.slotId);
            return Boolean(user && user.role === 'faculty' && slot && slot.facultyId === user.id);
        })
        .map(detail)
        .sort(function (a, b) {
            return (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start);
        });
}

export function useStudentRecords() {
    const { user, appointments } = useApp();
    const detail = useDetailed();
    return appointments
        .filter(function (appointment) {
            return Boolean(user && user.role === 'student' && appointment.studentId === user.id);
        })
        .map(detail);
}

export function useAppointment() {
    const { id } = useParams();
    const { user, getAppointment, getSlot } = useApp();
    const detail = useDetailed();
    const appointment = getAppointment(id);
    if (!appointment) {
        return null;
    }
    const slot = getSlot(appointment.slotId);
    const ownsAppointment = user && user.role === 'student'
        ? appointment.studentId === user.id
        : Boolean(user && user.role === 'faculty' && slot && slot.facultyId === user.id);
    return ownsAppointment ? detail(appointment) : null;
}
