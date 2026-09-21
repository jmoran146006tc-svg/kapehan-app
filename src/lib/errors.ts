/**
 * Firebase error codes are useful to developers but make poor form feedback.
 * Keep the mapping in one place so every screen gives people the same clear,
 * actionable wording without exposing implementation details.
 */
const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/user-not-found': 'The email or password is incorrect.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/email-already-in-use': 'An account already uses that email address.',
  'auth/weak-password': 'Use a password with at least 6 characters.',
  'auth/network-request-failed': 'Check your connection and try again.',
  'app/timeout': 'This is taking too long — check your connection and try again.',
  'permission-denied': 'You do not have permission to do that.',
  'firestore/permission-denied': 'You do not have permission to do that.',
  unavailable: 'The service is temporarily unavailable. Please try again.',
  'firestore/unavailable': 'The service is temporarily unavailable. Please try again.',
};

export function getUserFriendlyError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined;

  return code ? (FRIENDLY_ERROR_MESSAGES[code] ?? fallback) : fallback;
}
