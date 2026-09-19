import { supabase } from "../supabase";
import { getCurrentUserId } from "./auth";
import type {
  Workout,
  WorkoutExerciseDB,
  WorkoutSetDB,
} from "../types/workout";
import type { PreviousExerciseRow } from "../types/workout";
import { createLocalId } from "../utils/utils";

export async function getWorkoutsHistory() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching data:", error);
    return [];
  }

  return data || [];
}

export async function getWorkoutDetails(workoutId: string) {
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      *,
      workout_exercises (
        *,
        workout_sets (*)
      )
    `,
    )
    .eq("id", workoutId)
    .single();

  if (error) {
    console.error("Error fetching workout details:", error);
    return null;
  }

  return data;
}

export async function createWorkout(workout: Workout) {
  const userId = await getCurrentUserId();

  const formattedWorkout = {
    id: createLocalId(),
    user_id: userId,
    name: workout.name,
    duration_seconds: workout.duration_seconds,
    started_at: workout.started_at ?? new Date().toISOString(),
    finished_at: workout.finished_at ?? new Date().toISOString(),
  };

  let formattedExercises: WorkoutExerciseDB[] = [];
  let formattedSets: WorkoutSetDB[] = [];
  for (const exercise of workout.exercises) {
    const newExerciseId = createLocalId();
    formattedExercises.push({
      id: newExerciseId,
      workout_id: formattedWorkout.id,
      exercise_name: exercise.exercise_name,
      exercise_id: exercise.exercise_id,
      category: exercise.category,
      order_index: exercise.order_index,
      notes: exercise.notes,
      created_at: new Date().toISOString(),
    });
    for (const set of exercise.sets) {
      formattedSets.push({
        id: createLocalId(),
        workout_exercise_id: newExerciseId,
        set_number: set.set_number,
        weight: set.weight,
        reps: set.reps,
        done: set.done,
        rest_seconds: set.rest_seconds,
        created_at: new Date().toISOString(),
      });
    }
  }

  const { data: createdWorkout, error: workoutError } = await supabase
    .from("workouts")
    .insert(formattedWorkout)
    .select()
    .single();

  if (workoutError) {
    throw workoutError;
  }

  const { error: exercisesError } = await supabase
    .from("workout_exercises")
    .insert(formattedExercises);

  if (exercisesError) {
    await deleteWorkout(createdWorkout.id);
    throw exercisesError;
  }

  const { error: setsError } = await supabase
    .from("workout_sets")
    .insert(formattedSets);

  if (setsError) {
    await deleteWorkout(createdWorkout.id);
    throw setsError;
  }

  return createdWorkout;
}

export async function updateWorkout(workout: Workout, workoutId: string) {
  const userId = await getCurrentUserId();

  const formattedWorkout = { name: workout.name };

  let formattedExercises: WorkoutExerciseDB[] = [];
  let formattedSets: WorkoutSetDB[] = [];
  for (const exercise of workout.exercises) {
    const newExerciseId = createLocalId();
    formattedExercises.push({
      id: newExerciseId,
      workout_id: workoutId,
      exercise_name: exercise.exercise_name,
      exercise_id: exercise.exercise_id,
      category: exercise.category,
      order_index: exercise.order_index,
      notes: exercise.notes,
      created_at: new Date().toISOString(),
    });
    for (const set of exercise.sets) {
      formattedSets.push({
        id: createLocalId(),
        workout_exercise_id: newExerciseId,
        set_number: set.set_number,
        weight: set.weight,
        reps: set.reps,
        done: set.done,
        rest_seconds: set.rest_seconds,
        created_at: new Date().toISOString(),
      });
    }
  }

  const { data: updatedWorkout, error: workoutError } = await supabase
    .from("workouts")
    .update(formattedWorkout)
    .eq("id", workoutId)
    .eq("user_id", userId)
    .select()
    .single();

  if (workoutError) {
    throw workoutError;
  }

  const { error: deleteError } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("workout_id", workoutId);

  if (deleteError) throw deleteError;

  const { error: exercisesError } = await supabase
    .from("workout_exercises")
    .insert(formattedExercises);

  if (exercisesError) {
    throw exercisesError;
  }

  const { error: setsError } = await supabase
    .from("workout_sets")
    .insert(formattedSets);

  if (setsError) {
    throw setsError;
  }

  return updatedWorkout;
}

export async function deleteWorkout(workoutId: string) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", userId);

  if (error) {
    console.error(`Error deleting data from workouts:`, error.message);
    return false;
  }

  return true;
}

export async function getPreviousExerciseData(exerciseIds: string[]) {
  if (exerciseIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
        id,
        exercise_id,
        exercise_name,
        workout_id,
        order_index,
        notes,
        workout_sets (
          id,
          set_number,
          weight,
          reps,
          rest_seconds,
          done
        ),
        workouts (
          id,
          name,
          finished_at,
          created_at
        )
      `,
    )
    .in("exercise_id", exerciseIds);

  if (error) {
    console.error("Error fetching previous exercise data:", error);
    return {};
  }

  // Supabase currently infers `workouts` as an array here,
  // but the actual runtime result is one workout object per row.
  const rows = (data ?? []) as unknown as PreviousExerciseRow[];

  const sortedData = [...rows].sort((a, b) => {
    const dateA = new Date(
      a.workouts?.finished_at ?? a.workouts?.created_at ?? 0,
    ).getTime();

    const dateB = new Date(
      b.workouts?.finished_at ?? b.workouts?.created_at ?? 0,
    ).getTime();

    return dateB - dateA;
  });

  const previousByExerciseId: Record<string, PreviousExerciseRow> = {};

  for (const item of sortedData) {
    if (!previousByExerciseId[item.exercise_id]) {
      previousByExerciseId[item.exercise_id] = item;
    }
  }

  return previousByExerciseId;
}
