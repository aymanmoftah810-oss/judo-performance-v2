import { BaseRepository } from "./BaseRepository.js";

export class TestResultRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, "testresult");
  }

  async findByPlayer(playerId) {
    const all = await this.getAll();
    return all.filter(r => r.playerId === playerId).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async findByPlayerAndTest(playerId, testId) {
    const all = await this.findByPlayer(playerId);
    return all.filter(r => r.testId === testId);
  }
}
