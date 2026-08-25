import { BaseRepository } from "./BaseRepository.js";

export class StandardsRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, "standard");
  }

  /**
   * Populates from `seedRows` (already resolved to real testId values) on
   * first run only. Idempotent — safe to call every app start.
   */
  async ensureSeeded(seedRows) {
    return this.seedIfEmpty(seedRows);
  }

  /** All 5 brackets for one (testId, gender, ageCategory) combination. */
  async findBrackets(testId, gender, ageCategory) {
    const all = await this.getAll();
    return all.filter(s => s.testId === testId && s.gender === gender && s.ageCategory === ageCategory);
  }
}
