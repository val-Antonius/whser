'use client';

import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

export default function RoleSelector() {
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    // Store role in sessionStorage for persistence
    sessionStorage.setItem('userRole', role);

    // Navigate to appropriate dashboard
    if (role === UserRole.ADMIN) {
      router.push('/admin/dashboard');
    } else {
      router.push('/owner/analytics');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Laundry Management Platform
          </h1>
          <p className="text-xl text-gray-600">
            Select your role to continue
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Role Card */}
          <button
            onClick={() => handleRoleSelect(UserRole.ADMIN)}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-500 transform hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Admin Role
              </h2>
              <p className="text-gray-600 mb-6">
                Access the operational application for daily workflow management
              </p>

              {/* Features */}
              <ul className="space-y-2 text-left text-sm text-gray-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  POS & Transaction Management
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Service Management
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Inventory & Customer Management
                </li>
              </ul>

              {/* Button */}
              <div className="mt-8 flex items-center justify-center text-blue-600 font-semibold group-hover:text-blue-700">
                Enter as Admin
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>

          {/* Owner Role Card */}
          <button
            onClick={() => handleRoleSelect(UserRole.OWNER)}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-purple-500 transform hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Owner Role
              </h2>
              <p className="text-gray-600 mb-6">
                Access the analytics dashboard for strategic insights and management
              </p>

              {/* Features */}
              <ul className="space-y-2 text-left text-sm text-gray-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Post-Operational Analytics
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  AI-Powered Insights
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Task Management & Recommendations
                </li>
              </ul>

              {/* Button */}
              <div className="mt-8 flex items-center justify-center text-purple-600 font-semibold group-hover:text-purple-700">
                Enter as Owner
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>No authentication required • Prototype for thesis project</p>
        </div>
      </div>
    </div>
  );
}
