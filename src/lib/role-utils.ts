// ============================================================================
// ROLE UTILITIES
// ============================================================================
// Purpose: Helper functions for role-based access control
// ============================================================================

import { UserRole } from '@/types';

/**
 * Get current user role from session storage
 */
export function getCurrentRole(): UserRole | null {
    if (typeof window === 'undefined') return null;
    const role = sessionStorage.getItem('userRole');
    return role as UserRole | null;
}

/**
 * Set user role in session storage
 */
export function setCurrentRole(role: UserRole): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('userRole', role);
}

/**
 * Clear user role from session storage
 */
export function clearCurrentRole(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('userRole');
}

/**
 * Check if current user has admin role
 */
export function isAdmin(): boolean {
    return getCurrentRole() === UserRole.ADMIN;
}

/**
 * Check if current user has owner role
 */
export function isOwner(): boolean {
    return getCurrentRole() === UserRole.OWNER;
}

/**
 * Get dashboard path for role
 */
export function getDashboardPath(role: UserRole): string {
    return role === UserRole.ADMIN ? '/admin/dashboard' : '/owner/analytics';
}
