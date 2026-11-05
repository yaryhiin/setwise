import { supabase } from "../supabase";
import { getCurrentUserId } from "./auth";
import type { RoutineDetails, SelectedRoutineExercise } from "../types/routine";

export async function getRoutines() {
  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching routines", error);
    return [];
  }

  return data || [];
}

export async function getRoutineDetails(
  routineId: string,
): Promise<RoutineDetails | null> {
  const { data, error } = await supabase
    .from("routines")
    .select(
      `
        *,
        routine_exercises (
          *,
          exercises (*)
        )
      `,
    )
    .eq("id", routineId)
    .single();

  if (error) {
    console.error("Error fetching workout details:", error);
    return null;
  }

  return data;
}

export async function createRoutine({
  p_name,
  exercises,
}: {
  p_name: string;
  exercises: SelectedRoutineExercise[];
}) {
  const { data: createdRoutineId, error: routineError } = await supabase.rpc(
    "create_routine_with_exercises",
    {
      p_name,
      p_exercises: exercises.map((e) => ({
        id: e.exercise_id,
        sets: e.sets,
        min_reps: e.min_reps,
        max_reps: e.max_reps,
      })),
    },
  );

  if (routineError) throw routineError;

  return createdRoutineId;
}

export async function updateRoutine({
  p_routine_id,
  p_name,
  exercises,
}: {
  p_routine_id: string;
  p_name: string;
  exercises: SelectedRoutineExercise[];
}) {
  const { data: createdRoutineId, error: routineError } = await supabase.rpc(
    "update_routine_with_exercises",
    {
      p_routine_id,
      p_name,
      p_exercises: exercises.map((e) => ({
        id: e.exercise_id,
        sets: e.sets,
        min_reps: e.min_reps,
        max_reps: e.max_reps,
      })),
    },
  );

  if (routineError) throw routineError;

  return createdRoutineId;
}

export async function deleteRoutine(routine_id: string) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routine_id)
    .eq("user_id", userId);

  if (error) {
    console.error(`Error deleting routine:`, error.message);
    return false;
  }

  return true;
}
