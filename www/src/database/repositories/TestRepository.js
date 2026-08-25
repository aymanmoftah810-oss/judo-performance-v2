import { BaseRepository } from "./BaseRepository.js";
import { SEED_TESTS } from "../../models/Test.js";

export class TestRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, "test");
  }

  /** Populates the 10 standard tests on first run only. Idempotent. */
  async ensureSeeded() {
    return this.seedIfEmpty(SEED_TESTS);
  }

  async getByNameAr(nameAr) {
    const all = await this.getAll();
    return all.find(t => t.nameAr === nameAr) || null;
  }
}
