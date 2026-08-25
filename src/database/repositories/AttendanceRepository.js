import { BaseRepository } from "./BaseRepository.js";

export class AttendanceRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, "attendance");
  }

  async findByPlayer(playerId) {
    const all = await this.getAll();
    return all.filter(a => a.playerId === playerId).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async findByDate(date) {
    const all = await this.getAll();
    return all.filter(a => a.date === date);
  }

  /** Prevent duplicate attendance record for the same player on the same date. */
  async findByPlayerAndDate(playerId, date) {
    const all = await this.getAll();
    return all.find(a => a.playerId === playerId && a.date === date) || null;
  }
}
