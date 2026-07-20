import { test, expect, type Page } from "@playwright/test";

const PASSWORD = process.env.GATE_PASSWORD || "lantern";

async function enter(page: Page) {
  // Authenticate via the gate API (shares cookies with the page context).
  const res = await page.request.post("/api/auth", {
    data: { password: PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
}

test("app manifest is reachable and named NextAct", async ({ page }) => {
  const res = await page.request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.name).toBe("NextAct");
  expect(json.display).toBe("standalone");
});

test("home loads without horizontal overflow", async ({ page }) => {
  await enter(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("home opens the conversation", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Continue this reflection" }).click();
  await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
});

test("conversation composer is reachable at mobile height", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Talk" }).click();
  const composer = page.getByRole("textbox", { name: "Message" });
  await expect(composer).toBeInViewport();
  const send = page.getByRole("button", { name: "Send" });
  await expect(send).toBeInViewport();
});

test("text stays in the composer after a failed request", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Talk" }).click();
  // Force the chat request to fail with a server error.
  await page.route("**/api/chat", (route) =>
    route.fulfill({ status: 500, contentType: "text/plain", body: "error" }),
  );
  const composer = page.getByRole("textbox", { name: "Message" });
  await composer.fill("This should survive a failure.");
  await page.getByRole("button", { name: "Send" }).click();
  // The words are preserved so nothing the person typed is lost.
  await expect(composer).toHaveValue(/This should survive a failure\./, {
    timeout: 15000,
  });
});

test("legacy map opens", async ({ page }) => {
  await enter(page);
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Legacy", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Living Legacy" })).toBeVisible();
});

test("file picker accepts the required types", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Talk" }).click();
  const accept = await page
    .locator('input[type="file"]')
    .getAttribute("accept");
  expect(accept).toBeTruthy();
  for (const ext of [".pdf", ".txt", ".md", "image/png", "image/jpeg"]) {
    expect(accept!).toContain(ext);
  }
});

test("navigation touch targets meet 44px minimum", async ({ page }) => {
  await enter(page);
  const buttons = page.getByRole("navigation", { name: "Primary" }).getByRole("button");
  const count = await buttons.count();
  expect(count).toBe(3);
  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});
