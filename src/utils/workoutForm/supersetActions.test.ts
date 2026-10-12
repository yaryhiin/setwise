import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  Superset,
} from "../../types/workout";

import { createLocalId } from "../utils";
import {
  supersetCompleteExercise,
  supersetCompleteSet,
} from "./supersetActions";

type TestCase = {
  name: string;
  data: number[];
  selectedSetIndex: number;
  selectedExerciseIndex: number;
  supersetExerciseIndexes: [number, number][];
  expected: {
    exerciseIndex: number | null;
    setIndex: number | null;
    addNewSet: boolean;
    restStartKey: "exercise1RestStart" | "exercise2RestStart";
    endSuperset?: boolean;
  };
};

function createSets(setCount: number): WorkoutSet[] {
  let sets: WorkoutSet[] = [];
  for (let i = 1; i <= setCount; i++) {
    sets.push({
      weight: 80,
      reps: 10,
      set_number: i,
      rest_seconds: 90,
      done: true,
    });
  }
  return sets;
}

function createExercise(
  setCount: number,
  overrides: Partial<WorkoutExercise>,
): WorkoutExercise {
  return {
    id: createLocalId(),
    exercise_name: "",
    exercise_id: createLocalId(),
    category: "",
    order_index: 1,
    notes: "",
    sets: createSets(setCount),
    ...overrides,
  };
}

function createWorkout(data: number[]): Workout {
  return {
    name: "Custom Workout",
    started_at: "",
    finished_at: "",
    duration_seconds: 1000,
    exercises: data.map((setCount, index) =>
      createExercise(setCount, { order_index: index + 1 }),
    ),
  };
}

function createSuperset(exercise1Id: string, exercise2Id: string): Superset {
  return {
    exercise0Id: "",
    exercise1Id,
    exercise2Id,
    exercise1RestStart: "2026-01-01T10:00:00.000Z",
    exercise2RestStart: "2026-01-01T10:01:00.000Z",
  };
}

function editSuperset(superset: Superset, overrides: Partial<Superset>) {
  return {
    ...superset,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("supersetCompleteSet", () => {
  it.each<TestCase>([
    {
      name: "completes set in the first superset exercise",
      data: [3, 3, 3, 3],
      selectedExerciseIndex: 1,
      selectedSetIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 2,
        setIndex: 1,
        addNewSet: false,
        restStartKey: "exercise1RestStart",
      },
    },
    {
      name: "completes set in the second superset exercise",
      data: [3, 3, 3, 3],
      selectedExerciseIndex: 2,
      selectedSetIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 1,
        setIndex: 2,
        addNewSet: false,
        restStartKey: "exercise2RestStart",
      },
    },
    {
      name: "adds new set for second superset exercise",
      data: [3, 3, 1, 3],
      selectedExerciseIndex: 1,
      selectedSetIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 2,
        setIndex: 1,
        addNewSet: true,
        restStartKey: "exercise1RestStart",
      },
    },
    {
      name: "adds new set for first superset exercise",
      data: [3, 1, 3, 3],
      selectedExerciseIndex: 2,
      selectedSetIndex: 0,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 1,
        setIndex: 1,
        addNewSet: true,
        restStartKey: "exercise2RestStart",
      },
    },
  ])(
    "$name",
    ({
      data,
      selectedExerciseIndex,
      selectedSetIndex,
      supersetExerciseIndexes,
      expected,
    }) => {
      const workout = createWorkout(data);
      const supersets = supersetExerciseIndexes.map((superset) =>
        createSuperset(
          workout.exercises[superset[0]].exercise_id,
          workout.exercises[superset[1]].exercise_id,
        ),
      );

      const selectedExercise = workout.exercises[selectedExerciseIndex];

      const newSuperset = supersets.map((superset) =>
        superset.exercise1Id === selectedExercise.exercise_id ||
        superset.exercise2Id === selectedExercise.exercise_id
          ? editSuperset(superset, {
              [expected.restStartKey]: new Date().toISOString(),
            })
          : superset,
      );
      expect(
        supersetCompleteSet(
          workout,
          supersets,
          workout.exercises[selectedExerciseIndex],
          workout.exercises[selectedExerciseIndex].sets[selectedSetIndex],
        ),
      ).toStrictEqual({
        newSelectedExercise:
          expected.exerciseIndex !== null
            ? workout.exercises[expected.exerciseIndex]
            : null,
        newSelectedSet:
          expected.exerciseIndex !== null && expected.setIndex !== null
            ? expected.addNewSet
              ? {
                  weight: 80,
                  reps: 0,
                  set_number:
                    workout.exercises[expected.exerciseIndex].sets.length + 1,
                  rest_seconds: 0,
                  done: false,
                }
              : workout.exercises[expected.exerciseIndex].sets[
                  expected.setIndex
                ]
            : null,
        addNewSet: expected.addNewSet,
        newSuperset,
      });
    },
  );
});

