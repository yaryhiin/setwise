import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

if (!email || !password) {
  throw new Error("Missing E2E test credentials");
}

test("user can create a routine and complete a workout", async ({ page }) => {
  const routineName = `Test ${new Date().toISOString()}`;

  await page.goto("/login");

  // Logining in
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByText(", Test", { exact: false })).toBeVisible();

  // Opening Routines
  await page.getByRole("button", { name: "Routines" }).click();
  await expect(page.getByRole("heading", { name: "Routines" })).toBeVisible();

  // Creating Routine
  await page.getByRole("button", { name: "+ Create Routine" }).click();
  await expect(
    page.getByRole("heading", { name: "Routine Name:" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Routine Name" }).fill(routineName);
  await page.getByRole("button", { name: "+ Add Exercise" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose Exercise" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Barbell Bench Press" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();

  const routine = page.getByTestId("routineItem").filter({
    has: page.getByRole("heading", { name: routineName, exact: true }),
  });
  await expect(routine).toBeVisible();
  await routine.getByRole("button", { name: "Start" }).click();

  await page.getByRole("spinbutton", { name: "Weight (kg)" }).fill("80");
  await page.getByRole("button", { name: "Add Set" }).click();
  await page.getByRole("spinbutton", { name: "Reps" }).fill("10");
  await page.getByRole("button", { name: "Complete Set" }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("button", { name: "Finish" }).nth(1).click();
  await page.getByRole("button", { name: "Done" }).click();

  const workout = page.getByTestId("workoutItem").filter({
    has: page.getByText(routineName, { exact: false }),
  });
  await expect(workout).toBeVisible();
  await workout.getByRole("button", { name: "Workout options" }).click();
  await workout.getByRole("button", { name: "View" }).click();

  await expect(page.getByRole("heading", { name: routineName })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Barbell Bench Press" }),
  ).toBeVisible();
  const rows = page.getByRole("row");
  const cells1 = rows.nth(1).getByRole("cell");
  const cells2 = rows.nth(2).getByRole("cell");
  await expect(cells1.nth(1)).toHaveText("80");
  await expect(cells1.nth(2)).toHaveText("10");
  await expect(cells1.nth(3)).toHaveText("✅");
  await expect(cells2.nth(1)).toHaveText("80");
  await expect(cells2.nth(2)).toHaveText("0");
  await expect(cells2.nth(3)).toHaveText("");
});
