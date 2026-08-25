import { BaseRepository } from "./BaseRepository.js";

export class GroupRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, "group");
  }
}
