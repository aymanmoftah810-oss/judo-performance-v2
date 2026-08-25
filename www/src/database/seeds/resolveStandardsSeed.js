import { STANDARDS_SEED_BY_TEST_NAME_AR } from "./standardsSeedData.js";

/**
 * Resolve the Arabic-name-keyed verified standards data into flat rows
 * ready for StandardsRepository.ensureSeeded(), using the REAL testId
 * values assigned by TestRepository (which may differ run to run in
 * theory, though in practice tests are seeded once and IDs are stable).
 *
 * @param {{id:number, nameAr:string}[]} tests
 * @returns {{testId:number, gender:string, ageCategory:string, min:number, max:number, grade:string, score:number}[]}
 */
export function resolveStandardsSeed(tests) {
  const rows = [];
  for (const test of tests) {
    const byGender = STANDARDS_SEED_BY_TEST_NAME_AR[test.nameAr];
    if (!byGender) continue;
    for (const gender of Object.keys(byGender)) {
      const byAgeCat = byGender[gender];
      for (const ageCategory of Object.keys(byAgeCat)) {
        for (const bracket of byAgeCat[ageCategory]) {
          rows.push({
            testId: test.id,
            gender,
            ageCategory,
            min: bracket.min,
            max: bracket.max,
            grade: bracket.grade,
            score: bracket.score,
          });
        }
      }
    }
  }
  return rows;
}
