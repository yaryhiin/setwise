import type {
  WorkoutExercise,
  WorkoutSet,
  Workout,
  Superset,
} from "../../types/workout";

type SupersetExercise = {
  exerciseId: string;
  restStart: string;
};

export function findLastCompletedSetsInSuperset(
  workout: Workout,
  exercise: WorkoutExercise,
  superset: Superset[],
) {
  let completedSet1: WorkoutSet | null = null;
  let completedSet2: WorkoutSet | null = null;
  let exerciseSuperset1: SupersetExercise | null = null;
  let exerciseSuperset2: SupersetExercise | null = null;

  for (let i of superset) {
    if (
      i.exercise1Id !== exercise.exercise_id &&
      i.exercise2Id !== exercise.exercise_id
    )
      continue;

    const exercise1 = workout.exercises.find(
      (exercise) => exercise.exercise_id === i.exercise1Id,
    );
    const exercise2 = workout.exercises.find(
      (exercise) => exercise.exercise_id === i.exercise2Id,
    );

    if (!exercise1 || !exercise2) continue;
    exerciseSuperset1 = {
      exerciseId: i.exercise1Id,
      restStart: i.exercise1RestStart,
    };
    exerciseSuperset2 = {
      exerciseId: i.exercise2Id,
      restStart: i.exercise2RestStart,
    };

    // Looking for the last completed set in each superset exercise
    for (let j = exercise1.sets.length - 1; j >= 0; j--) {
      if (exercise1.sets[j].done) {
        completedSet1 = exercise1.sets[j];
        break;
      }
    }

    for (let j = exercise2.sets.length - 1; j >= 0; j--) {
      if (exercise2.sets[j].done) {
        completedSet2 = exercise2.sets[j];
        break;
      }
    }
  }
  return { completedSet1, completedSet2, exerciseSuperset1, exerciseSuperset2 };
}

export function findLastCompletedSetInWorkout(
  workout: Workout,
  exercise: WorkoutExercise,
  set: WorkoutSet,
) {
  let completedSet: WorkoutSet | null = null;
  let completedSetFound = false;
  let exerciseId = "";

  const exerciseIndex = exercise.order_index - 1;

  for (let i = exerciseIndex; i >= 0 && !completedSetFound; i--) {
    const currentExercise = workout.exercises[i];

    const startingSetIndex =
      i === exerciseIndex
        ? set.set_number - 2
        : currentExercise.sets.length - 1;

    for (let j = startingSetIndex; j >= 0; j--) {
      const previousSet = currentExercise.sets[j];

      if (previousSet.done) {
        completedSet = previousSet;
        exerciseId = currentExercise.exercise_id;
        completedSetFound = true;
        break;
      }
    }
  }

  return { completedSet, exerciseId };
}
