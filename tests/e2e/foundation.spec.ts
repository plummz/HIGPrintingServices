import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
const password = "Browser-test-password-802!";
test("verified owner creates workspace, updates settings and signs out", async ({
  page,
}) => {
  const email = `browser-${randomUUID()}@example.test`;
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Sample Print Owner");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  let url = "";
  for (const file of await readdir(".local/mail")) {
    const m = JSON.parse(await readFile(".local/mail/" + file, "utf8"));
    if (m.to === email && m.subject.includes("Verify")) url = m.url;
  }
  expect(url).toBeTruthy();
  await page.goto(url);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: false }).click();
  await expect(page).toHaveURL(/workspaces$/);
  await page.getByLabel("Business name").fill("Sample Print Studio");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Sample Print Studio" }),
  ).toBeVisible();
  await page.getByLabel("Contact details").fill("Example contact");
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/api/v1/businesses/"),
  );
  await page.getByRole("button", { name: "Save settings" }).click();
  expect((await saved).ok()).toBeTruthy();
  await expect(
    page.getByRole("button", { name: "Save settings" }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel("Contact details")).toHaveValue(
    "Example contact",
  );
  await expect(
    page.getByRole("heading", { name: "Team & access" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/workspace-${test.info().project.name}.png`,
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login$/);
  await page.goto("/workspaces");
  await expect(page).toHaveURL(/login$/);
});
test("login layout is readable and reset request is neutral", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/login-${test.info().project.name}.png`,
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/forgot-password$/);
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("missing@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "If this email has an account",
  );
});