describe("supersetCompleteExercise", () => {
  it.each<TestCase>([
    {
      name: "completes exercise in the first superset exercise",
      data: [3, 3, 3, 3],
      selectedExerciseIndex: 1,
      selectedSetIndex: 2,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 2,
        setIndex: 2,
        addNewSet: false,
        restStartKey: "exercise1RestStart",
        endSuperset: false,
      },
    },
    {
      name: "completes set in the second superset exercise",
      data: [3, 3, 3, 3],
      selectedExerciseIndex: 2,
      selectedSetIndex: 2,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 3,
        setIndex: 0,
        addNewSet: false,
        restStartKey: "exercise2RestStart",
        endSuperset: true,
      },
    },
    {
      name: "adds new set for second superset exercise",
      data: [3, 2, 1, 3],
      selectedExerciseIndex: 1,
      selectedSetIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 2,
        setIndex: 1,
        addNewSet: true,
        restStartKey: "exercise1RestStart",
        endSuperset: false,
      },
    },
    {
      name: "ends superset when first exercise has no remaining sets",
      data: [3, 1, 2, 3],
      selectedExerciseIndex: 2,
      selectedSetIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 3,
        setIndex: 0,
        addNewSet: false,
        restStartKey: "exercise2RestStart",
        endSuperset: true,
      },
    },
    {
      name: "second superset exercise is last exercise in workout",
      data: [3, 3, 3],
      selectedExerciseIndex: 2,
      selectedSetIndex: 2,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: null,
        setIndex: null,
        addNewSet: false,
        restStartKey: "exercise2RestStart",
        endSuperset: true,
      },
    },
    {
      name: "first exercise has more sets, return to it",
      data: [3, 3, 2, 3],
      selectedExerciseIndex: 2,
      selectedSetIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        exerciseIndex: 1,
        setIndex: 2,
        addNewSet: false,
        restStartKey: "exercise2RestStart",
        endSuperset: false,
      },
    },
  ])(
    "$name",
    ({
      data,
      selectedExerciseIndex,
      selectedSetIndex,
      supersetExerciseIndexes,
      expected,
    }) => {
      const workout = createWorkout(data);

      const supersets = supersetExerciseIndexes.map((superset) =>
        createSuperset(
          workout.exercises[superset[0]].exercise_id,
          workout.exercises[superset[1]].exercise_id,
        ),
      );
      let newSuperset: Superset[] | null = null;
      if (!expected.endSuperset) {
        const selectedExercise = workout.exercises[selectedExerciseIndex];

        newSuperset = supersets.map((superset) =>
          superset.exercise1Id === selectedExercise.exercise_id ||
          superset.exercise2Id === selectedExercise.exercise_id
            ? editSuperset(superset, {
                [expected.restStartKey]: new Date().toISOString(),
              })
            : superset,
        );
      } else {
        newSuperset = null;
      }
      expect(
        supersetCompleteExercise(
          workout,
          supersets,
          workout.exercises[selectedExerciseIndex],
          workout.exercises[selectedExerciseIndex].sets[selectedSetIndex],
        ),
      ).toStrictEqual({
        newSelectedExercise:
          expected.exerciseIndex !== null
            ? workout.exercises[expected.exerciseIndex]
            : null,
        newSelectedSet:
          expected.exerciseIndex !== null && expected.setIndex !== null
            ? expected.addNewSet
              ? {
                  weight: 80,
                  reps: 0,
                  set_number:
                    workout.exercises[expected.exerciseIndex].sets.length + 1,
                  rest_seconds: 0,
                  done: false,
                }
              : workout.exercises[expected.exerciseIndex].sets[
                  expected.setIndex
                ]
            : null,
        addNewSet: expected.addNewSet,
        endSuperset: expected.endSuperset,
        newSuperset,
      });
    },
  );
});
