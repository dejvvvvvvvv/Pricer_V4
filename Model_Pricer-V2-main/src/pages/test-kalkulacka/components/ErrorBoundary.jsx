/**
 * Re-export the shared application-level ErrorBoundary so that
 * test-kalkulacka components can import it from a local path.
 *
 * The shared boundary:
 *   - Shows a user-friendly, bilingual (CS/EN) error UI.
 *   - Has "Try Again" + "Reload Page" + "Report Error" actions.
 *   - Shows stack details in dev mode only.
 *   - Logs via console.error with a module label.
 */
export { default } from '@/components/ErrorBoundary';
