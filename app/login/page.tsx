'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '../components/LoginPage';
import { fetchCurrentUser } from '../lib/apiClient';

export default function StandaloneLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    fetchCurrentUser().then(user => {
      if (user) {
        router.replace('/');
      }
    });
  }, [router]);

  const handleLoginSuccess = () => {
    router.replace('/');
  };

  return <LoginPage onLogin={handleLoginSuccess} />;
}
