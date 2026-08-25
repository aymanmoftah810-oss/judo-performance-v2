import { eventBus } from "../core/EventBus.js";

/**
 * TestService — the Tests catalog's Service layer. Added to close a real
 * architecture gap found during review: several UI modules were holding a
 * TestRepository reference directly (UI -> Repository, skipping Service),
 * which violates the required UI -> Module -> Service -> Repository
 * layering. All test-catalog access now goes through here instead.
 */
export class TestService {
  /** @param {import("../database/repositories/TestRepository.js").TestRepository} repo */
  constructor(repo) {
    this._repo = repo;
  }

  async getAllTests() {
    return this._repo.getAll();
  }

  async getActiveTests() {
    return (await this._repo.getAll()).filter(t => t.active);
  }

  async getTest(id) {
    return this._repo.get(Number(id));
  }

  async toggleActive(id) {
    const test = await this._repo.get(Number(id));
    if (!test) throw new Error(`Test ${id} not found`);
    const updated = await this._repo.update(Number(id), { active: !test.active });
    eventBus.emit("test:changed", updated);
    return updated;
  }
}
