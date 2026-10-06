import { expect, test as base, type Locator, type Page } from "@playwright/test";

/** Thin page object over the v3 canvas so specs read as behaviour, not selectors. */
export class Canvas {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto("/");
    const skipLogin = this.page.getByRole("button", { name: "Skip Login" });
    if (await skipLogin.isVisible().catch(() => false)) {
      await skipLogin.click();
    }
    await expect(this.page.locator(".ifai-canvas")).toBeVisible();
    await expect(this.page.locator(".ifai-canvas.panel-hidden")).toHaveCount(1);
  }

  /** Opens a spoke from the map column layout (panel starts hidden on IOM). */
  async openSpokeFromMap(titleFragment: string) {
    // Spoke titles are drawn as separate SVG lines, so the DOM text has no space.
    const pattern = new RegExp(titleFragment.trim().split(/\s+/).join("\\s*"), "i");
    await this.page.locator(".graph-node").filter({ hasText: pattern }).click({ force: true });
    await expect(this.page.locator(".ifai-canvas.column-layout")).toHaveCount(1);
    await expect(this.panel).toBeVisible();
  }

  /** Reload and wait for the panel back, for "does this survive a refresh" checks. */
  async reload() {
    await this.page.reload();
    await expect(this.page.locator(".ifai-canvas.panel-hidden")).toHaveCount(1);
  }

  get panel() {
    return this.page.locator(".drilldown-panel");
  }

  get commandCenter() {
    return this.page.locator(".command-center");
  }

  get priorities() {
    return this.page.locator(".cc-item");
  }

  /** A priority row by a fragment of its headline. */
  priority(titleFragment: string) {
    return this.priorities.filter({ hasText: titleFragment });
  }

  async openCommandCenter() {
    await this.page.locator(".hdr-btn", { hasText: "Priorities" }).click();
    await expect(this.commandCenter).toBeVisible();
  }

  async openPriority(titleFragment: string) {
    await this.openCommandCenter();
    await this.priority(titleFragment).locator(".cc-open-btn").click();
    await expect(this.page.locator(".drilldown-back-btn")).toBeVisible();
  }

  async backToPriorities() {
    await this.page.locator(".drilldown-back-btn").click();
    await expect(this.commandCenter).toBeVisible();
  }

  get activeTab() {
    return this.page.locator(".drilldown-tab-btn.active");
  }

  async openTab(nameFragment: string) {
    await this.page.locator(".drilldown-tab-btn", { hasText: nameFragment }).click();
    await expect(this.activeTab).toContainText(nameFragment);
  }

  get tourCard() {
    return this.page.locator(".tour-modal-card");
  }

  get tourStep() {
    return this.page.locator(".tour-step-pill");
  }

  get tourButton() {
    return this.page.locator(".tour-launcher.map-chrome-onscreen");
  }

  async startTour() {
    await this.tourButton.click();
    await expect(this.tourCard).toBeVisible();
  }

  async nextTourStep() {
    await this.page.locator(".tour-btn-primary").click();
  }

  get resumeChip() {
    return this.page.locator(".drilldown-resume-btn");
  }

  get simulations() {
    return this.page.locator("#simulation-list .action-card");
  }

  filterChip(label: string) {
    return this.page.locator(".segmented-btn", { hasText: label });
  }

  /** AI Search Visibility -> the 100-prompt explorer, where stars and filters live. */
  async openSimulations() {
    await this.openPriority("AI assistants are quoting specs");
    await this.openTab("Simulations");
    await expect(this.simulations.first()).toBeVisible();
  }
}

type Fixtures = {
  canvas: Canvas;
  /** Page errors seen during the test; asserted empty on teardown. */
  pageErrors: string[];
};

/* Both fixtures are `auto` so every test starts on a loaded /v3 with the error
   listener attached, whether or not it destructures them. A spec that asks only
   for `page` would otherwise run against about:blank. */
export const test = base.extend<Fixtures>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error).split("\n")[0]));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console: ${message.text()}`);
      });
      await use(errors);
      // A dashboard that throws in the console is broken even if the assertion passed.
      expect(errors, `unexpected page errors:\n${errors.join("\n")}`).toEqual([]);
    },
    { auto: true },
  ],

  canvas: [
    async ({ page, pageErrors }, use) => {
      void pageErrors; // ordering: attach the listener before the first navigation
      const canvas = new Canvas(page);
      await canvas.open();
      await use(canvas);
    },
    { auto: true },
  ],
});

export { expect };
export type { Locator };
