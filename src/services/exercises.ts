import { supabase } from "../supabase";
import { getCurrentUserId } from "./auth";
import type { Exercise } from "../types/exercise";
import { getDefaultExercises } from "./defaults";
import i18n from "../i18n";

export async function getExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching exercises:", error);
    return [];
  }

  return data || [];
}

export async function getExercisesLogs(exerciseId?: string) {
  const userId = await getCurrentUserId();

  let query = supabase
    .from("workouts")
    .select(
      `
      id,
      name,
      created_at,
      finished_at,
      started_at,
      workout_exercises!inner (
        id,
        notes,
        exercise_id,
        exercise_name,
        category,
        workout_sets (
          id,
          set_number,
          weight,
          reps,
          done,
          rest_seconds
        )
      )
    `,
    )
    .eq("user_id", userId);

  if (exerciseId) {
    query = query.eq("workout_exercises.exercise_id", exerciseId);
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: true });
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function createExercise(exercise: Exercise) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("exercises")
    .insert({ ...exercise, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error("Error creating exercise:", error);
    return null;
  }

  return data;
}

export async function updateExercise(
  name: string,
  category: string,
  id: string,
) {
  const { data, error: ExerciseError } = await supabase
    .from("exercises")
    .update({
      name,
      category,
    })
    .eq("id", id)
    .select()
    .single();

  if (ExerciseError) throw ExerciseError;

  return data;
}

export async function deleteExercise(exercise_id: string) {
  const userId = await getCurrentUserId();

  const { data, error: routinesError } = await supabase
    .from("routines")
    .select(
      `
    id,
    exercises_count,
    name,
    routine_exercises!inner()
  `,
    )
    .eq("routine_exercises.exercise_id", exercise_id);

  if (routinesError) throw routinesError;

  const updates = data.map((routine) =>
    supabase
      .from("routines")
      .update({
        exercises_count: routine.exercises_count - 1,
      })
      .eq("id", routine.id)
      .eq("user_id", userId),
  );

  const results = await Promise.all(updates);

  const failedUpdate = results.find(({ error }) => error);

  if (failedUpdate?.error) throw failedUpdate?.error;

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exercise_id)
    .eq("user_id", userId);

  if (error) {
    console.error(`Error deleting exercise:`, error.message);
    return false;
  }

  return true;
}

export async function createDefaultExercises(selectedLangauge: string) {
  const exercises = await getExercises();

  if (exercises.length > 0) {
    return;
  }

  const userId = await getCurrentUserId();

  await i18n.changeLanguage(selectedLangauge);

  const DEFAULT_EXERCISES = getDefaultExercises();

  const updatedList = DEFAULT_EXERCISES.map((exercise) => ({
    ...exercise,
    user_id: userId,
  }));

  const { error } = await supabase
    .from("exercises")
    .insert(updatedList)
    .select();

  if (error) {
    throw error;
  }
}
