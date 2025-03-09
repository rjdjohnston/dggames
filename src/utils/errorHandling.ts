/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Extracts a user-friendly error message from any error object
 * @param error The caught error (of unknown type)
 * @param fallbackMessage Optional custom fallback message if error is not an Error instance
 * @returns A string error message
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unknown error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallbackMessage;
}

/**
 * Logs an error to the console with contextual information
 * @param context Description of where the error occurred
 * @param error The caught error
 */
export function logError(context: string, error: unknown): void {
  console.error(`Error in ${context}:`, error);
} 