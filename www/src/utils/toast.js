/**
 * Toast — small shared UI utility. Any module can call toast("message")
 * without knowing about DOM details. Requires a <div id="toast"></div>
 * to exist in index.html (created once, reused by every module).
 */
let toastEl = null;
let hideTimer = null;

export function toast(message, { type = "info" } = {}) {
  if (!toastEl) {
    toastEl = document.getElementById("toast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "toast";
      document.body.appendChild(toastEl);
    }
  }
  toastEl.textContent = message;
  toastEl.className = "toast show " + type;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { toastEl.classList.remove("show"); }, 2400);
}
