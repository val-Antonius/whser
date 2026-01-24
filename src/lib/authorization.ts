// ============================================================================
// AUTHORIZATION UTILITY
// ============================================================================
// Purpose: Simple PIN-based authorization for sensitive operations
// ============================================================================

/**
 * Validate authorization code for sensitive operations
 * @param code Authorization code to validate
 * @returns true if valid, false otherwise
 */
export function validateAuthorizationCode(code: string): boolean {
  // Simple implementation: check against environment variable
  const managerPin = process.env.MANAGER_PIN || '1234'; // Default for development
  return code === managerPin;
}

/**
 * Get authorization requirement message
 */
export function getAuthorizationMessage(): string {
  return 'This action requires manager authorization. Please enter the authorization code.';
}

/**
 * Authorization levels (for future enhancement)
 */
export enum AuthorizationLevel {
  STAFF = 'staff',
  MANAGER = 'manager',
  OWNER = 'owner',
}

/**
 * Check if action requires authorization
 * @param action Action to check
 * @returns true if authorization required
 */
export function requiresAuthorization(action: string): boolean {
  const sensitiveActions = [
    'cancel_order',
    'void_transaction',
    'refund_payment',
    'adjust_price',
    'delete_order',
  ];
  return sensitiveActions.includes(action);
}
