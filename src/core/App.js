import { Router } from "./Router.js";
import { installGlobalErrorHandler } from "./ErrorHandler.js";
import { LocalStorageAdapter } from "../database/adapters/LocalStorageAdapter.js";
import { PlayerRepository } from "../database/repositories/PlayerRepository.js";
import { PlayerService } from "../services/PlayerService.js";
import { PlayersModule } from "../modules/players/PlayersModule.js";

/**
 * App — composition root.
 *
 * This is the ONLY file in the whole project that is allowed to know
 * which concrete StorageAdapter is in use. Everything downstream
 * (Repository, Service, UI modules) only ever sees interfaces/injected
 * instances. Phase 2 changes exactly one line here (swap
 * LocalStorageAdapter for IndexedDBAdapter) and nothing else in the
 * project needs to change.
 */
export async function startApp() {
  installGlobalErrorHandler();

  // --- Composition: Adapter -> Repository -> Service -> UI Module ---
  const adapter = new LocalStorageAdapter();
  const playerRepository = new PlayerRepository(adapter);
  const playerService = new PlayerService(playerRepository);
  const playersModule = new PlayersModule(playerService);

  const router = new Router();
  router.register("players", (container) => playersModule.render(container), { isDefault: true });

  const appContainer = document.getElementById("app");
  router.mount(appContainer);

  // Exposed for the architecture tests only (see /tests). Not used by
  // any UI code — production code must never reach through window.__app.
  window.__app = { adapter, playerRepository, playerService, playersModule, router };
}
