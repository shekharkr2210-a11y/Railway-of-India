'use client';

import React, { useEffect, useState } from 'react';
import { LoginPage } from '../components/LoginPage';
import { fetchCurrentUser } from '../lib/apiClient';
import { UserRole } from '../lib/types';

export default function StandaloneLoginPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then(user => {
      if (user) {
        window.location.href = '/';
      } else {
        setChecking(false);
      }
    }).catch(() => {
      setChecking(false);
    });
  }, []);

  const handleLoginSuccess = (role: UserRole, name: string) => {
    try {
      localStorage.setItem('railway_logged_in', '1');
      localStorage.setItem('railway_saved_role', role);
      localStorage.setItem('railway_saved_name', name);
    } catch {
      // Ignore
    }
    window.location.href = '/';
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-blue-200">Verifying RailTel Security Session...</p>
      </div>
    );
  }

  return <LoginPage onLogin={handleLoginSuccess} />;
}
