import { createGroupData } from "../models/Group.js";
import { eventBus } from "../core/EventBus.js";
import { ValidationError } from "./errors.js";
export { ValidationError };

function validate(data) {
  const name = (data.name || "").trim();
  if (!name) throw new ValidationError("الرجاء إدخال اسم المجموعة");
  return {
    name,
    coach: (data.coach || "").trim(),
    description: (data.description || "").trim(),
    active: data.active !== undefined ? !!data.active : true,
  };
}

export class GroupService {
  /** @param {import("../database/repositories/GroupRepository.js").GroupRepository} repo */
  constructor(repo) {
    this._repo = repo;
  }

  async createGroup(rawData) {
    const clean = validate(rawData);
    const group = await this._repo.create(createGroupData(clean));
    eventBus.emit("group:changed", group);
    return group;
  }

  async updateGroup(id, rawData) {
    const clean = validate(rawData);
    const group = await this._repo.update(id, { ...clean, updatedAt: new Date().toISOString() });
    eventBus.emit("group:changed", group);
    return group;
  }

  async getGroup(id) { return this._repo.get(id); }
  async getAllGroups() { return this._repo.getAll(); }
}
