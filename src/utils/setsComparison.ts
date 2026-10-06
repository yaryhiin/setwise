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
    return current.weight > best.weight ? current : best;
  });
}
