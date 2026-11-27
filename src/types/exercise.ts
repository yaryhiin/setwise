export type ExerciseDB = {
  id: string;
  user_id: string;
  name: string;
  category: ExerciseCategory;
  created_at: string;
};

export type Exercise = {
  name: string;
  category: ExerciseCategory;
};

export type ExerciseLogDB = {
  date: string;
  exercise_id: string;
  exercise_name: string;
  sets: {
    id: string;
    set_number: number;
    weight: number;
    reps: number;
    rest_seconds: number;
    done: boolean;
  }[];
};

export type ExerciseHistory = {
  id: string;
  name: string;
  created_at: string;
  finished_at: string | null;
  started_at: string;
  workout_exercises: {
    id: string;
    notes: string;
    exercise_id: string;
    exercise_name: string;
    category: string;
    workout_sets: {
      id: string;
      set_number: number;
      weight: number;
      reps: number;
      done: boolean;
      rest_seconds: number;
    }[];
  }[];
};

export type ExerciseCategory =
  | "chest"
  | "back"
  | "traps"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "other";

export type ExerciseCategoryGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "core"
  | "other";

export type ExerciseCriteria = "best-set-volume" | "total-volume";
