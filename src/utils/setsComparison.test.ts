import { describe, it, expect } from "vitest";

import type { WorkoutSet } from "../types/workout";
import {
  findBestSet,
  findBestWeightUsed,
  findImprovedSets,
  hasExerciseImproved,
} from "./setsComparison";

type TestCase<T> = {
  name: string;
  prev: [number, number][];
  curr: [number, number][];
  expected: T;
};

type TestCaseBestSet = {
  name: string;
  sets: [number, number][];
  expectedIndex: number;
};

function createSet(
  weight: number,
  reps: number,
  overrides: Partial<WorkoutSet> = {},
): WorkoutSet {
  return {
    weight,
    reps,
    set_number: 1,
    rest_seconds: 90,
    done: true,
    ...overrides,
  };
}

function createSets(data: [number, number][]): WorkoutSet[] {
  return data.map(([weight, reps], index) =>
    createSet(weight, reps, { set_number: index + 1 }),
  );
}

describe("hasExerciseImproved", () => {
  it.each<TestCase<boolean>>([
    { name: "more reps", prev: [[80, 10]], curr: [[80, 12]], expected: true },
    {
      name: "Higher weight with reasonable rep range",
      prev: [[80, 12]],
      curr: [[90, 10]],
      expected: true,
    },
    {
      name: "Higher weight with too low reps",
      prev: [[80, 12]],
      curr: [[90, 5]],
      expected: false,
    },
    {
      name: "Empty previous data",
      prev: [],
      curr: [[80, 12]],
      expected: false,
    },
    {
      name: "Best set unchanged, but more sets improve than decline",
      prev: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 10],
        [80, 10],
        [80, 11],
      ],
      expected: true,
    },
    {
      name: "More reps on one set, but same volume",
      prev: [
        [80, 11],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 10],
        [80, 11],
        [80, 10],
      ],
      expected: false,
    },
    {
      name: "Top set volume increase",
      prev: [
        [80, 11],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 12],
        [80, 10],
        [80, 10],
      ],
      expected: true,
    },
    {
      name: "Identical performance",
      prev: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      expected: false,
    },
    {
      name: "Overall volume decrease",
      prev: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 10],
        [80, 10],
        [80, 9],
      ],
      expected: false,
    },
    {
      name: "Bodyweight exercise improvement",
      prev: [[0, 10]],
      curr: [[0, 11]],
      expected: true,
    },
  ])("$name", ({ prev, curr, expected }) => {
    expect(hasExerciseImproved(createSets(prev), createSets(curr), "kg")).toBe(
      expected,
    );
  });
});

describe("findImprovedSets", () => {
  it.each<TestCase<number>>([
    {
      name: "Identical sets",
      prev: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 10], // 0
        [80, 10], // 0
        [80, 10], // 0
      ],
      expected: 0,
    },
    {
      name: "Overall performance declines",
      prev: [
        [80, 12],
        [80, 11],
        [80, 10],
      ],
      curr: [
        [80, 11], // -1
        [80, 10], // -2
        [80, 9], // -3
      ],
      expected: -3,
    },
    {
      name: "Equal number of improved and declined sets",
      prev: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 11], //1
        [80, 10], // 1
        [80, 9], // 0
      ],
      expected: 0,
    },
    {
      name: "More improved sets",
      prev: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 11], // 1
        [80, 9], // 0
        [80, 11], // 1
      ],
      expected: 1,
    },
    {
      name: "Unequal amount of sets",
      prev: [
        [80, 10],
        [80, 10],
        [80, 10],
      ],
      curr: [
        [80, 11], // 1
        [80, 9], // 0
        [80, 11], // 1
        [80, 12], // 1
      ],
      expected: 1,
    },
  ])("$name", ({ prev, curr, expected }) => {
    expect(findImprovedSets(createSets(prev), createSets(curr))).toBe(expected);
  });
});

describe("findBestset", () => {
  it.each<TestCaseBestSet>([
    {
      name: "finds best set",
      sets: [
        [80, 10], // 800
        [90, 12], // 1080
        [100, 9], // 900
      ],
      expectedIndex: 1,
    },
    {
      name: "handles bodyweight",
      sets: [
        [0, 10], // 10
        [0, 11], // 11
        [0, 12], // 12
      ],
      expectedIndex: 2,
    },
    {
      name: "finds first best set amongst multiple best ones",
      sets: [
        [80, 12], // 960
        [80, 12], // 960
        [80, 10], // 800
      ],
      expectedIndex: 0,
    },
  ])("$name", ({ sets, expectedIndex }) => {
    const workoutSets = createSets(sets);
    expect(findBestSet(workoutSets)).toBe(workoutSets[expectedIndex]);
  });
});

describe("findBestWeightUsed", () => {
  it("finds the highest weight", () => {
    const sets = createSets([
      [80, 10],
      [85, 10],
      [80, 10],
    ]);

    expect(findBestWeightUsed(sets)).toBe(sets[1]);
  });

  it("prioritizes weight over reps", () => {
    const sets = createSets([
      [80, 15],
      [100, 3],
      [90, 10],
    ]);

    expect(findBestWeightUsed(sets)).toBe(sets[1]);
  });
});
