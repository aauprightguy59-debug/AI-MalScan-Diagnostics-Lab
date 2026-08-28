/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck, Lock, User, Key, Building2, AlertCircle,
  Eye, EyeOff, Cpu, UserPlus, BriefcaseBusiness
} from 'lucide-react';
import { ChiefTechnician, LabStaffAccount } from '../types';
import malariaLogo from '../public/assets/images/malaria_lab_logo_1783687025061.jpg';

interface TechnicianLoginProps {
  onLogin: (technician: ChiefTechnician) => void;
}

export default function TechnicianLogin({ onLogin }: TechnicianLoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [labName, setLabName] = useState('JADSL ICT Unit Community Center Lab - Gboko');
  const [name, setName] = useState('Dr. Emmanuel Orkaa, MLS');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newLabName, setNewLabName] = useState('');
  const [newRole, setNewRole] = useState<'Chief Lab Technician' | 'Senior Parasitologist' | 'Quality Control Director'>('Chief Lab Technician');
  const [newLicense, setNewLicense] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');

  const createTechnicianSession = (tech: LabStaffAccount): ChiefTechnician => ({
    id: tech.id,
    name: tech.name,
    title: tech.title,
    licenseNumber: tech.licenseNumber,
    facility: tech.facility,
    role: tech.role,
    loginTime: new Date().toISOString()
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!labName.trim()) {
      setError('Diagnostic Lab Name is mandatory to identify the testing laboratory.');
      return;
    }
    if (!name.trim()) {
      setError('Laboratory staff name is mandatory to access the diagnostic suite.');
      return;
    }
    if (!password.trim()) {
      setError('Login Password is required to unlock diagnostic instruments.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labName: labName.trim(),
          name: name.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'No matching laboratory staff account was found.');
        setIsSubmitting(false);
        return;
      }

      const technician = data.technician as ChiefTechnician;

      if (rememberMe) {
        localStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
      } else {
        sessionStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
      }

      onLogin(technician);
    } catch (err) {
      console.error('Lab staff login failed', err);
      setError('Unable to authenticate with the laboratory database right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newLabName.trim()) {
      setError('Diagnostic Lab Name is required for the new user account.');
      return;
    }
    if (!newName.trim()) {
      setError('Laboratory staff name is required.');
      return;
    }
    if (!newLicense.trim()) {
      setError('Professional license number is required.');
      return;
    }
    if (!newPassword.trim()) {
      setError('Create a secure login password.');
      return;
    }
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== newConfirmPassword) {
      setError('The password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newLabName: newLabName.trim(),
          newName: newName.trim(),
          newRole,
          newLicense: newLicense.trim(),
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to create the new laboratory staff account.');
        setIsSubmitting(false);
        return;
      }

      const technician = data.technician as ChiefTechnician;

      if (rememberMe) {
        localStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
      } else {
        sessionStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
      }

      onLogin(technician);
   } catch (err) {
      console.error('AI diagnosis request failed:', err);
      alert('Clinical Diagnostic Unit error: Failed to connect to AI Classification service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="technician-login-screen" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-teal-500 selection:text-slate-950">
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative h-9 w-9 rounded-lg overflow-hidden border border-teal-500/30 shrink-0">
              <img
                src={malariaLogo}
                alt="AI-MalScan Malaria Lab Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-tight text-white uppercase">AI-MalScan Suite</span>
                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-teal-400">SECURITY GATEWAY</span>
              </div>
              <p className="text-[10px] text-slate-400">Digital Microscope Parasitemia Diagnostic & National Surveillance</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg text-rose-400 text-[11px] font-mono font-medium">
            <Lock className="h-3.5 w-3.5 text-rose-400" />
            <span>CONSOLE LOCKED: AUTHENTICATION REQUIRED</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-bold tracking-wider uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Restricted Medical Device Access</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-xl shadow-teal-500/20 border border-teal-500/40 shrink-0">
                  <img
                    src={malariaLogo}
                    alt="AI-MalScan Malaria Lab Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight leading-tight">Laboratory Staff Access Portal</h2>
                  <p className="text-xs text-teal-400 font-mono">Authentication & New User Registration</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This digital diagnostic station supports multiple laboratory users. Authorized staff may log in using their facility credentials or create a new account before accessing the microscope workflow and surveillance dashboard.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-teal-400" />
                    <span>Laboratory Staff Authentication</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Please provide your Chief Technician credentials to initiate session</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Key className="h-4 w-4" />
                </div>
              </div>

              <div className="mb-5 flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${mode === 'login' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${mode === 'register' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'}`}
                >
                  New User
                </button>
              </div>

              {error && (
                <div className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start space-x-3 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-300 font-medium">{error}</div>
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4" id="chief-technician-login-form">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Diagnostic Lab Name <span className="text-teal-400">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Building2 className="h-4 w-4" /></div>
                      <input
                        type="text"
                        required
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        placeholder="Enter Diagnostic Lab Name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Lab Technician Name <span className="text-teal-400">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><User className="h-4 w-4" /></div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter staff name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Login Password <span className="text-teal-400">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Key className="h-4 w-4" /></div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter login password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer" />
                      <span>Keep this staff member authenticated on this workstation</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{isSubmitting ? 'Authenticating Credentials...' : 'Unlock AI-MalScan Console & Access Diagnostic Suite'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Diagnostic Lab Name <span className="text-teal-400">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Building2 className="h-4 w-4" /></div>
                      <input
                        type="text"
                        required
                        value={newLabName}
                        onChange={(e) => setNewLabName(e.target.value)}
                        placeholder="Enter laboratory name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Staff Name <span className="text-teal-400">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><UserPlus className="h-4 w-4" /></div>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter full laboratory staff name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Role <span className="text-teal-400">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><BriefcaseBusiness className="h-4 w-4" /></div>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as 'Chief Lab Technician' | 'Senior Parasitologist' | 'Quality Control Director')}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                        >
                          <option value="Chief Lab Technician">Chief Lab Technician</option>
                          <option value="Senior Parasitologist">Senior Parasitologist</option>
                          <option value="Quality Control Director">Quality Control Director</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">License Number <span className="text-teal-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={newLicense}
                        onChange={(e) => setNewLicense(e.target.value)}
                        placeholder="e.g. MLS-GBK-2026-099"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Create Password <span className="text-teal-400">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Key className="h-4 w-4" /></div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a login password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password <span className="text-teal-400">*</span></label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50">
                      <UserPlus className="h-4 w-4" />
                      <span>{isSubmitting ? 'Creating Staff Account...' : 'Create New Laboratory Staff Account'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
              <Cpu className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span>All blood slide analyses and outbound outbreak surveillance logs are digitally signed with the authorized laboratory staff credentials.</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-slate-500 text-[11px] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <span className="text-teal-400 font-bold">Initiated by:</span> GECN-HP <span className="text-slate-600">|</span> <span className="text-teal-400 font-bold">Developed by:</span> JADSL ICT Unit Community Center-Gboko Benue State
          </div>
          <div className="text-amber-400 font-bold">Emergency Technical Assistance: +2348071119766</div>
        </div>
      </footer>
    </div>
  );
}
