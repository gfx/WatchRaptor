
export function ready(cb: () => Promise<void>): void {
  window.addEventListener("DOMContentLoaded", cb);
}
