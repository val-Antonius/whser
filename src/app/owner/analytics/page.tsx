'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';

export default function OwnerAnalytics() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user has owner role
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== UserRole.OWNER) {
            router.push('/');
            return;
        }
        setIsLoading(false);
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
                                <p className="text-sm text-gray-500">Owner Role</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('userRole');
                                router.push('/');
                            }}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Switch Role
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <Link
                            href="/owner/analytics"
                            className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-600"
                        >
                            Analytics
                        </Link>
                        <Link
                            href="/owner/insights"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Insights
                        </Link>
                        <Link
                            href="/owner/recommendations"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Recommendations
                        </Link>
                        <Link
                            href="/owner/tasks"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Tasks
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
                    <h2 className="text-3xl font-bold mb-2">Welcome to Analytics Dashboard</h2>
                    <p className="text-purple-100">Strategic insights and AI-powered recommendations for your business</p>
                </div>

                {/* Period Selector Placeholder */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Analysis Period</h3>
                            <p className="text-sm text-gray-600">Select a period to view analytics</p>
                        </div>
                        <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                            Select Period
                        </button>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">+0%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">SLA Compliance</p>
                        <p className="text-3xl font-bold text-gray-900">--</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">+0%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">Rp --</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">+0%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Rewash Rate</p>
                        <p className="text-3xl font-bold text-gray-900">--</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">+0%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Order Completion</p>
                        <p className="text-3xl font-bold text-gray-900">--</p>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/owner/insights" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-purple-500">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
                            <p className="text-sm text-gray-600">Automated insights generated from operational data analysis</p>
                        </div>
                    </Link>

                    <Link href="/owner/recommendations" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-purple-500">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
                            <p className="text-sm text-gray-600">Actionable recommendations for process improvements</p>
                        </div>
                    </Link>

                    <Link href="/owner/tasks" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-purple-500">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Management</h3>
                            <p className="text-sm text-gray-600">Create and assign tasks to admin team based on insights</p>
                        </div>
                    </Link>
                </div>

                {/* Coming Soon Notice */}
                <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-purple-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-semibold text-purple-900 mb-1">Phase 1.2: User Role System Complete</h4>
                            <p className="text-sm text-purple-700">
                                The analytics features (Data Snapshots, Metrics, Insights, Recommendations, Tasks) will be implemented in Phase 3-5.
                                The operational application must be built first (Phase 1-2).
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
