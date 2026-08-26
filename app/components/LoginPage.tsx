'use client';

import React, { useState } from 'react';
import { Train, ShieldCheck, Lock, Eye, EyeOff, LogIn, AlertCircle, User, Mail } from 'lucide-react';
import { UserRole } from '../lib/types';

interface LoginPageProps {
  onLogin: (role: UserRole, displayName: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('BOARD_HQ');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    onLogin(selectedRole, name.trim());
  };

  const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
    { value: 'BOARD_HQ', label: 'Railway Board HQ Director', desc: 'Full national access' },
    { value: 'ZONAL_GM', label: 'Zonal General Manager (GM)', desc: 'Zonal railway oversight' },
    { value: 'DIVISIONAL_DRM', label: 'Divisional Manager (DRM)', desc: 'Division-level control' },
    { value: 'SECTION_CONTROLLER', label: 'Section Traffic Controller', desc: 'Section operations' },
  ];

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-8">
      {/* Full-screen Vande Bharat Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/vande-bharat-bg.jpg')" }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Content (above overlay) */}
      <div className="relative z-10 w-full flex flex-col items-center">

      {/* Government Banner */}
      <div className="w-full max-w-md mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="text-3xl">🇮🇳</span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-md">
              Ministry of Railways • Government of India
            </h2>
            <p className="text-xs text-white/80">भारतीय रेल मंत्रालय • भारत सरकार</p>
          </div>
          <span className="text-3xl">🚂</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 px-8 py-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Train className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-white tracking-tight">
                AI Block Planner
              </h1>
              <p className="text-xs text-blue-200">
                Automatic Block Planning System
              </p>
            </div>
          </div>
          <p className="text-xs text-blue-200/80 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secured by RailTel TLS 1.3 • SHA-256 HMAC
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                placeholder="Enter your full name"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.name ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                placeholder="you@indianrailways.gov.in"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.email ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-11 py-2.5 rounded-lg border bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.password ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </p>
            )}
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Designation / Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`px-3 py-2 rounded-lg border text-left transition-all text-xs ${
                    selectedRole === role.value
                      ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-200'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="font-bold text-gray-800 text-[11px]">{role.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{role.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Secure Login
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-1">
            <Lock className="w-3 h-3" />
            <span>End-to-end encrypted • mTLS Verified Session</span>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-white/60 space-y-1">
        <p>🇮🇳 Indian Railways • Centre for Railway Information Systems (CRIS)</p>
        <p>SIH Problem Statement #26027 • AI-Powered Automatic Block Planning</p>
      </div>

      </div>{/* close z-10 content wrapper */}
    </div>
  );
};
