import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";

import type { Workout, WorkoutExercise, WorkoutSet } from "../types/workout";

import WorkoutForm from "./WorkoutForm";

import { renderWithProviders } from "../test/render";
import { createLocalId } from "../utils/utils";
import { useState } from "react";
import type { PreferredWeightUnit } from "../types/profile";

beforeEach(() => {
  localStorage.clear();
});

export function TestWorkoutForm({
  initialWorkout,
  pageType,
  unit,
}: {
  initialWorkout: Workout;
  pageType: "active" | "change" | "view";
  unit: PreferredWeightUnit;
}) {
  const [workout, setWorkout] = useState(initialWorkout);

  return (
    <WorkoutForm
      pageType={pageType}
      workout={workout}
      setWorkout={setWorkout}
      preferredUnit={unit}
    />
  );
}

function createSet(overrides?: Partial<WorkoutSet>): WorkoutSet {
  return {
    weight: 80,
    reps: 10,
    set_number: 1,
    rest_seconds: 90,
    done: true,
    ...overrides,
  };
}

function createExercise(overrides?: Partial<WorkoutExercise>): WorkoutExercise {
  return {
    id: createLocalId(),
    exercise_name: "Bench press",
    exercise_id: createLocalId(),
    category: "Chest",
    order_index: 1,
    notes: "Last set hit failure",
    sets: [],
    ...overrides,
  };
}

function createWorkout(overrides?: Partial<Workout>): Workout {
  return {
    name: "Custom Workout",
    started_at: new Date().toISOString(),
    finished_at: "",
    duration_seconds: 1000,
    exercises: [],
    ...overrides,
  };
}

