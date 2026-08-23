import { normalizeDigits } from "../utils/normalizeDigits.js";
import { PLAYER_STATUSES, GENDERS } from "../models/Player.js";
import { eventBus } from "../core/EventBus.js";

/**
 * ValidationError — thrown by PlayerService when input data is invalid.
 * The UI layer catches this and shows the message as a toast; it never
 * has to know the validation rules itself.
 */
export class ValidationError extends Error {}

function validate(data) {
  const name = (data.name || "").trim();
  if (!name) throw new ValidationError("الرجاء إدخال اسم اللاعب");

  const birthYearRaw = normalizeDigits(String(data.birthYear ?? "")).trim();
  const birthYear = Number(birthYearRaw);
  if (!birthYearRaw || !Number.isInteger(birthYear) || birthYear < 1950 || birthYear > 2100) {
    throw new ValidationError("سنة الميلاد غير صحيحة - أدخل سنة مثل 2012");
  }

  let weight = null;
  if (data.weight !== undefined && data.weight !== null && String(data.weight).trim() !== "") {
    const weightRaw = normalizeDigits(String(data.weight)).trim();
    weight = Number(weightRaw);
    if (isNaN(weight)) throw new ValidationError("الوزن غير صحيح");
  }

  if (data.gender && !GENDERS.includes(data.gender)) {
    throw new ValidationError("النوع غير صحيح");
  }
  if (data.status && !PLAYER_STATUSES.includes(data.status)) {
    throw new ValidationError("حالة اللاعب غير صحيحة");
  }

  return {
    name,
    birthYear,
    weight,
    gender: data.gender || "ذكر",
    status: data.status || "مقيد",
    membershipNo: normalizeDigits(String(data.membershipNo ?? "")).trim(),
    phone: normalizeDigits(String(data.phone ?? "")).trim(),
    belt: (data.belt || "").trim(),
    club: (data.club || "").trim(),
    notes: (data.notes || "").trim(),
  };
}

/**
 * PlayerService — depends ONLY on a PlayerRepository instance (constructor
 * injection). It has no idea whether that repository stores data in
 * localStorage, IndexedDB, or anywhere else. This is what ARCH-002 verifies.
 */
export class PlayerService {
  /** @param {import("../database/repositories/PlayerRepository.js").PlayerRepository} repository */
  constructor(repository) {
    this._repo = repository;
  }

  async createPlayer(rawData) {
    const clean = validate(rawData);
    const player = await this._repo.createPlayer(clean);
    eventBus.emit("player:created", player);
    eventBus.emit("player:changed", player);
    return player;
  }

  async updatePlayer(id, rawData) {
    const clean = validate(rawData);
    const player = await this._repo.updatePlayer(id, clean);
    eventBus.emit("player:updated", player);
    eventBus.emit("player:changed", player);
    return player;
  }

  async softDeletePlayer(id) {
    const player = await this._repo.softDeletePlayer(id);
    eventBus.emit("player:deleted", player);
    eventBus.emit("player:changed", player);
    return player;
  }

  async getPlayer(id) {
    return this._repo.getPlayer(id);
  }

  async getAllPlayers() {
    return this._repo.getAllPlayers();
  }

  async searchPlayers(query) {
    return this._repo.searchPlayers(query);
  }
}
