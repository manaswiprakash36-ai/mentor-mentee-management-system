import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getAuthToken, setAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [mentor, setMentor] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Check existing sessions on mount for all roles
  useEffect(() => {
    async function initAuth() {
      // 1. Check Mentor Session
      const mentorToken = getAuthToken('mentor');
      if (mentorToken) {
        try {
          const res = await apiRequest('/auth/me', { token: mentorToken, role: 'mentor' });
          if (res.mentor) setMentor(res.mentor);
        } catch (e) {
          setAuthToken(null, 'mentor');
        }
      }

      // 2. Check Admin Session
      const adminToken = getAuthToken('admin');
      if (adminToken) {
        try {
          const res = await apiRequest('/auth/me', { token: adminToken, role: 'admin' });
          if (res.role === 'admin' && res.user) {
            setAdmin(res.user);
          }
        } catch (e) {
          setAuthToken(null, 'admin');
        }
      }

      // 3. Check Student Session
      const studentToken = getAuthToken('student');
      if (studentToken) {
        try {
          const res = await apiRequest('/auth/me', { token: studentToken, role: 'student' });
          if (res.role === 'student' && res.student) {
            setStudent(res.student);
          }
        } catch (e) {
          setAuthToken(null, 'student');
        }
      }

      setLoading(false);
    }

    initAuth();

    function handleAuthExpired(e) {
      const expiredRole = e.detail?.role;
      if (expiredRole === 'admin') setAdmin(null);
      else if (expiredRole === 'student') setStudent(null);
      else setMentor(null);
    }

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // 1. Mentor Login
  async function loginMentor(email, password) {
    setAuthError('');
    try {
      const data = await apiRequest('/auth/mentor/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(data.token, 'mentor');
      setMentor(data.mentor || data.user);
      return data.mentor;
    } catch (err) {
      setAuthError(err.message || 'Mentor login failed');
      throw err;
    }
  }

  // 2. Admin Login
  async function loginAdmin(email, password) {
    setAuthError('');
    try {
      const data = await apiRequest('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(data.token, 'admin');
      setAdmin(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message || 'Admin authentication failed');
      throw err;
    }
  }

  // 3. Student Login
  async function loginStudent(identifier, password) {
    setAuthError('');
    try {
      const data = await apiRequest('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      setAuthToken(data.token, 'student');
      setStudent(data.student || data.user);
      return data.student;
    } catch (err) {
      setAuthError(err.message || 'Student login failed');
      throw err;
    }
  }

  // Legacy default login (maps to loginMentor)
  async function login(email, password) {
    return loginMentor(email, password);
  }

  // Logout by portal role
  function logout(role = 'mentor') {
    setAuthToken(null, role);
    if (role === 'admin') setAdmin(null);
    else if (role === 'student') setStudent(null);
    else setMentor(null);
  }

  function updateMentorState(updatedMentor) {
    setMentor((prev) => ({ ...prev, ...updatedMentor }));
  }

  function updateStudentState(updatedStudent) {
    setStudent((prev) => ({ ...prev, ...updatedStudent }));
  }

  return (
    <AuthContext.Provider
      value={{
        mentor,
        admin,
        student,
        loading,
        authError,
        isAuthenticated: !!mentor,
        isAdminAuthenticated: !!admin,
        isStudentAuthenticated: !!student,
        login,
        loginMentor,
        loginAdmin,
        loginStudent,
        logout,
        updateMentorState,
        updateStudentState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
