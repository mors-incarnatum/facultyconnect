export class AccountService {
  constructor({ faculty, students, session, setFaculty, setStudents, setSession, setSelection, nextId }) {
    Object.assign(this, { faculty, students, session, setFaculty, setStudents, setSession, setSelection, nextId });
  }

  static loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem('fc-session')) || null;
    } catch {
      return null;
    }
  }

  static saveSession(value) {
    try {
      if (value) sessionStorage.setItem('fc-session', JSON.stringify(value));
      else sessionStorage.removeItem('fc-session');
    } catch {
      /* storage unavailable: session lasts for the page only */
    }
  }

  getUser() {
    if (!this.session) return null;
    const list = this.session.role === 'student' ? this.students : this.faculty;
    const found = list.find((user) => user.id === this.session.id);
    return found ? { ...found, role: this.session.role } : null;
  }

  signIn = (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const student = this.students.find((user) => user.email.toLowerCase() === normalizedEmail);
    const found = student || this.faculty.find((user) => user.email.toLowerCase() === normalizedEmail);
    if (!found) return { ok: false, error: 'No account found for that email address.' };
    const role = student ? 'student' : 'faculty';
    const session = { role, id: found.id };
    this.setSession(session);
    AccountService.saveSession(session);
    return { ok: true, role };
  };

  signOut = () => {
    this.setSession(null);
    AccountService.saveSession(null);
    this.setSelection({ facultyId: null, slotId: null });
  };

  register = ({ role, name, email, department }) => {
    if ([...this.students, ...this.faculty].some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) {
      return { ok: false, error: 'An account with that email address already exists.' };
    }
    if (role === 'student') {
      const student = { id: this.nextId('s'), name, email: email.trim(), program: 'Undeclared' };
      this.setStudents((list) => [...list, student]);
    } else {
      const facultyMember = {
        id: this.nextId('f'), name, email: email.trim(), rank: 'Faculty', department: department || 'Software Technology',
        subjects: [], courses: [], office: 'To be announced', color: '#2d5a48', bio: 'Profile details coming soon.',
      };
      this.setFaculty((list) => [...list, facultyMember]);
    }
    return { ok: true };
  };
}
