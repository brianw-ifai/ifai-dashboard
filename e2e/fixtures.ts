import { expect, test as base, type Locator, type Page } from "@playwright/test";

/** Thin page object over the v3 canvas so specs read as behaviour, not selectors. */
export class Canvas {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto("/v3");
    await expect(this.panel).toBeVisible();
  }

  /** Reload and wait for the panel back, for "does this survive a refresh" checks. */
  async reload() {
    await this.page.reload();
    await expect(this.panel).toBeVisible();
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

  async openPriority(titleFragment: string) {
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
    return this.page.locator(".hdr-btn-primary");
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

  /** Brand AEO -> the 100-prompt explorer, where stars and filters live. */
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
