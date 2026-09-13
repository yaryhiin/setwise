import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  Superset,
} from "../../types/workout";

export function supersetCompleteSet(
  workout: Workout,
  superset: Superset[],
  selectedExercise: WorkoutExercise,
  selectedSet: WorkoutSet,
) {
  let addNewSet = false;
  let newSelectedExercise: WorkoutExercise | null = null;
  let newSelectedSet: WorkoutSet | null = null;
  let newSuperset: Superset[] | null = null;
  for (let i of superset) {
    if (i.exercise1Id === selectedExercise.exercise_id) {
      const nextExercise =
        workout.exercises.find((exercise) =>
          selectedExercise
            ? selectedExercise?.order_index + 1 === exercise.order_index
            : null,
        ) ?? null;
      if (nextExercise && nextExercise.sets?.length < selectedSet.set_number) {
        addNewSet = true;
        newSelectedSet = {
          set_number: selectedSet.set_number,
          weight:
            workout.exercises.find(
              (exercise) => exercise.exercise_id === nextExercise.exercise_id,
            )?.sets[nextExercise.sets.length - 1].weight ?? 0,
          reps: 0,
          rest_seconds: 0,
          done: false,
        };
      } else {
        newSelectedSet = nextExercise?.sets[selectedSet.set_number - 1] ?? null;
      }
      newSelectedExercise = nextExercise;
      newSuperset = superset.map((e) =>
        e.exercise1Id === selectedExercise.exercise_id
          ? {
              ...e,
              exercise1RestStart: new Date().toISOString(),
            }
          : e,
      );
      break;
    }
    if (i.exercise2Id === selectedExercise.exercise_id) {
      const nextExercise =
        workout.exercises.find((exercise) =>
          selectedExercise
            ? selectedExercise?.order_index - 1 === exercise.order_index
            : null,
        ) ?? null;
      if (nextExercise && nextExercise.sets?.length <= selectedSet.set_number) {
        addNewSet = true;
        newSelectedSet = {
          set_number: selectedSet.set_number + 1,
          weight:
            workout.exercises.find(
              (exercise) => exercise.exercise_id === nextExercise.exercise_id,
            )?.sets[nextExercise.sets.length - 1].weight ?? 0,
          reps: 0,
          rest_seconds: 0,
          done: false,
        };
      } else {
        newSelectedSet = nextExercise?.sets[selectedSet.set_number] ?? null;
      }
      newSelectedExercise = nextExercise;
      newSuperset = superset.map((e) =>
        e.exercise2Id === selectedExercise.exercise_id
          ? {
              ...e,
              exercise2RestStart: new Date().toISOString(),
            }
          : e,
      );
      break;
    }
  }
  return {
    newSelectedExercise,
    newSelectedSet,
    addNewSet,
    newSuperset,
  };
}

export function supersetCompleteExercise(
  workout: Workout,
  superset: Superset[],
  selectedExercise: WorkoutExercise,
  selectedSet: WorkoutSet,
) {
  let addNewSet = false;
  let endSuperset = false;
  let newSelectedExercise: WorkoutExercise | null = null;
  let newSelectedSet: WorkoutSet | null = null;
  let newSuperset: Superset[] | null = null;
  const nextExercise =
    workout.exercises.find((exercise) =>
      selectedExercise
        ? selectedExercise?.order_index + 1 === exercise.order_index
        : null,
    ) ?? null;
  const prevExercise =
    workout.exercises.find((exercise) =>
      selectedExercise
        ? selectedExercise?.order_index - 1 === exercise.order_index
        : null,
    ) ?? null;
  for (let i of superset) {
    if (i.exercise1Id === selectedExercise.exercise_id) {
      if (nextExercise && nextExercise.sets?.length < selectedSet.set_number) {
        addNewSet = true;
        newSelectedSet = {
          set_number: selectedSet.set_number,
          weight:
            workout.exercises.find(
              (exercise) => exercise.exercise_id === nextExercise.exercise_id,
            )?.sets[nextExercise.sets.length - 1].weight ?? 0,
          reps: 0,
          rest_seconds: 0,
          done: false,
        };
      } else {
        newSelectedSet = nextExercise?.sets[selectedSet.set_number - 1] ?? null;
      }
      newSelectedExercise = nextExercise;
      newSuperset = superset.map((e) =>
        e.exercise1Id === selectedExercise.exercise_id
          ? {
              ...e,
              exercise1RestStart: new Date().toISOString(),
            }
          : e,
      );
      break;
    } else if (i.exercise2Id === selectedExercise.exercise_id) {
      if (prevExercise && prevExercise.sets.length > selectedSet.set_number) {
        newSelectedExercise = prevExercise;
        newSelectedSet = prevExercise?.sets[selectedSet.set_number] ?? null;
        newSuperset = superset.map((e) =>
          e.exercise2Id === selectedExercise.exercise_id
            ? {
                ...e,
                exercise2RestStart: new Date().toISOString(),
              }
            : e,
        );
        break;
      } else {
        newSelectedExercise = nextExercise;
        newSelectedSet = nextExercise?.sets[0] ?? null;
        endSuperset = true;
      }
    }
  }
  return {
    newSelectedExercise,
    newSelectedSet,
    addNewSet,
    newSuperset,
    endSuperset,
  };
}
