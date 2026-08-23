/**
 * Normalize Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Western digits.
 *
 * IMPORTANT HISTORY: in the previous single-file version of this app,
 * <input type="number"> fields silently rejected Arabic-Indic digits
 * (which many Arabic mobile keyboards type by default), causing forms
 * to appear "broken" with no visible error. The fix was to use
 * type="text" + inputmode="numeric" everywhere a number is entered,
 * and run every value through this function before parsing/validating.
 * Do NOT reintroduce <input type="number"> for user-facing numeric
 * fields in this project — use normalizeDigits() + inputmode instead.
 */
export function normalizeDigits(str) {
  if (str === null || str === undefined) return str;
  const map = {
    "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9",
    "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9",
    "٫":".","،":""
  };
  return String(str).replace(/[٠-٩۰-۹٫،]/g, ch => (map[ch] !== undefined ? map[ch] : ch));
}
