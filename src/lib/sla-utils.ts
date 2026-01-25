/**
 * SLA (Service Level Agreement) Utility Functions
 * Untuk menghitung status SLA dan format waktu tersisa/terlambat
 */

export interface SLAStatus {
    status: 'overdue' | 'critical' | 'urgent' | 'approaching' | 'safe';
    color: string;
    bgColor: string;
    icon: string;
}

/**
 * Menghitung status SLA berdasarkan estimated completion time
 */
export function getSLAStatus(estimatedCompletion: string | null): SLAStatus {
    if (!estimatedCompletion) {
        return {
            status: 'safe',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            icon: '⚪'
        };
    }

    const now = new Date();
    const deadline = new Date(estimatedCompletion);
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
        return {
            status: 'overdue',
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            icon: '🔴'
        };
    }

    if (hoursRemaining < 6) {
        return {
            status: 'critical',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            icon: '🔴'
        };
    }

    if (hoursRemaining < 12) {
        return {
            status: 'urgent',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            icon: '🟠'
        };
    }

    if (hoursRemaining < 24) {
        return {
            status: 'approaching',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            icon: '🟡'
        };
    }

    return {
        status: 'safe',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '🟢'
    };
}

/**
 * Format waktu tersisa atau terlambat dalam Bahasa Indonesia
 */
export function formatTimeRemaining(estimatedCompletion: string | null): string {
    if (!estimatedCompletion) {
        return 'Tidak ada deadline';
    }

    const now = new Date();
    const deadline = new Date(estimatedCompletion);
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
        const hoursOverdue = Math.abs(hoursRemaining);
        if (hoursOverdue < 24) {
            return `${Math.floor(hoursOverdue)} jam terlambat`;
        }
        return `${Math.floor(hoursOverdue / 24)} hari terlambat`;
    }

    if (hoursRemaining < 24) {
        return `${Math.floor(hoursRemaining)} jam lagi`;
    }

    return `${Math.floor(hoursRemaining / 24)} hari lagi`;
}

/**
 * Check if order is due today
 */
export function isDueToday(estimatedCompletion: string | null): boolean {
    if (!estimatedCompletion) return false;

    const now = new Date();
    const deadline = new Date(estimatedCompletion);

    return (
        now.getFullYear() === deadline.getFullYear() &&
        now.getMonth() === deadline.getMonth() &&
        now.getDate() === deadline.getDate()
    );
}

/**
 * Check if order is overdue
 */
export function isOverdue(estimatedCompletion: string | null): boolean {
    if (!estimatedCompletion) return false;

    const now = new Date();
    const deadline = new Date(estimatedCompletion);

    return deadline.getTime() < now.getTime();
}

/**
 * Check if order is approaching deadline (< 24 hours)
 */
export function isApproaching(estimatedCompletion: string | null): boolean {
    if (!estimatedCompletion) return false;

    const now = new Date();
    const deadline = new Date(estimatedCompletion);
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursRemaining > 0 && hoursRemaining < 24;
}

/**
 * Check if order status should show SLA
 * SLA hanya relevan untuk orders yang masih dalam proses
 * 
 * Based on database enum (schema.sql):
 * - HIDE SLA: completed, ready_for_pickup, closed, cancelled
 * - SHOW SLA: received, waiting_for_process, in_wash, in_dry, in_iron, 
 *             in_fold, ready_for_qc, qc_failed
 */
export function shouldShowSLA(currentStatus: string | null): boolean {
    if (!currentStatus) return false;

    // Status dimana SLA sudah tidak relevan (proses selesai atau dibatalkan)
    const finalStatuses = [
        'completed',        // Cucian selesai diproses
        'ready_for_pickup', // Siap diambil (SLA sudah final)
        'closed',           // Transaksi selesai (delivered)
        'cancelled'         // Order dibatalkan
    ];

    return !finalStatuses.includes(currentStatus);
}
