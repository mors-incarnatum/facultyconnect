import { useMemo, useState } from 'react';
import { initialFaculty, initialStudents } from '../data/initialData.js';
import { AccountService } from '../services/AccountService.js';

export function useAccounts({ nextId, setSelection }) {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [students, setStudents] = useState(initialStudents);
  const [session, setSession] = useState(AccountService.loadSession);
  const service = useMemo(() => new AccountService({
    faculty, students, session, setFaculty, setStudents, setSession, setSelection, nextId,
  }), [faculty, students, session, setSelection, nextId]);
  const user = useMemo(() => service.getUser(), [service]);
  const { signIn, signOut, register } = service;

  return { faculty, students, user, session, signIn, signOut, register };
}