describe("WorkoutForm", () => {
  it("renders out exercises and sets properly", () => {
    const set = createSet();
    const exercise = createExercise({ sets: [set] });
    const workout = createWorkout({ exercises: [exercise] });

    renderWithProviders(<WorkoutForm pageType="view" workout={workout} />);

    const renderedExercise = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const rows = within(renderedExercise).getAllByRole("row");
    const cells = within(rows[1]).getAllByRole("cell");

    expect(
      within(renderedExercise).getByRole("heading", {
        name: exercise.exercise_name,
      }),
    ).toBeInTheDocument();
    expect(within(renderedExercise).getByRole("textbox")).toHaveValue(
      workout.exercises[0].notes,
    );
    expect(cells[0]).toHaveTextContent(set.set_number.toString());
    expect(cells[1]).toHaveTextContent(set.weight.toString());
    expect(cells[2]).toHaveTextContent(set.reps.toString());
    expect(cells[3]).toHaveTextContent("✅");
    expect(cells[4]).toHaveTextContent("1:30");
  });

  it("switches sets correctly", async () => {
    const sets = [
      { weight: 80, reps: 10 },
      { weight: 90, reps: 12 },
    ].map((set, index) => createSet({ ...set, set_number: index + 1 }));
    const exercise = createExercise({ sets });
    const workout = createWorkout({ exercises: [exercise] });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const renderedExercise = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const rows = within(renderedExercise).getAllByRole("row");

    const navBar = screen.getByTestId("navBar");

    const weightInput = within(navBar).getByRole("spinbutton", {
      name: "Weight (kg)",
    });
    const repsInput = within(navBar).getByRole("spinbutton", { name: "Reps" });
    const setCount = within(navBar).getAllByRole("paragraph")[1];

    expect(weightInput).toHaveValue(80);
    expect(repsInput).toHaveValue(10);
    expect(setCount).toHaveTextContent("Set 1");

    await userEvent.click(rows[2]);

    expect(weightInput).toHaveValue(90);
    expect(repsInput).toHaveValue(12);
    expect(setCount).toHaveTextContent("Set 2");
  });

  it("changes sets correctly", async () => {
    const set = createSet({ weight: 85, reps: 11 });
    const exercise = createExercise({ sets: [set] });
    const workout = createWorkout({ exercises: [exercise] });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const navBar = screen.getByTestId("navBar");

    const weightInput = within(navBar).getByRole("spinbutton", {
      name: "Weight (kg)",
    });
    const repsInput = within(navBar).getByRole("spinbutton", { name: "Reps" });
    const setCount = within(navBar).getAllByRole("paragraph")[1];

    const renderedExercise = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const rows = within(renderedExercise).getAllByRole("row");

    const cells = within(rows[1]).getAllByRole("cell");

    expect(cells[1]).toHaveTextContent("85");
    expect(cells[2]).toHaveTextContent("11");

    expect(weightInput).toHaveValue(85);
    expect(repsInput).toHaveValue(11);
    expect(setCount).toHaveTextContent("Set 1");

    await userEvent.clear(weightInput);
    await userEvent.clear(repsInput);

    await userEvent.type(weightInput, "100");
    await userEvent.type(repsInput, "9");

    expect(weightInput).toHaveValue(100);
    expect(repsInput).toHaveValue(9);
    expect(setCount).toHaveTextContent("Set 1");

    expect(cells[1]).toHaveTextContent("100");
    expect(cells[2]).toHaveTextContent("9");
  });

  it("adds set correctly", async () => {
    const set = createSet({ done: false });
    const exercise = createExercise({ sets: [set] });
    const workout = createWorkout({ exercises: [exercise] });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const navBar = screen.getByTestId("navBar");

    const completeExerciseBtn = within(navBar).getByRole("button", {
      name: "Complete Exercise",
    });

    const renderedExercise = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const rowsBefore = within(renderedExercise).getAllByRole("row");

    const set1CellsBefore = within(rowsBefore[1]).getAllByRole("cell");

    const addSetBtn = within(renderedExercise).getByRole("button", {
      name: "Add Set",
    });

    expect(set1CellsBefore[0]).toHaveTextContent("1");
    expect(set1CellsBefore[1]).toHaveTextContent("80");
    expect(set1CellsBefore[2]).toHaveTextContent("10");

    expect(completeExerciseBtn).toBeInTheDocument();

    await userEvent.click(addSetBtn);

    const completeSetBtn = within(navBar).getByRole("button", {
      name: "Complete Set",
    });

    const rowsAfter = within(renderedExercise).getAllByRole("row");

    const set1CellsAfter = within(rowsAfter[1]).getAllByRole("cell");

    const set2Cells = within(rowsAfter[2]).getAllByRole("cell");

    expect(rowsAfter).toHaveLength(3);

    expect(set1CellsAfter[0]).toHaveTextContent("1");
    expect(set1CellsAfter[1]).toHaveTextContent("80");
    expect(set1CellsAfter[2]).toHaveTextContent("10");

    expect(set2Cells[0]).toHaveTextContent("2");
    expect(set2Cells[1]).toHaveTextContent("0");
    expect(set2Cells[2]).toHaveTextContent("0");

    expect(completeSetBtn).toBeInTheDocument();
  });

  it("deletes sets correctly", async () => {
    const sets = [
      { weight: 80, reps: 10, done: false },
      { weight: 90, reps: 12, done: false },
    ].map((set, index) => createSet({ ...set, set_number: index + 1 }));
    const exercise = createExercise({ sets });
    const workout = createWorkout({ exercises: [exercise] });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const navBar = screen.getByTestId("navBar");

    const weightInput = within(navBar).getByRole("spinbutton", {
      name: "Weight (kg)",
    });
    const repsInput = within(navBar).getByRole("spinbutton", { name: "Reps" });
    const setCount = within(navBar).getAllByRole("paragraph")[1];

    const completeSetBtn = within(navBar).getByRole("button", {
      name: "Complete Set",
    });

    const renderedExercise = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const rowsBefore = within(renderedExercise).getAllByRole("row");

    const set1CellsBefore = within(rowsBefore[1]).getAllByRole("cell");

    const set2CellsBefore = within(rowsBefore[2]).getAllByRole("cell");

    expect(set1CellsBefore[0]).toHaveTextContent("1");
    expect(set1CellsBefore[1]).toHaveTextContent("80");
    expect(set1CellsBefore[2]).toHaveTextContent("10");

    expect(set2CellsBefore[0]).toHaveTextContent("2");
    expect(set2CellsBefore[1]).toHaveTextContent("90");
    expect(set2CellsBefore[2]).toHaveTextContent("12");

    expect(weightInput).toHaveValue(80);
    expect(repsInput).toHaveValue(10);
    expect(setCount).toHaveTextContent("Set 1");

    expect(completeSetBtn).toBeInTheDocument();

    await userEvent.click(rowsBefore[2]);

    expect(weightInput).toHaveValue(90);
    expect(repsInput).toHaveValue(12);
    expect(setCount).toHaveTextContent("Set 2");

    await userEvent.click(within(set1CellsBefore[5]).getByRole("button"));

    const completeExerciseBtn = within(navBar).getByRole("button", {
      name: "Complete Exercise",
    });

    const rowsAfter = within(renderedExercise).getAllByRole("row");

    const set1CellsAfter = within(rowsAfter[1]).getAllByRole("cell");

    expect(rowsAfter).toHaveLength(2);

    expect(set1CellsAfter[0]).toHaveTextContent("1");
    expect(set1CellsAfter[1]).toHaveTextContent("90");
    expect(set1CellsAfter[2]).toHaveTextContent("12");

    expect(weightInput).toHaveValue(90);
    expect(repsInput).toHaveValue(12);
    expect(setCount).toHaveTextContent("Set 1");

    expect(completeExerciseBtn).toBeInTheDocument();
  });

  it("completes set correctly", async () => {
    const sets = [
      { weight: 80, reps: 10, done: false },
      { weight: 85, reps: 12, done: false },
    ].map((set, index) => createSet({ ...set, set_number: index + 1 }));
    const exercise = createExercise({ sets });
    const workout = createWorkout({ exercises: [exercise] });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const navBar = screen.getByTestId("navBar");

    const weightInput = within(navBar).getByRole("spinbutton", {
      name: "Weight (kg)",
    });
    const repsInput = within(navBar).getByRole("spinbutton", { name: "Reps" });
    const setCount = within(navBar).getAllByRole("paragraph")[1];

    const completeSetBtn = within(navBar).getByRole("button", {
      name: "Complete Set",
    });

    const renderedExercise = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const rowsBefore = within(renderedExercise).getAllByRole("row");

    const set1CellsBefore = within(rowsBefore[1]).getAllByRole("cell");

    const set2CellsBefore = within(rowsBefore[2]).getAllByRole("cell");

    expect(set1CellsBefore[3]).not.toHaveTextContent("✅");

    expect(set2CellsBefore[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(80);
    expect(repsInput).toHaveValue(10);
    expect(setCount).toHaveTextContent("Set 1");

    expect(completeSetBtn).toBeInTheDocument();

    await userEvent.click(completeSetBtn);

    const completeExerciseBtn = within(navBar).getByRole("button", {
      name: "Complete Exercise",
    });

    const rowsAfter = within(renderedExercise).getAllByRole("row");

    const set1CellsAfter = within(rowsAfter[1]).getAllByRole("cell");

    const set2CellsAfter = within(rowsAfter[2]).getAllByRole("cell");

    expect(set1CellsAfter[3]).toHaveTextContent("✅");

    expect(set2CellsAfter[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(85);
    expect(repsInput).toHaveValue(12);
    expect(setCount).toHaveTextContent("Set 2");

    expect(completeExerciseBtn).toBeInTheDocument();
  });

  it("completes exercise correctly", async () => {
    const sets = [
      { weight: 80, reps: 10, done: false },
      { weight: 85, reps: 12, done: false },
    ].map((set) => createSet({ ...set }));
    const exercises = sets.map((set, index) =>
      createExercise({
        sets: [set],
        order_index: index + 1,
        exercise_name: index === 1 ? "Incline Press" : "Bench Press",
      }),
    );
    const workout = createWorkout({ exercises });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const navBar = screen.getByTestId("navBar");

    const weightInput = within(navBar).getByRole("spinbutton", {
      name: "Weight (kg)",
    });
    const repsInput = within(navBar).getByRole("spinbutton", { name: "Reps" });
    const setCount = within(navBar).getAllByRole("paragraph")[1];
    const exerciseName = within(navBar).getAllByRole("paragraph")[0];

    const completeExerciseBtn = within(navBar).getByRole("button", {
      name: "Complete Exercise",
    });

    const renderedExercise1 = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const renderedExercise2 = screen.getByTestId(
      `exercise-${workout.exercises[1].id}`,
    );

    const rows1Before = within(renderedExercise1).getAllByRole("row");
    const rows2Before = within(renderedExercise2).getAllByRole("row");

    const set1CellsBefore = within(rows1Before[1]).getAllByRole("cell");
    const set2CellsBefore = within(rows2Before[1]).getAllByRole("cell");

    expect(set1CellsBefore[3]).not.toHaveTextContent("✅");

    expect(set2CellsBefore[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(80);
    expect(repsInput).toHaveValue(10);
    expect(setCount).toHaveTextContent("Set 1");
    expect(exerciseName).toHaveTextContent("Bench Press");

    expect(completeExerciseBtn).toBeInTheDocument();

    await userEvent.click(completeExerciseBtn);

    const rows1After = within(renderedExercise1).getAllByRole("row");
    const rows2After = within(renderedExercise2).getAllByRole("row");

    const set1CellsAfter = within(rows1After[1]).getAllByRole("cell");
    const set2CellsAfter = within(rows2After[1]).getAllByRole("cell");

    expect(set1CellsAfter[3]).toHaveTextContent("✅");

    expect(set2CellsAfter[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(85);
    expect(repsInput).toHaveValue(12);
    expect(setCount).toHaveTextContent("Set 1");
    expect(exerciseName).toHaveTextContent("Incline Press");
  });

  // Superset

  it("completes set in superset correctly", async () => {
    const sets = [
      [
        { weight: 80, reps: 10, done: false },
        { weight: 85, reps: 12, done: false },
      ],
      [
        { weight: 20, reps: 15, done: false },
        { weight: 25, reps: 20, done: false },
      ],
    ].map((setStack) =>
      setStack.map((set, index) =>
        createSet({ ...set, set_number: index + 1 }),
      ),
    );
    const exercises = sets.map((set, index) =>
      createExercise({
        sets: set,
        order_index: index + 1,
        exercise_name: index === 0 ? "Bench Press" : "Incline Press",
      }),
    );
    const workout = createWorkout({ exercises });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const navBar = screen.getByTestId("navBar");

    const weightInput = within(navBar).getByRole("spinbutton", {
      name: "Weight (kg)",
    });
    const repsInput = within(navBar).getByRole("spinbutton", { name: "Reps" });
    const setCount = within(navBar).getAllByRole("paragraph")[1];
    const exerciseName = within(navBar).getAllByRole("paragraph")[0];

    const completeSetBtn = within(navBar).getByRole("button", {
      name: "Complete Set",
    });

    const renderedExercise1 = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );

    const renderedExercise2 = screen.getByTestId(
      `exercise-${workout.exercises[1].id}`,
    );

    // Initiating superset through menu
    await userEvent.click(
      within(renderedExercise1).getByRole("button", {
        name: "Exercise options",
      }),
    );
    await userEvent.click(
      within(renderedExercise1).getByRole("button", { name: "Superset" }),
    );

    const rows1Before = within(renderedExercise1).getAllByRole("row");
    const rows2Before = within(renderedExercise2).getAllByRole("row");

    const set1CellsBefore = within(rows1Before[1]).getAllByRole("cell");

    const set2CellsBefore = within(rows2Before[1]).getAllByRole("cell");

    expect(set1CellsBefore[3]).not.toHaveTextContent("✅");

    expect(set2CellsBefore[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(80);
    expect(repsInput).toHaveValue(10);
    expect(setCount).toHaveTextContent("Set 1");
    expect(exerciseName).toHaveTextContent("Bench Press");

    expect(completeSetBtn).toBeInTheDocument();

    await userEvent.click(completeSetBtn);

    const rows1After = within(renderedExercise1).getAllByRole("row");
    const rows2After = within(renderedExercise2).getAllByRole("row");

    const set1CellsAfter = within(rows1After[1]).getAllByRole("cell");

    const set2CellsAfter = within(rows2After[1]).getAllByRole("cell");

    expect(set1CellsAfter[3]).toHaveTextContent("✅");

    expect(set2CellsAfter[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(20);
    expect(repsInput).toHaveValue(15);
    expect(setCount).toHaveTextContent("Set 1");
    expect(exerciseName).toHaveTextContent("Incline Press");

    expect(completeSetBtn).toBeInTheDocument();
  });

  it("completes exercise in superset correctly", async () => {
    const sets = [
      { weight: 80, reps: 10, done: false },
      { weight: 85, reps: 12, done: false },
    ].map((set) => createSet({ ...set }));
    const exercises = sets.map((set, index) =>
      createExercise({
        sets: [set],
        order_index: index + 1,
        exercise_name: index === 1 ? "Incline Press" : "Bench Press",
      }),
    );
    const workout = createWorkout({ exercises });

    renderWithProviders(
      <TestWorkoutForm initialWorkout={workout} pageType="active" unit="kg" />,
    );

    const navBar = screen.getByTestId("navBar");

    const weightInput = within(navBar).getByRole("spinbutton", {
      name: "Weight (kg)",
    });
    const repsInput = within(navBar).getByRole("spinbutton", { name: "Reps" });
    const setCount = within(navBar).getAllByRole("paragraph")[1];
    const exerciseName = within(navBar).getAllByRole("paragraph")[0];

    const completeExerciseBtn = within(navBar).getByRole("button", {
      name: "Complete Exercise",
    });

    const renderedExercise1 = screen.getByTestId(
      `exercise-${workout.exercises[0].id}`,
    );
    const renderedExercise2 = screen.getByTestId(
      `exercise-${workout.exercises[1].id}`,
    );

    // Initiating superset through menu
    await userEvent.click(
      within(renderedExercise1).getByRole("button", {
        name: "Exercise options",
      }),
    );
    await userEvent.click(
      within(renderedExercise1).getByRole("button", { name: "Superset" }),
    );

    const rows1Before = within(renderedExercise1).getAllByRole("row");
    const rows2Before = within(renderedExercise2).getAllByRole("row");

    const set1CellsBefore = within(rows1Before[1]).getAllByRole("cell");
    const set2CellsBefore = within(rows2Before[1]).getAllByRole("cell");

    expect(set1CellsBefore[3]).not.toHaveTextContent("✅");

    expect(set2CellsBefore[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(80);
    expect(repsInput).toHaveValue(10);
    expect(setCount).toHaveTextContent("Set 1");
    expect(exerciseName).toHaveTextContent("Bench Press");

    expect(completeExerciseBtn).toBeInTheDocument();

    await userEvent.click(completeExerciseBtn);

    const rows1After = within(renderedExercise1).getAllByRole("row");
    const rows2After = within(renderedExercise2).getAllByRole("row");

    const set1CellsAfter = within(rows1After[1]).getAllByRole("cell");
    const set2CellsAfter = within(rows2After[1]).getAllByRole("cell");

    expect(set1CellsAfter[3]).toHaveTextContent("✅");

    expect(set2CellsAfter[3]).not.toHaveTextContent("✅");

    expect(weightInput).toHaveValue(85);
    expect(repsInput).toHaveValue(12);
    expect(setCount).toHaveTextContent("Set 1");
    expect(exerciseName).toHaveTextContent("Incline Press");
  });
});
