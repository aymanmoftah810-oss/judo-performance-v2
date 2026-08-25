import { getAgeCategory } from "../models/AgeCategory.js";
import { getAge } from "../models/Player.js";

const GRADE_SCORE = { "ضعيف": 1, "مقبول": 2, "جيد": 3, "جيد جدًا": 4, "ممتاز": 5 };

/**
 * EvaluationService — the ONLY place score/rating computation happens.
 * UI code must never compute a score itself (per explicit spec requirement:
 * "يجب ألا يكون حساب الدرجات داخل UI").
 *
 * Pipeline (per spec):
 *   Raw Result -> Standard Lookup -> Score -> Rating
 *
 * Depends only on StandardsRepository + TestRepository (both accessed
 * through their own interfaces) — no storage knowledge of its own.
 */
export class EvaluationService {
  /**
   * @param {import("../database/repositories/StandardsRepository.js").StandardsRepository} standardsRepo
   * @param {import("../database/repositories/TestRepository.js").TestRepository} testRepo
   */
  constructor(standardsRepo, testRepo) {
    this._standardsRepo = standardsRepo;
    this._testRepo = testRepo;
  }

  /** Age is ALWAYS computed from birth year only — never a full birth date. */
  getAge(player) {
    return getAge(player);
  }

  getAgeCategory(player) {
    return getAgeCategory(this.getAge(player), player.gender);
  }

  /**
   * @param {number} testId
   * @param {"ذكر"|"أنثى"} gender
   * @param {string} ageCategory
   * @param {number} value
   * @returns {Promise<{score:number, rating:string}|null>}
   */
  async scoreValue(testId, gender, ageCategory, value) {
    if (value === "" || value === null || value === undefined || isNaN(Number(value))) return null;
    const v = Number(value);
    const brackets = await this._standardsRepo.findBrackets(testId, gender, ageCategory);
    for (const b of brackets) {
      if (v >= b.min && v <= b.max) return { score: b.score, rating: b.grade };
    }
    return null;
  }

  /**
   * Score + rating for a player's raw result on one test.
   * @param {import("../models/Player.js").Player} player
   * @param {number} testId
   * @param {number} value
   */
  async scorePlayerResult(player, testId, value) {
    const ageCategory = this.getAgeCategory(player);
    if (!ageCategory) return null;
    return this.scoreValue(testId, player.gender, ageCategory, value);
  }

  /**
   * Weighted Achievement% across all active tests, using each test's
   * declared weight. Fixed denominator (always divides by the FULL set of
   * active tests' weights, not just the ones with a result yet) — matches
   * the verified behavior from the previous system: a player who has only
   * done 2 of 10 tests correctly shows a low, honest, rising percentage
   * rather than 100% of "tests attempted so far".
   *
   * @param {{testId:number, score:number}[]} scoredResults  one per test (latest result per test)
   * @param {{id:number, weight:number, active:boolean}[]} allTests
   */
  computeAchievement(scoredResults, allTests) {
    const activeTests = allTests.filter(t => t.active);
    const totalWeight = activeTests.reduce((s, t) => s + t.weight, 0) || 1;
    let weightedSum = 0;
    for (const t of activeTests) {
      const result = scoredResults.find(r => r.testId === t.id);
      if (result && result.score) weightedSum += result.score * t.weight;
    }
    const achievement = Math.round((weightedSum / (5 * totalWeight)) * 100 * 10) / 10;
    return achievement;
  }

  /** Grade name for a numeric score 1-5 (fixed universal scale, same as before). */
  static gradeForScore(score) {
    return Object.keys(GRADE_SCORE).find(g => GRADE_SCORE[g] === score) || null;
  }
}
