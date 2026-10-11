import { convertValueToBaseUnit } from "./utils";

import type { PreferredWeightUnit } from "../types/profile";
import type { WorkoutSet } from "../types/workout";

export function findBestSet(sets: WorkoutSet[]): WorkoutSet {
  return sets.reduce((best, current) => {
    // If weight is 0, we consider it as 1 for volume calculation,
    // to avoid having a volume of 0 for bodyweight exercises
    const formattedBestWeight = best.weight === 0 ? 1 : best.weight;
    const formattedCurrentWeight = current.weight === 0 ? 1 : current.weight;
    const bestVolume = formattedBestWeight * best.reps;
    const currentVolume = formattedCurrentWeight * current.reps;

    return currentVolume > bestVolume ? current : best;
  });
}

export function findBestWeightUsed(sets: WorkoutSet[]): WorkoutSet {
  return sets.reduce((best, current) => {
    const currWeight = current.weight === 0 ? 1 : current.weight;
    const bestWeight = best.weight === 0 ? 1 : best.weight;
    return currWeight > bestWeight ? current : best;
  });
}

export function findImprovedSets(
  prevSets: WorkoutSet[],
  currSets: WorkoutSet[],
): number {
  let setPerformanceScore = 0;
  for (let i = 0; i < Math.min(prevSets.length, currSets.length); i++) {
    let prevSetVolume = prevSets[i].weight * prevSets[i].reps;
    let currSetVolume = currSets[i].weight * currSets[i].reps;

    if (currSetVolume > prevSetVolume) {
      setPerformanceScore++;
    } else if (currSetVolume < prevSetVolume) {
      setPerformanceScore--;
    }
  }

  return setPerformanceScore;
}

export function hasExerciseImproved(
  prevSets: WorkoutSet[],
  currSets: WorkoutSet[],
  unit: PreferredWeightUnit,
): boolean {
  let prevCompletedSets = prevSets
    .filter((set) => set.done)
    .map((prev) => ({ ...prev, weight: prev.weight <= 0 ? 1 : prev.weight }))
    .sort((a: WorkoutSet, b: WorkoutSet) => b.reps - a.reps);
  let currCompletedSets = currSets
    .filter((set) => set.done)
    .map((set) => ({
      ...set,
      weight: set.weight <= 0 ? 1 : convertValueToBaseUnit(set.weight, unit),
    }))
    .sort((a: WorkoutSet, b: WorkoutSet) => b.reps - a.reps);
  if (!prevCompletedSets.length || !currCompletedSets.length) {
    return false;
  }
  const prevBestSet = findBestSet(prevCompletedSets);
  const currBestSet = findBestSet(currCompletedSets);

  if (
    currBestSet.weight * currBestSet.reps >
    prevBestSet.weight * prevBestSet.reps
  ) {
    return true;
  }

  const prevBestWeight = findBestWeightUsed(prevCompletedSets);
  const currBestWeight = findBestWeightUsed(currCompletedSets);

  if (
    currBestWeight.weight > prevBestWeight.weight &&
    Math.ceil(currBestWeight.reps * 1.2) >= prevBestWeight.reps
  ) {
    return true;
  }
  const setPerformanceScore = findImprovedSets(
    prevCompletedSets,
    currCompletedSets,
  );
  if (setPerformanceScore > 0) {
    return true;
  }

  return false;
}
