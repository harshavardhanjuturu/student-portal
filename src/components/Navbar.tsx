/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, User as UserIcon, GraduationCap, ShieldAlert, Award, Calendar } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const getRoleIcon = () => {
    switch (user.role) {
      case 'ADMIN':
        return <ShieldAlert className="h-5 w-5 text-rose-400" />;
      case 'FACULTY':
        return <Award className="h-5 w-5 text-indigo-400" />;
      case 'STUDENT':
      default:
        return <GraduationCap className="h-5 w-5 text-emerald-400" />;
    }
  };

  const getRoleBadge = () => {
    switch (user.role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-title uppercase tracking-wider">
            Admin
          </span>
        );
      case 'FACULTY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-title uppercase tracking-wider">
            Faculty
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-title uppercase tracking-wider">
            Student
          </span>
        );
    }
  };

  return (
    <nav className="relative z-50 border-b border-white/10 backdrop-blur-md bg-[#0f172a]/70 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0">
      <div className="w-full max-w-7xl mx-auto px-1 sm:px-2 flex justify-between h-16">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 text-center rounded-xl flex items-center justify-center shadow-lg shadow-indigo-950/20 border border-white/10">
            <GraduationCap className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div>
            <span className="font-title font-bold text-lg tracking-tight text-white block leading-tight">
              ACADEMIA
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ScholarSync Core Portal
            </span>
          </div>
        </div>

        {/* User Actions & Banners */}
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-1.5">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-mono font-medium text-slate-300">
              Term: Spring 2026
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 border-l border-white/10 pl-3 sm:pl-6">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-semibold text-white font-title">
                {user.name}
              </span>
              <span className="block text-[10px] font-mono text-slate-400">
                {user.registrationNumber || user.email}
              </span>
            </div>
            <div className="flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5">
              {getRoleIcon()}
            </div>
            <div>
              {getRoleBadge()}
            </div>

            <button
              id="btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200"
              title="Logout from portal"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
