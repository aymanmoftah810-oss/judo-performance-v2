/**
 * installGlobalErrorHandler — carries forward a lesson from the previous
 * single-file version: an uncaught JS error used to fail silently (a
 * button "did nothing" with no visible feedback, making bugs very hard
 * for a non-technical coach to report). This makes every uncaught error
 * visible as a banner instead.
 */
export function installGlobalErrorHandler() {
  function show(msg) {
    let el = document.getElementById("fatal-error-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "fatal-error-banner";
      el.className = "fatal-error-banner";
      document.body.appendChild(el);
    }
    el.textContent = "⚠️ حدث خطأ غير متوقع: " + msg + " — جرّب تحديث الصفحة، ولو تكرر أرسل هذه الرسالة.";
  }
  window.addEventListener("error", e => show(e.message));
  window.addEventListener("unhandledrejection", e => show((e.reason && e.reason.message) || String(e.reason)));
}
