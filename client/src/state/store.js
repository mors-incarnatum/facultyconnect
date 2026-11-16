(function (FC) {
  'use strict';

  const {
    initialAppointments,
    initialFaculty,
    initialStudents,
    initialSlots,
    AccountService,
    AppointmentService,
    AvailabilityService,
    localDate,
    applyAutoDecline,
    defaultWeeklyHours,
  } = FC;

  const state = {
    now: new Date(),
    slots: initialSlots,
    rawAppointments: initialAppointments,
    faculty: initialFaculty,
    students: initialStudents,
    session: AccountService.loadSession(),
    selection: { facultyId: null, slotId: null },
    feedback: '',
    schedules: {},
    drafts: {},
    counter: 100,
  };

  const listeners = new Set();
  const pendingReasons = new Set();
  let scheduledFlush = false;
  let beforeUnloadAttached = false;

  function handleBeforeUnload(event) {
    event.preventDefault();
    event.returnValue = '';
  }

  function syncBeforeUnload() {
    const draftKey = state.session?.role === 'faculty' ? state.session.id : '';
    const hasDraft = Boolean(draftKey && state.drafts[draftKey]);
    if (hasDraft && !beforeUnloadAttached) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      beforeUnloadAttached = true;
    } else if (!hasDraft && beforeUnloadAttached) {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      beforeUnloadAttached = false;
    }
  }

  function clearPendingStoreReasons() {
    pendingReasons.clear();
    scheduledFlush = false;
  }

  function flushStore() {
    scheduledFlush = false;
    if (!pendingReasons.size) return;
    const reasons = new Set(pendingReasons);
    pendingReasons.clear();
    for (const listener of [...listeners]) {
      listener(reasons);
    }
  }

  function queueNotify(reason) {
    pendingReasons.add(reason);
    if (scheduledFlush) return;
    scheduledFlush = true;
    queueMicrotask(flushStore);
  }

  function applyUpdate(key, updater, reason) {
    const prev = state[key];
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (Object.is(next, prev)) return;
    state[key] = next;
    if (key === 'session' || key === 'drafts') {
      syncBeforeUnload();
    }
    if (reason) {
      queueNotify(reason);
    }
  }

  const nextId = (prefix) => `${prefix}${++state.counter}`;
  const setSlots = (updater) => applyUpdate('slots', updater, 'data');
  const setAppointments = (updater) => applyUpdate('rawAppointments', updater, 'data');
  const setFaculty = (updater) => applyUpdate('faculty', updater, 'data');
  const setStudents = (updater) => applyUpdate('students', updater, 'data');
  const setSession = (updater) => applyUpdate('session', updater, 'auth');
  const setSelection = (updater) => applyUpdate('selection', updater, 'selection');
  const setFeedback = (updater) => applyUpdate('feedback', updater, 'feedback');
  const setSchedules = (updater) => applyUpdate('schedules', updater, 'data');

  const setScheduleDraft = (draft, options = {}) => {
    const draftKey = state.session?.role === 'faculty' ? state.session.id : '';
    const prevDraft = state.drafts[draftKey];
    if (Object.is(prevDraft, draft)) return;
    state.drafts = { ...state.drafts, [draftKey]: draft };
    syncBeforeUnload();
    if (!options.silent) {
      queueNotify(options.reason || 'draft');
    }
  };

  function getApp() {
    const { now, slots, rawAppointments, faculty, students, session, selection, feedback, schedules, drafts } = state;
    const today = localDate(now);
    const appointments = applyAutoDecline(rawAppointments, slots, now);

    const accountService = new AccountService({
      faculty,
      students,
      session,
      setFaculty,
      setStudents,
      setSession,
      setSelection,
      nextId,
    });
    const user = accountService.getUser();

    const getFaculty = (id) => faculty.find((f) => f.id === id);
    const getStudent = (id) => students.find((s) => s.id === id);

    const appointmentService = new AppointmentService({
      appointments,
      setAppointments,
      slots,
      user,
      now,
      nextId,
    });

    const draftKey = session?.role === 'faculty' ? session.id : '';
    const scheduleDraft = drafts[draftKey];

    const availabilityService = new AvailabilityService({
      user,
      slots,
      setSlots,
      appointments,
      nextId,
      getSlot: appointmentService.getSlot,
      getAppointment: appointmentService.getAppointment,
      holderOf: appointmentService.holderOf,
      setStatus: appointmentService.setStatus,
      setSchedules,
      setScheduleDraft,
    });

    const facultySchedule = schedules[user?.id] || {
      weekly: defaultWeeklyHours(),
      exceptions: [],
      location: user?.office || '',
      weeks: 4,
    };

    return {
      now,
      today,
      feedback,
      setFeedback,
      faculty,
      students,
      user,
      session,
      signIn: accountService.signIn,
      signOut: accountService.signOut,
      register: accountService.register,
      slots,
      appointments,
      getFaculty,
      getStudent,
      getSlot: appointmentService.getSlot,
      getAppointment: appointmentService.getAppointment,
      holderOf: appointmentService.holderOf,
      isAvailable: appointmentService.isAvailable,
      availableSlotsFor: appointmentService.availableSlotsFor,
      createAppointment: appointmentService.createAppointment,
      updateTopic: appointmentService.updateTopic,
      deleteTopic: appointmentService.deleteTopic,
      setStatus: appointmentService.setStatus,
      selection,
      setSelection,
      scheduleDraft,
      setScheduleDraft,
      facultySchedule,
      updateFacultyStatus: availabilityService.updateFacultyStatus,
      saveFacultySlot: availabilityService.saveFacultySlot,
      removeFacultySlot: availabilityService.removeFacultySlot,
      saveFacultySchedule: availabilityService.saveFacultySchedule,
    };
  }

  function subscribeStore(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function detailAppointment(appointment) {
    const { getSlot, getFaculty, getStudent } = getApp();
    const slot = getSlot(appointment.slotId);
    return {
      ...appointment,
      slot,
      faculty: getFaculty(slot?.facultyId),
      student: getStudent(appointment.studentId),
    };
  }

  function getFacultyRecords() {
    const { user, appointments, getSlot } = getApp();
    return appointments
      .filter((a) => user?.role === 'faculty' && getSlot(a.slotId)?.facultyId === user.id)
      .map(detailAppointment)
      .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start));
  }

  function getStudentRecords() {
    const { user, appointments } = getApp();
    return appointments
      .filter((appointment) => user?.role === 'student' && appointment.studentId === user.id)
      .map(detailAppointment);
  }

  function getOwnedAppointment(id) {
    const { user, getAppointment, getSlot } = getApp();
    const appointment = getAppointment(id);
    if (!appointment) return null;
    const ownsAppointment = user?.role === 'student'
      ? appointment.studentId === user.id
      : user?.role === 'faculty' && getSlot(appointment.slotId)?.facultyId === user.id;
    return ownsAppointment ? detailAppointment(appointment) : null;
  }

  function getFacultyResults(searchParams) {
    const { faculty } = getApp();
    const q = searchParams.get('q') || '';
    const dept = searchParams.get('dept') || '';
    const term = q.trim().toLowerCase();
    const results = faculty.filter((f) => {
      if (dept && f.department !== dept) return false;
      if (!term) return true;
      return [f.name, f.department, ...f.subjects, ...f.courses].join(' ').toLowerCase().includes(term);
    });
    return { q, dept, results };
  }

  let clockTimer;
  function startClock() {
    const refresh = () => {
      const current = new Date();
      if (current.getTime() !== state.now.getTime()) {
        if (listeners.size) {
          applyUpdate('now', current, 'clock');
        } else {
          state.now = current;
        }
      }
      clearTimeout(clockTimer);
      clockTimer = setTimeout(refresh, 60000 - (current.getTime() % 60000));
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
  }

  startClock();

  Object.assign(FC, {
    clearPendingStoreReasons,
    flushStore,
    getApp,
    subscribeStore,
    detailAppointment,
    getFacultyRecords,
    getStudentRecords,
    getOwnedAppointment,
    getFacultyResults,
  });
})(globalThis.FC = globalThis.FC || {});
