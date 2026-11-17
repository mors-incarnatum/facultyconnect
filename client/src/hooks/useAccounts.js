import { useCallback, useMemo, useState } from 'react';
import { apiUrl } from '../utils/api.js';

function loadSession() {
    try {
        return JSON.parse(sessionStorage.getItem('fc-session')) || null;
    } catch (err) {
        return null;
    }
}

function saveSession(value) {
    try {
        if (value) {
            sessionStorage.setItem('fc-session', JSON.stringify(value));
        } else {
            sessionStorage.removeItem('fc-session');
        }
    } catch (err) {

    }
}

export function useAccounts({ setSelection }) {
    const [faculty, setFaculty] = useState([]);
    const [students, setStudents] = useState([]);
    const [session, setSession] = useState(loadSession);

    const user = useMemo(function () {
        if (!session) {
            return null;
        }
        const list = session.role === 'student' ? students : faculty;
        const found = list.find(function (entry) {
            return entry.id === session.id;
        });
        if (!found) {
            return null;
        }
        return Object.assign({}, found, { role: session.role });
    }, [session, students, faculty]);

    const checkEmail = useCallback(async function (email) {
        const trimmed = email.trim();
        if (!trimmed) {
            return { exists: false };
        }
        try {
            const queryString = new URLSearchParams({ email: trimmed }).toString();

            const response = await fetch(apiUrl(`/getCheckEmail?${queryString}`), {
                method: 'GET',
            });
            const text = await response.text();
            if (!text) {
                return { exists: false };
            }
            const data = JSON.parse(text);
            return { exists: Boolean(data && data.email) };
        } catch (err) {
            console.error('Request error:', err);
            return { exists: false };
        }
    }, []);

    const signIn = useCallback(async function (email, password) {
        try {

            const response = await fetch(apiUrl('/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email, password: password }),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error || 'No account found for that email address.' };
            }

            if (data.role === 'student') {
                setStudents(function (list) {
                    const alreadyListed = list.some(function (u) {
                        return u.id === data.user.id;
                    });
                    return alreadyListed ? list : list.concat([data.user]);
                });
            } else {
                setFaculty(function (list) {
                    const alreadyListed = list.some(function (u) {
                        return u.id === data.user.id;
                    });
                    return alreadyListed ? list : list.concat([data.user]);
                });
            }

            const nextSession = { role: data.role, id: data.user.id };
            setSession(nextSession);
            saveSession(nextSession);
            return { ok: true, role: data.role };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, []);

    const signOut = useCallback(function () {
        setSession(null);
        saveSession(null);
        setSelection({ facultyId: null, slotId: null });
    }, [setSelection]);

    const register = useCallback(async function ({ role, name, email, department, password }) {
        try {

            const response = await fetch(apiUrl('/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: role,
                    name: name,
                    email: email,
                    department: department,
                    password: password,
                }),
            });
            const data = await response.json();
            if (!data.ok) {
                return { ok: false, error: data.error || 'Unable to create account.' };
            }

            if (data.user.role === 'student') {
                setStudents(function (list) {
                    return list.concat([data.user]);
                });
            } else {
                setFaculty(function (list) {
                    return list.concat([data.user]);
                });
            }
            return { ok: true, user: data.user };
        } catch (err) {
            console.error('Request error:', err);
            return { ok: false, error: 'Unable to reach the server.' };
        }
    }, []);

    return {
        faculty: faculty,
        students: students,
        setFaculty: setFaculty,
        setStudents: setStudents,
        user: user,
        session: session,
        signIn: signIn,
        signOut: signOut,
        register: register,
        checkEmail: checkEmail,
    };
}
