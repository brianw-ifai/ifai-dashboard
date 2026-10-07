import { expect, test, type Canvas } from "./fixtures";

async function expectLoaded(canvas: Canvas) {
  const { page } = canvas;
  const hubLogo = page.locator("image.hub-logo");
  await expect(hubLogo).toHaveAttribute("href", "/image.png");
  const brandLogo = page.locator(".brand-logo-icon");
  await expect(brandLogo).toHaveAttribute("src", "/icon.png");
  await expect
    .poll(() => brandLogo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  const hubStatus = await page.request.get("/image.png");
  expect(hubStatus.status()).toBe(200);
}

test("hub and header logos load and the stage has no clipped watermark", async ({ canvas, page }) => {
  await expectLoaded(canvas);
  await expect(page.locator("svg.canvas-stage image")).toHaveCount(0);
  await expect(page.locator("#iomWatermarkClip")).toHaveCount(0);
  await expect(page.locator("svg.canvas-stage clipPath")).toHaveCount(0);
});

test("logos and stage stay clean in the light theme", async ({ canvas, page }) => {
  await page.locator(".header-controls .hdr-btn").last().click();
  await expect(page.locator(".ifai-canvas.light-theme")).toHaveCount(1);
  await expectLoaded(canvas);
  await expect(page.locator("svg.canvas-stage image")).toHaveCount(0);
});
