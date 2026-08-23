import { PlayerRepository } from "../src/database/repositories/PlayerRepository.js";
import { PlayerService, ValidationError } from "../src/services/PlayerService.js";

class MemoryAdapter {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  async set(key, value) {
    this.data.set(key, structuredClone(value));
  }

  async delete(key) {
    this.data.delete(key);
  }

  async list(prefix) {
    return [...this.data.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => ({
        key,
        value: structuredClone(value)
      }));
  }
}

const results = [];

function test(id, label, condition, detail = "") {
  const pass = Boolean(condition);
  results.push(pass);
  console.log(
    `${id}  ${label}: ${pass ? "PASS" : "FAIL"}${detail ? `  (${detail})` : ""}`
  );
}

async function main() {
  const adapter = new MemoryAdapter();
  const repository = new PlayerRepository(adapter);
  const service = new PlayerService(repository);

  // PLAYER-001: Create
  const p1 = await service.createPlayer({
    name: "محمد علي",
    birthYear: "2012"
  });

  test(
    "PLAYER-001",
    "Create Player",
    p1.id === 1 &&
    p1.name === "محمد علي" &&
    p1.birthYear === 2012 &&
    p1.deletedAt === null
  );

  // PLAYER-001b: Arabic-Indic digits
  const p2 = await service.createPlayer({
    name: "لاعب بأرقام عربية",
    birthYear: "٢٠١٠"
  });

  test(
    "PLAYER-001b",
    "Arabic-Indic birth year normalization",
    p2.id === 2 && p2.birthYear === 2010
  );

  // PLAYER-002: Update
  const updated = await service.updatePlayer(1, {
    name: "محمد علي",
    birthYear: "2012",
    belt: "أخضر"
  });

  test(
    "PLAYER-002",
    "Edit Player",
    updated.id === 1 && updated.belt === "أخضر"
  );

  // PLAYER-003: Soft Delete
  const deleted = await service.softDeletePlayer(2);
  const activePlayers = await service.getAllPlayers();
  const storedDeleted = await service.getPlayer(2);

  test(
    "PLAYER-003",
    "Soft Delete",
    !!deleted.deletedAt &&
    activePlayers.length === 1 &&
    activePlayers[0].id === 1 &&
    !!storedDeleted.deletedAt
  );

  // ARCH-004: CRUD composite
  test(
    "ARCH-004",
    "Player CRUD",
    p1.id === 1 &&
    updated.belt === "أخضر" &&
    !!storedDeleted.deletedAt
  );

  // ARCH-005: Persistence through repository
  const reloadedRepository = new PlayerRepository(adapter);
  const reloadedService = new PlayerService(reloadedRepository);

  const survived = await reloadedService.getPlayer(1);
  const stillDeleted = await reloadedService.getPlayer(2);

  test(
    "ARCH-005",
    "Repository persistence",
    survived?.name === "محمد علي" &&
    survived?.belt === "أخضر" &&
    !!stillDeleted?.deletedAt
  );

  // SEARCH-001
  const search = await reloadedService.searchPlayers("محمد");

  test(
    "SEARCH-001",
    "Search by name",
    search.length === 1 &&
    search[0].id === 1
  );

  // VALIDATION-001
  let validationWorked = false;

  try {
    await reloadedService.createPlayer({
      name: "",
      birthYear: "2012"
    });
  } catch (error) {
    validationWorked = error instanceof ValidationError;
  }

  test(
    "VALIDATION-001",
    "Empty name rejected",
    validationWorked
  );

  // VALIDATION-002
  let invalidYearRejected = false;

  try {
    await reloadedService.createPlayer({
      name: "لاعب",
      birthYear: "١٩٠٠"
    });
  } catch (error) {
    invalidYearRejected = error instanceof ValidationError;
  }

  test(
    "VALIDATION-002",
    "Invalid birth year rejected",
    invalidYearRejected
  );

  console.log("\n--------------------------------");
  console.log(
    `Overall Phase 1 Node Test: ${
      results.every(Boolean) ? "PASS" : "FAIL"
    }`
  );
  console.log("--------------------------------");

  process.exit(results.every(Boolean) ? 0 : 1);
}

main().catch(error => {
  console.error("TEST CRASHED:", error);
  process.exit(1);
});
