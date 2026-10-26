import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  TODAY, initialAppointments, initialFaculty, initialSlots, initialStudents,
} from "../data/mock.js";

const AppContext = createContext(null);
export const ACTIVE = ["pending", "confirmed"];
export const DEMO_ACCOUNTS = { student: "s1", faculty: "f1" };

const loadSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem("fc-session")) || null;
  } catch {
    return null;
  }
};
const saveSession = (value) => {
  try {
    if (value) sessionStorage.setItem("fc-session", JSON.stringify(value));
    else sessionStorage.removeItem("fc-session");
  } catch {
    /* storage unavailable: session lasts for the page only */
  }
};

export function AppProvider({ children }) {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [students, setStudents] = useState(initialStudents);
  const [slots, setSlots] = useState(initialSlots);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [session, setSession] = useState(loadSession);
  const [selection, setSelection] = useState({ facultyId: null, slotId: null });
  const counter = useRef(100);
  const nextId = (prefix) => `${prefix}${++counter.current}`;

  const user = useMemo(() => {
    if (!session) return null;
    const list = session.role === "student" ? students : faculty;
    const found = list.find((u) => u.id === session.id);
    return found ? { ...found, role: session.role } : null;
  }, [session, students, faculty]);

  const startSession = useCallback((role, id) => {
    const value = { role, id };
    setSession(value);
    saveSession(value);
  }, []);

  const signIn = useCallback(
    (role, email) => {
      const list = role === "student" ? students : faculty;
      const found = list.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) return { ok: false, error: `No ${role} account found for that email address.` };
      startSession(role, found.id);
      return { ok: true };
    },
    [students, faculty, startSession],
  );
  const signInAs = useCallback((role) => startSession(role, DEMO_ACCOUNTS[role]), [startSession]);
  const signOut = useCallback(() => {
    setSession(null);
    saveSession(null);
    setSelection({ facultyId: null, slotId: null });
  }, []);

  const register = useCallback(
    ({ role, name, email, department }) => {
      const list = role === "student" ? students : faculty;
      if (list.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
        return { ok: false, error: "An account with that email address already exists." };
      if (role === "student") {
        setStudents((s) => [...s, { id: nextId("s"), name, email: email.trim(), program: "Undeclared" }]);
      } else {
        setFaculty((f) => [
          ...f,
          {
            id: nextId("f"), name, email: email.trim(), rank: "Faculty", department: department || "Computer Science",
            subjects: [], courses: [], office: "To be announced", color: "#2d5a48", bio: "Profile details coming soon.",
          },
        ]);
      }
      return { ok: true };
    },
    [students, faculty], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ---- lookups --------------------------------------------------------
  const getFaculty = useCallback((id) => faculty.find((f) => f.id === id), [faculty]);
  const getStudent = useCallback((id) => students.find((s) => s.id === id), [students]);
  const getSlot = useCallback((id) => slots.find((s) => s.id === id), [slots]);
  const getAppointment = useCallback((id) => appointments.find((a) => a.id === id), [appointments]);

  /** The appointment currently holding a slot (pending/confirmed), if any. */
  const holderOf = useCallback(
    (slotId) => appointments.find((a) => a.slotId === slotId && ACTIVE.includes(a.status)) || null,
    [appointments],
  );
  const isAvailable = useCallback(
    (slot) => !!slot && slot.date >= TODAY && !holderOf(slot.id),
    [holderOf],
  );
  const bySlotTime = (a, b) => (a.date + a.start).localeCompare(b.date + b.start);
  const availableSlotsFor = useCallback(
    (facultyId) => slots.filter((s) => s.facultyId === facultyId && isAvailable(s)).sort(bySlotTime),
    [slots, isAvailable],
  );

  // ---- student actions ------------------------------------------------
  const createAppointment = useCallback(
    ({ studentId, slotId, subject, topic, description }) => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot || !isAvailable(slot)) return { ok: false, reason: "conflict" };
      const id = nextId("a");
      setAppointments((list) => [
        ...list,
        { id, studentId, slotId, status: "pending", subject, topic, description },
      ]);
      return { ok: true, id };
    },
    [slots, isAvailable], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const updateTopic = useCallback((id, fields) => {
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  }, []);
  const deleteTopic = useCallback((id) => {
    setAppointments((list) =>
      list.map((a) => (a.id === id ? { ...a, topic: null, description: null } : a)),
    );
  }, []);
  const setStatus = useCallback((id, status) => {
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const value = {
    user, session, signIn, signInAs, signOut, register,
    faculty, students, slots, appointments,
    getFaculty, getStudent, getSlot, getAppointment, holderOf, isAvailable, availableSlotsFor,
    selection, setSelection,
    createAppointment, updateTopic, deleteTopic, setStatus,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);

/** Appointment joined with its slot, faculty and student for display. */
export function useDetailed() {
  const { appointments, getSlot, getFaculty, getStudent } = useApp();
  return useCallback(
    (a) => ({ ...a, slot: getSlot(a.slotId), faculty: getFaculty(getSlot(a.slotId)?.facultyId), student: getStudent(a.studentId) }),
    [getSlot, getFaculty, getStudent, appointments], // eslint-disable-line react-hooks/exhaustive-deps
  );
}
