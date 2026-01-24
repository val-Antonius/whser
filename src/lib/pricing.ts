// ============================================================================
// PRICING UTILITY
// ============================================================================
// Purpose: Complex pricing rules and calculations
// ============================================================================

export interface PricingResult {
    basePrice: number;
    finalPrice: number;
    minimumChargeApplied: boolean;
    pricingNotes: string[];
    breakdown: {
        quantity: number;
        unitPrice: number;
        subtotal: number;
        minimumCharge?: number;
    };
}

/**
 * Apply minimum charge enforcement
 * @param quantity Quantity (weight or pieces)
 * @param unitPrice Price per unit
 * @param minimumCharge Minimum charge for the service
 * @returns Pricing result with breakdown
 */
export function applyMinimumCharge(
    quantity: number,
    unitPrice: number,
    minimumCharge: number | null
): PricingResult {
    const basePrice = quantity * unitPrice;
    const notes: string[] = [];
    let finalPrice = basePrice;
    let minimumChargeApplied = false;

    // Apply minimum charge if applicable
    if (minimumCharge && basePrice < minimumCharge) {
        finalPrice = minimumCharge;
        minimumChargeApplied = true;
        notes.push(
            `Minimum charge of Rp ${minimumCharge.toLocaleString('id-ID')} applied (calculated: Rp ${basePrice.toLocaleString('id-ID')})`
        );
    }

    return {
        basePrice,
        finalPrice,
        minimumChargeApplied,
        pricingNotes: notes,
        breakdown: {
            quantity,
            unitPrice,
            subtotal: basePrice,
            minimumCharge: minimumCharge || undefined,
        },
    };
}

/**
 * Calculate balance due after deposit
 * @param totalPrice Total order price
 * @param depositAmount Deposit paid
 * @returns Balance due
 */
export function calculateBalanceDue(
    totalPrice: number,
    depositAmount: number
): number {
    return Math.max(0, totalPrice - depositAmount);
}

/**
 * Validate deposit amount
 * @param depositAmount Deposit to validate
 * @param totalPrice Total order price
 * @returns Validation result
 */
export function validateDeposit(
    depositAmount: number,
    totalPrice: number
): { valid: boolean; error?: string } {
    if (depositAmount < 0) {
        return { valid: false, error: 'Deposit amount cannot be negative' };
    }

    if (depositAmount > totalPrice) {
        return { valid: false, error: 'Deposit amount cannot exceed total price' };
    }

    return { valid: true };
}

/**
 * Calculate payment status based on amounts
 * @param totalPrice Total order price
 * @param paidAmount Amount paid so far
 * @returns Payment status
 */
export function calculatePaymentStatus(
    totalPrice: number,
    paidAmount: number
): 'unpaid' | 'partial' | 'paid' {
    if (paidAmount === 0) return 'unpaid';
    if (paidAmount >= totalPrice) return 'paid';
    return 'partial';
}

/**
 * Format pricing breakdown for display
 * @param result Pricing result
 * @returns Formatted string
 */
export function formatPricingBreakdown(result: PricingResult): string {
    let breakdown = `${result.breakdown.quantity} × Rp ${result.breakdown.unitPrice.toLocaleString('id-ID')} = Rp ${result.breakdown.subtotal.toLocaleString('id-ID')}`;

    if (result.minimumChargeApplied && result.breakdown.minimumCharge) {
        breakdown += `\nMinimum charge: Rp ${result.breakdown.minimumCharge.toLocaleString('id-ID')}`;
    }

    return breakdown;
}
