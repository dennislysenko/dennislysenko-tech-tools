/**
 * Confirm reset with the user.
 */
export function confirmReset(onReset: () => void): void {
  if (window.confirm('Reset all data? This cannot be undone.')) {
    onReset();
  }
}
