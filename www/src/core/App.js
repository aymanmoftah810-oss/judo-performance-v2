import { Router } from "./Router.js";
import { installGlobalErrorHandler } from "./ErrorHandler.js";
import { renderNavigation } from "./Navigation.js";

import { LocalStorageAdapter } from "../database/adapters/LocalStorageAdapter.js";

import { PlayerRepository } from "../database/repositories/PlayerRepository.js";
import { GroupRepository } from "../database/repositories/GroupRepository.js";
import { TestRepository } from "../database/repositories/TestRepository.js";
import { TestResultRepository } from "../database/repositories/TestResultRepository.js";
import { StandardsRepository } from "../database/repositories/StandardsRepository.js";
import { AttendanceRepository } from "../database/repositories/AttendanceRepository.js";

import { PlayerService } from "../services/PlayerService.js";
import { GroupService } from "../services/GroupService.js";
import { TestService } from "../services/TestService.js";
import { EvaluationService } from "../services/EvaluationService.js";
import { TestResultService } from "../services/TestResultService.js";
import { AttendanceService } from "../services/AttendanceService.js";
import { PerformanceAnalysisService } from "../services/PerformanceAnalysisService.js";

import { resolveStandardsSeed } from "../database/seeds/resolveStandardsSeed.js";

import { PlayersModule } from "../modules/players/PlayersModule.js";
import { PlayerProfileModule } from "../modules/players/PlayerProfileModule.js";
import { DashboardModule } from "../modules/dashboard/DashboardModule.js";
import { TestEntryModule } from "../modules/tests/TestEntryModule.js";
import { AttendanceModule } from "../modules/attendance/AttendanceModule.js";
import { ReportsModule } from "../modules/reports/ReportsModule.js";
import { SettingsModule } from "../modules/settings/SettingsModule.js";

/**
 * App — composition root.
 *
 * This is the ONLY file in the whole project that is allowed to know
 * which concrete StorageAdapter is in use. Everything downstream
 * (Repositories, Services, UI modules) only ever sees interfaces/injected
 * instances. A future Phase 3 IndexedDB swap changes exactly one line here
 * (LocalStorageAdapter -> IndexedDBAdapter) and nothing else in the
 * project needs to change — this held true through Phase 2 as well:
 * every new repository/service/module below was added without touching
 * the Phase 1 adapter or its contract.
 */
export async function startApp() {
  installGlobalErrorHandler();

  // --- Storage (the only line that changes if the adapter is ever swapped) ---
  const adapter = new LocalStorageAdapter();

  // --- Repositories (each owns its own key scheme, all built on the same adapter) ---
  const playerRepository = new PlayerRepository(adapter);
  const groupRepository = new GroupRepository(adapter);
  const testRepository = new TestRepository(adapter);
  const testResultRepository = new TestResultRepository(adapter);
  const standardsRepository = new StandardsRepository(adapter);
  const attendanceRepository = new AttendanceRepository(adapter);

  // --- First-run seeding (idempotent - safe to call on every startup) ---
  const tests = await testRepository.ensureSeeded();
  await standardsRepository.ensureSeeded(resolveStandardsSeed(tests));

  // --- Services (business logic; each depends only on repository interfaces) ---
  const playerService = new PlayerService(playerRepository);
  const groupService = new GroupService(groupRepository);
  const testService = new TestService(testRepository);
  const evaluationService = new EvaluationService(standardsRepository, testRepository);
  const testResultService = new TestResultService(testResultRepository, playerRepository, evaluationService);
  const attendanceService = new AttendanceService(attendanceRepository);
  const performanceService = new PerformanceAnalysisService(testResultRepository, testRepository);

  // --- Router ---
  const router = new Router();

  // --- UI Modules (depend only on services + router, never on repositories/storage) ---
  const playersModule = new PlayersModule(playerService, groupService, router);
  const playerProfileModule = new PlayerProfileModule({
    playerService, groupService, testResultService, testService,
    attendanceService, evaluationService, performanceService, router,
  });
  const dashboardModule = new DashboardModule({ playerService, testResultService, attendanceService, router });
  const testEntryModule = new TestEntryModule({ playerService, testService, testResultService, evaluationService });
  const attendanceModule = new AttendanceModule({ playerService, attendanceService });
  const reportsModule = new ReportsModule({ playerService, testService, testResultService, performanceService });
  const settingsModule = new SettingsModule({ groupService, testService, standardsRepo: standardsRepository });

  router.register("dashboard", (c) => dashboardModule.render(c), { isDefault: true });
  router.register("players", (c) => playersModule.render(c));
  router.register("player", (c, id) => playerProfileModule.render(c, id));
  router.register("testentry", (c) => testEntryModule.render(c));
  router.register("attendance", (c) => attendanceModule.render(c));
  router.register("reports", (c) => reportsModule.render(c));
  router.register("settings", (c) => settingsModule.render(c));

  // Re-render the bottom nav highlight on every route change.
  window.addEventListener("hashchange", () => renderNavigation(router));

  const appContainer = document.getElementById("app");
  router.mount(appContainer);
  renderNavigation(router);

  // Exposed for the architecture/e2e tests only (see /tests). Not used by
  // any UI code — production code must never reach through window.__app.
  window.__app = {
    adapter,
    repositories: { playerRepository, groupRepository, testRepository, testResultRepository, standardsRepository, attendanceRepository },
    services: { playerService, groupService, testService, evaluationService, testResultService, attendanceService, performanceService },
    modules: { playersModule, playerProfileModule, dashboardModule, testEntryModule, attendanceModule, reportsModule, settingsModule },
    router,
  };
}
