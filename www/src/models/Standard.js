/**
 * Standard — one grading bracket: for a given test + gender + age category,
 * a value range [min,max] maps to a grade + score. Five brackets normally
 * cover one (test, gender, ageCategory) combination (ضعيف..ممتاز).
 *
 * Kept OUT of code (per explicit spec requirement) — stored as data via
 * StandardsRepository, editable later from Settings.
 *
 * @typedef {Object} Standard
 * @property {number} id
 * @property {number} testId
 * @property {"ذكر"|"أنثى"} gender
 * @property {string} ageCategory   one of AGE_CATEGORIES
 * @property {number} min           inclusive lower bound (-99999 = open-ended)
 * @property {number} max           inclusive upper bound (99999 = open-ended)
 * @property {string} grade         ضعيف|مقبول|جيد|جيد جدًا|ممتاز
 * @property {number} score         1-5
 */
export function createStandardData(data) {
  return {
    testId: data.testId,
    gender: data.gender,
    ageCategory: data.ageCategory,
    min: data.min,
    max: data.max,
    grade: data.grade,
    score: data.score,
  };
}
