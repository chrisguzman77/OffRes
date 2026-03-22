/** Blur focused field (dismiss native keyboard if any). */
export function blurActiveElement(): void {
  if (typeof document === 'undefined') return;
  const ae = document.activeElement;
  if (ae instanceof HTMLElement) {
    ae.blur();
  }
}
