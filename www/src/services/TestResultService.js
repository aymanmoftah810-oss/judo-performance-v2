import { createTestResultData } from "../models/TestResult.js";
import { normalizeDigits } from "../utils/normalizeDigits.js";
import { eventBus } from "../core/EventBus.js";
import { ValidationError } from "./errors.js";
export { ValidationError };

/**
 * TestResultService — implements the Test Entry pipeline exactly as specified:
 *   choose player + test + date -> enter value + notes -> system automatically:
 *   validates -> computes Score -> computes Rating -> saves -> player profile
 *   reflects it (via eventBus "testresult:changed", consumed by Player Profile).
 *
 * Depends on TestResultRepository + PlayerRepository + EvaluationService,
 * never on storage or UI directly.
 */
export class TestResultService {
  /**
   * @param {import("../database/repositories/TestResultRepository.js").TestResultRepository} resultRepo
   * @param {import("../database/repositories/PlayerRepository.js").PlayerRepository} playerRepo
   * @param {import("./EvaluationService.js").EvaluationService} evaluationService
   */
  constructor(resultRepo, playerRepo, evaluationService) {
    this._repo = resultRepo;
    this._playerRepo = playerRepo;
    this._evaluation = evaluationService;
  }

  async recordResult({ playerId, testId, value, date, notes }) {
    const player = await this._playerRepo.getPlayer(Number(playerId));
    if (!player) throw new ValidationError("اللاعب غير موجود");

    const cleanValue = normalizeDigits(String(value ?? "")).trim();
    const numericValue = Number(cleanValue);
    if (cleanValue === "" || isNaN(numericValue)) {
      throw new ValidationError("الرجاء إدخال نتيجة صحيحة (رقم)");
    }

    const scored = await this._evaluation.scorePlayerResult(player, Number(testId), numericValue);

    const result = await this._repo.create(createTestResultData({
      playerId: player.id,
      testId: Number(testId),
      value: numericValue,
      score: scored ? scored.score : null,
      rating: scored ? scored.rating : null,
      date: date || undefined,
      notes: notes || "",
    }));

    eventBus.emit("testresult:created", result);
    eventBus.emit("testresult:changed", result);
    return result;
  }

  async getResultsForPlayer(playerId) {
    return this._repo.findByPlayer(Number(playerId));
  }

  async getResultsForPlayerAndTest(playerId, testId) {
    return this._repo.findByPlayerAndTest(Number(playerId), Number(testId));
  }

  async getAllResults() {
    return this._repo.getAll();
  }
}
