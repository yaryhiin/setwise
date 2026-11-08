import type { ExerciseDB } from "./exercise";

export type RoutineDB = {
  id: string;
  user_id: string;
  name: string;
  exercises_count: number;
  categories: string[];
  created_at: string;
};

export type RoutineExerciseDB = {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  sets: number | null;
  min_reps: number | null;
  max_reps: number | null;
  created_at: string;
};

export type RoutineDetails = RoutineDB & {
  routine_exercises: Array<
    RoutineExerciseDB & {
      exercises: ExerciseDB;
    }
  >;
};

export type SelectedRoutineExercise = {
  exercise_id: string;
  exercise_name: string;
  category: string;
  order_index: number;
  sets: number | null;
  min_reps: number | null;
  max_reps: number | null;
};

export type RoutineDraft = {
  name: string;
  exercises: SelectedRoutineExercise[];
};

export type Targets = {
  sets: number;
  min_reps: number;
  max_reps: number;
};
