import { describe, it, expect } from "vitest";

import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  //   Superset,
} from "../../types/workout";

import {
  findLastCompletedSetInWorkout,
  findLastCompletedSetsInSuperset,
  //   findLastCompletedSetsInSuperset,
} from "./findLastCompletedSet";
import { createLocalId } from "../utils";

type TestCase = {
  name: string;
  data: boolean[][];
  selectedExerciseIndex: number;
  selectedSetIndex: number;
  expected: { setIndex: number; exerciseIndex: number } | null;
};

type SupersetTestCase = {
  name: string;
  data: boolean[][];
  selectedExerciseIndex: number;
  supersetExerciseIndexes: [number, number][];
  expected: {
    set1Index: number;
    set2Index: number;
    exercise1Index: number;
    exercise2Index: number;
  };
};

function createSet(
  done: boolean,
  overrides: Partial<WorkoutSet> = {},
): WorkoutSet {
  return {
    weight: 80,
    reps: 10,
    set_number: 1,
    rest_seconds: 90,
    done,
    ...overrides,
  };
}

function createExercise(
  data: boolean[],
  overrides: Partial<WorkoutExercise>,
): WorkoutExercise {
  return {
    id: createLocalId(),
    exercise_name: "",
    exercise_id: createLocalId(),
    category: "",
    order_index: 1,
    notes: "",
    sets: data.map((done, index) => createSet(done, { set_number: index + 1 })),
    ...overrides,
  };
}

function createWorkout(data: boolean[][]): Workout {
  return {
    name: "Custom Workout",
    started_at: "",
    finished_at: "",
    duration_seconds: 1000,
    exercises: data.map((entry, index) =>
      createExercise(entry, { order_index: index + 1 }),
    ),
  };
}

function createSuperset(exercise1Id: string, exercise2Id: string) {
  return {
    exercise0Id: "",
    exercise1Id,
    exercise2Id,
    exercise1RestStart: "2026-01-01T10:00:00.000Z",
    exercise2RestStart: "2026-01-01T10:01:00.000Z",
  };
}

describe("findLastCompletedSetInWorkout", () => {
  it.each<TestCase>([
    {
      name: "Find last completed set in workout",
      data: [
        [true, true, false],
        [false, false, false],
      ],
      selectedExerciseIndex: 1,
      selectedSetIndex: 1,
      expected: { setIndex: 1, exerciseIndex: 0 },
    },
    {
      name: "selected set is in the middle of workout",
      data: [
        [true, true, false],
        [false, true, true],
      ],
      selectedExerciseIndex: 1,
      selectedSetIndex: 1,
      expected: { setIndex: 1, exerciseIndex: 0 },
    },
    {
      name: "completed set is only after selected",
      data: [
        [false, false, false],
        [false, true, false],
      ],
      selectedExerciseIndex: 0,
      selectedSetIndex: 1,
      expected: null,
    },
    {
      name: "selected set is in the middle of completed sets",
      data: [
        [true, true, true],
        [true, true, false],
      ],
      selectedExerciseIndex: 1,
      selectedSetIndex: 1,
      expected: { setIndex: 0, exerciseIndex: 1 },
    },
    {
      name: "no completed sets",
      data: [
        [false, false, false],
        [false, false, false],
      ],
      selectedExerciseIndex: 1,
      selectedSetIndex: 1,
      expected: null,
    },
    {
      name: "only selected set is completed",
      data: [
        [false, true, false],
        [false, false, false],
      ],
      selectedExerciseIndex: 0,
      selectedSetIndex: 1,
      expected: null,
    },
  ])("$name", ({ data, selectedExerciseIndex, selectedSetIndex, expected }) => {
    const workout = createWorkout(data);
    expect(
      findLastCompletedSetInWorkout(
        workout,
        workout.exercises[selectedExerciseIndex],
        workout.exercises[selectedExerciseIndex].sets[selectedSetIndex],
      ),
    ).toStrictEqual({
      completedSet: expected
        ? workout.exercises[expected.exerciseIndex].sets[expected.setIndex]
        : null,
      exerciseId: expected
        ? workout.exercises[expected.exerciseIndex].exercise_id
        : "",
    });
  });
});

describe("findLastCompletedSetInSuperset", () => {
  it.each<SupersetTestCase>([
    {
      name: "Finds completed sets in superset",
      data: [
        [true, true, true],
        [true, false, false],
        [true, false, false],
      ],
      selectedExerciseIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        set1Index: 0,
        set2Index: 0,
        exercise1Index: 1,
        exercise2Index: 2,
      },
    },
    {
      name: "missmatch in completed sets",
      data: [
        [true, true, true],
        [true, true, true],
        [true, false, false],
      ],
      selectedExerciseIndex: 1,
      supersetExerciseIndexes: [[1, 2]],
      expected: {
        set1Index: 2,
        set2Index: 0,
        exercise1Index: 1,
        exercise2Index: 2,
      },
    },
    {
      name: "multiple supersets, selectedExercise is in second one",
      data: [
        [true, true, false],
        [true, true, false],
        [true, true, true],
        [true, false, false],
        [true, false, false],
      ],
      selectedExerciseIndex: 4,
      supersetExerciseIndexes: [
        [0, 1],
        [3, 4],
      ],
      expected: {
        set1Index: 0,
        set2Index: 0,
        exercise1Index: 3,
        exercise2Index: 4,
      },
    },
  ])(
    "$name",
    ({ data, selectedExerciseIndex, supersetExerciseIndexes, expected }) => {
      const workout = createWorkout(data);
      const supersets = supersetExerciseIndexes.map((superset) =>
        createSuperset(
          workout.exercises[superset[0]].exercise_id,
          workout.exercises[superset[1]].exercise_id,
        ),
      );
      const expectedExercise1 = workout.exercises[expected.exercise1Index];
      const expectedExercise2 = workout.exercises[expected.exercise2Index];

      const expectedSuperset = supersets.find(
        (superset) =>
          superset.exercise1Id === expectedExercise1.exercise_id ||
          superset.exercise2Id === expectedExercise1.exercise_id,
      );
      expect(
        findLastCompletedSetsInSuperset(
          workout,
          workout.exercises[selectedExerciseIndex],
          supersets,
        ),
      ).toStrictEqual({
        completedSet1: expectedExercise1.sets[expected.set1Index],
        completedSet2: expectedExercise2.sets[expected.set2Index],
        exerciseSuperset1: {
          exerciseId: expectedSuperset?.exercise1Id,
          restStart: expectedSuperset?.exercise1RestStart,
        },
        exerciseSuperset2: {
          exerciseId: expectedSuperset?.exercise2Id,
          restStart: expectedSuperset?.exercise2RestStart,
        },
      });
    },
  );
});
