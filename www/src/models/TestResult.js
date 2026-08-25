/**
 * TestResult — one recorded result for one player, one test, one date.
 * A player can have many results for the same test over time (progress).
 *
 * @typedef {Object} TestResult
 * @property {number} id
 * @property {number} playerId
 * @property {number} testId
 * @property {number} value      raw measured value (reps/seconds/cm)
 * @property {number|null} score    1-5, computed by EvaluationService
 * @property {string|null} rating   ضعيف/مقبول/جيد/جيد جدًا/ممتاز
 * @property {string} date       ISO date (YYYY-MM-DD)
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 */
export function createTestResultData(data) {
  const now = new Date().toISOString();
  return {
    playerId: data.playerId,
    testId: data.testId,
    value: data.value,
    score: data.score ?? null,
    rating: data.rating ?? null,
    date: data.date ?? now.slice(0, 10),
    notes: data.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
}
