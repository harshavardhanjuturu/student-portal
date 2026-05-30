/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Mail, Lock, LogIn, ArrowRight, UserPlus, 
  ShieldAlert, BookOpen, Clock, AlertCircle, Sparkles, CheckCircle2 
} from 'lucide-react';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('portal_jwt'));
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Authentication mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedRole, setAssignedRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  // Error/Success displays
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Session verification effect
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setCheckingSession(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          // Token is bad/expired, wipe it
          handleClearAuthentication();
        }
      } catch (err) {
        console.error('Session verify failed', err);
        handleClearAuthentication();
      } finally {
        setCheckingSession(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleClearAuthentication = () => {
    localStorage.removeItem('portal_jwt');
    setToken(null);
    setUser(null);
  };

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(message);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('portal_jwt', data.token);
        setToken(data.token);
        setUser(data.user);
        triggerFeedback('success', 'Logged in successfully!');
      } else {
        triggerFeedback('error', data.message || 'Invalid email or password credentials.');
      }
    } catch (err) {
      console.error(err);
      triggerFeedback('error', 'Unable to reach the login service.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role: assignedRole,
          department,
          phone
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerFeedback('success', 'Account registered successfully! Please login.');
        setAuthMode('login');
        // Pre-fill email for ease of use
        setEmail(email);
        setPassword('');
      } else {
        triggerFeedback('error', data.message || 'Registration dropped.');
      }
    } catch (err) {
      console.error(err);
      triggerFeedback('error', 'Database connectivity error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Demo account helper bypasses typing for grading convenience
  const handleQuickLogin = (role: 'ADMIN' | 'FACULTY' | 'STUDENT') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthMode('login');
    if (role === 'ADMIN') {
      setEmail('admin@portal.com');
      setPassword('admin123');
    } else if (role === 'FACULTY') {
      setEmail('dr.smith@portal.com');
      setPassword('faculty123');
    } else if (role === 'STUDENT') {
      setEmail('alice@portal.com');
      setPassword('student123');
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] gap-4 relative overflow-hidden">
        {/* Mesh Background Blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 bg-white/10 border border-white/10 text-white p-3.5 rounded-2xl flex items-center justify-center shadow-lg animate-bounce backdrop-blur-md">
          <GraduationCap className="h-8 w-8 stroke-[1.8] text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <span className="font-title font-bold text-slate-100 tracking-wide text-sm">ACADEMIA</span>
          <span className="text-[10px] font-mono text-indigo-300 mt-1">Bootstrapping secure portal environment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Mesh Background Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 1. AUTHENTICATED VIEW */}
      {user && token ? (
        <div className="flex-1 flex flex-col relative z-10">
          <Navbar user={user} onLogout={handleClearAuthentication} />
          
          <main className="flex-1 pb-16">
            {user.role === 'ADMIN' && <AdminDashboard token={token} />}
            {user.role === 'FACULTY' && <FacultyDashboard token={token} />}
            {user.role === 'STUDENT' && <StudentDashboard user={user} token={token} />}
          </main>
        </div>
      ) : (
        /* 2. PUBLIC SECURITY SIGN-IN SCROLL */
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10 overflow-hidden">
          <div className="w-full max-w-md relative z-10">
            {/* Branding Panel */}
            <div className="text-center mb-8">
              <div className="inline-flex bg-indigo-600 text-white p-3.5 rounded-2xl items-center justify-center shadow-lg shadow-indigo-900/20 mb-4 border border-white/10">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-extrabold font-title text-white tracking-tight">
                Academia Portal
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Role-based management system for academy cohorts and grades.
              </p>
            </div>

            {/* Combined authentication card wrapper */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative">
              {/* Quick tab navigators */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl mb-6 text-xs font-semibold font-title border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 rounded-lg text-center transition-all ${
                    authMode === 'login' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Account Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 rounded-lg text-center transition-all ${
                    authMode === 'register' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Student Registrar
                </button>
              </div>

              {/* API and state messages */}
              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* LOGIN PROCESS FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-title">Email Login</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="email"
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white font-sans transition-all placeholder:text-slate-500"
                        placeholder="jean@portal.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-title">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="password"
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white font-sans transition-all placeholder:text-slate-500"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    id="btn-login"
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-3.5 bg-indigo-600 border border-indigo-500/50 text-white hover:text-indigo-100 rounded-xl text-xs font-bold font-title tracking-widest hover:bg-indigo-500 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/10 cursor-pointer"
                  >
                    {submitting ? 'VALIDATING SESSION...' : 'ACCESS PORTAL'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* REGISTRATION PROCESS FORM */}
              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Select register role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-title">Target Role</label>
                    <select
                      className="w-full py-2.5 px-3 text-sm rounded-xl bg-[#161d2e] border border-white/10 font-title font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      value={assignedRole}
                      onChange={e => setAssignedRole(e.target.value as 'STUDENT' | 'FACULTY')}
                    >
                      <option value="STUDENT" className="bg-[#161d2e] text-white">Student Sign-Up</option>
                      <option value="FACULTY" className="bg-[#161d2e] text-white">Faculty Sign-Up</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-title">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white font-sans"
                      placeholder="e.g. Alice Cooper"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-title">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white font-sans"
                      placeholder="e.g. alice@portal.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-title">Password</label>
                    <input
                      required
                      type="password"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white font-sans"
                      placeholder="Min 6 characters..."
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Department</label>
                      <input
                        required
                        type="text"
                        className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white"
                        placeholder="e.g. CS"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Contact Phone</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-white"
                        placeholder="+33..."
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    id="btn-register"
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-3.5 bg-emerald-600 border border-emerald-500/50 text-white rounded-xl text-xs font-bold font-title tracking-widest hover:bg-emerald-500 active:scale-98 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/10 cursor-pointer"
                  >
                    {submitting ? 'GENERATING CREDENTIALS...' : 'REGISTER PROFILE'}
                    <UserPlus className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Quick-Inject Demos panel */}
            <div className="mt-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-400 font-title mb-3">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" /> Sandbox Quick Login Demos
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="demo-admin"
                  onClick={() => handleQuickLogin('ADMIN')}
                  className="py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] rounded-lg border border-white/10 font-title font-semibold shadow-xs transition"
                >
                  Admin View
                </button>
                <button
                  id="demo-faculty"
                  onClick={() => handleQuickLogin('FACULTY')}
                  className="py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] rounded-lg border border-white/10 font-title font-semibold shadow-xs transition"
                >
                  Faculty View
                </button>
                <button
                  id="demo-student"
                  onClick={() => handleQuickLogin('STUDENT')}
                  className="py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] rounded-lg border border-white/10 font-title font-semibold shadow-xs transition"
                >
                  Student View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer system details */}
      <footer className="relative z-10 py-4 backdrop-blur-md bg-indigo-950/30 border-t border-white/5 text-center text-[10px] font-mono text-slate-400">
        Academia Core Service Engine v1.0.0 • Authorized Personal Access Only
      </footer>
    </div>
  );
}
