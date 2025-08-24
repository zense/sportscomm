'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login');
      } else {
        // Authenticated, redirect to appropriate dashboard
        switch (user.role) {
          case 'Student':
            router.push('/student/dashboard');
            break;
          case 'Coach':
            router.push('/coach/dashboard');
            break;
          case 'Admin':
            router.push('/admin/dashboard');
            break;
          default:
            router.push('/login');
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // This should not be reached due to the redirect logic above
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          College Sports Equipment & Attendance Manager
        </h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
