import type { ChartData } from "../types/chart";
import type { Workout } from "../types/workout";
import type {
  ExerciseCategory,
  ExerciseCategoryGroup,
} from "../types/exercise";
import i18n from "../i18n";
import { supabase } from "../supabase";

export function createEmptyWorkout(): Workout {
  return {
    name: "Custom Workout",
    started_at: Date.now().toString(),
    finished_at: "",
    duration_seconds: 0,
    exercises: [],
  };
}

export const getDefaultExercises = () =>
  [
    // Chest
    {
      name: i18n.t("exercise.barbellBenchPress"),
      category: "chest",
    },
    {
      name: i18n.t("exercise.inclineDumbbellPress"),
      category: "chest",
    },
    {
      name: i18n.t("exercise.machineChestPress"),
      category: "chest",
    },
    {
      name: i18n.t("exercise.cableFly"),
      category: "chest",
    },
    {
      name: i18n.t("exercise.dumbbellFly"),
      category: "chest",
    },

    // Back
    {
      name: i18n.t("exercise.pullUp"),
      category: "back",
    },
    {
      name: i18n.t("exercise.latPulldown"),
      category: "back",
    },
    {
      name: i18n.t("exercise.barbellRow"),
      category: "back",
    },
    {
      name: i18n.t("exercise.seatedCableRow"),
      category: "back",
    },
    {
      name: i18n.t("exercise.chestSupportedRow"),
      category: "back",
    },
    {
      name: i18n.t("exercise.deadlift"),
      category: "back",
    },

    // Quads
    {
      name: i18n.t("exercise.barbellSquat"),
      category: "quads",
    },
    {
      name: i18n.t("exercise.hackSquat"),
      category: "quads",
    },
    {
      name: i18n.t("exercise.legPress"),
      category: "quads",
    },
    {
      name: i18n.t("exercise.bulgarianSplitSquat"),
      category: "quads",
    },
    {
      name: i18n.t("exercise.legExtension"),
      category: "quads",
    },

    // Hamstrings
    {
      name: i18n.t("exercise.legCurl"),
      category: "hamstrings",
    },
    {
      name: i18n.t("exercise.romanianDeadlift"),
      category: "hamstrings",
    },

    // Glutes
    {
      name: i18n.t("exercise.hipThrust"),
      category: "glutes",
    },

    // Calves
    {
      name: i18n.t("exercise.standingCalfRaise"),
      category: "calves",
    },
    {
      name: i18n.t("exercise.seatedCalfRaise"),
      category: "calves",
    },

    // Shoulders
    {
      name: i18n.t("exercise.overheadPress"),
      category: "shoulders",
    },
    {
      name: i18n.t("exercise.dumbbellShoulderPress"),
      category: "shoulders",
    },
    {
      name: i18n.t("exercise.lateralRaise"),
      category: "shoulders",
    },
    {
      name: i18n.t("exercise.rearDeltFly"),
      category: "shoulders",
    },
    {
      name: i18n.t("exercise.facePull"),
      category: "shoulders",
    },

    // Biceps
    {
      name: i18n.t("exercise.barbellCurl"),
      category: "biceps",
    },
    {
      name: i18n.t("exercise.dumbbellCurl"),
      category: "biceps",
    },
    {
      name: i18n.t("exercise.hammerCurl"),
      category: "biceps",
    },

    // Triceps
    {
      name: i18n.t("exercise.tricepsPushdown"),
      category: "triceps",
    },
    {
      name: i18n.t("exercise.overheadTricepsExtension"),
      category: "triceps",
    },
    {
      name: i18n.t("exercise.dips"),
      category: "triceps",
    },
    // Traps
    {
      name: i18n.t("exercise.dumbbellShrug"),
      category: "traps",
    },
    {
      name: i18n.t("exercise.barbellShrug"),
      category: "traps",
    },
    {
      name: i18n.t("exercise.cableShrug"),
      category: "traps",
    },

    // Forearms
    {
      name: i18n.t("exercise.wristCurl"),
      category: "forearms",
    },
    {
      name: i18n.t("exercise.reverseWristCurl"),
      category: "forearms",
    },
    {
      name: i18n.t("exercise.reverseCurl"),
      category: "forearms",
    },

    // Core
    {
      name: i18n.t("exercise.crunch"),
      category: "core",
    },
    {
      name: i18n.t("exercise.cableCrunch"),
      category: "core",
    },
    {
      name: i18n.t("exercise.hangingLegRaise"),
      category: "core",
    },
  ] as const;

export const getDefaultMeasurementTypes = () =>
  [
    {
      name: i18n.t("measurementType.waist"),
    },
    {
      name: i18n.t("measurementType.chest"),
    },
    {
      name: i18n.t("measurementType.hips"),
    },
    {
      name: i18n.t("measurementType.neck"),
    },
    {
      name: i18n.t("measurementType.shoulders"),
    },
    {
      name: i18n.t("measurementType.biceps"),
    },
    {
      name: i18n.t("measurementType.forearm"),
    },
    {
      name: i18n.t("measurementType.thigh"),
    },
    {
      name: i18n.t("measurementType.calf"),
    },
  ] as const;

export const categoryGroups: Record<ExerciseCategoryGroup, ExerciseCategory[]> =
  {
    chest: ["chest"],
    back: ["back", "traps"],
    shoulders: ["shoulders"],
    arms: ["biceps", "triceps", "forearms"],
    legs: ["quads", "hamstrings", "glutes", "calves"],
    core: ["core"],
    other: ["other"],
  };

function getDateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return date.toISOString().split("T")[0];
}

export const exerciseData: ChartData[] = [
  { date: getDateDaysAgo(120), value: 1020 },
  { date: getDateDaysAgo(100), value: 1080 },
  { date: getDateDaysAgo(80), value: 1150 },

  { date: getDateDaysAgo(60), value: 1230 },
  { date: getDateDaysAgo(45), value: 1310 },
  { date: getDateDaysAgo(32), value: 1380 },

  { date: getDateDaysAgo(22), value: 1450 },
  { date: getDateDaysAgo(16), value: 1510 },
  { date: getDateDaysAgo(12), value: 1480 },
  { date: getDateDaysAgo(8), value: 1560 },

  { date: getDateDaysAgo(6), value: 1600 },
  { date: getDateDaysAgo(4), value: 1580 },
  { date: getDateDaysAgo(2), value: 1640 },
  { date: getDateDaysAgo(0), value: 1680 },
];

export async function initializeUser(language: string) {
  await i18n.changeLanguage(language);

  const defaultExercises = getDefaultExercises();
  const defaultMeasurementTypes = getDefaultMeasurementTypes();

  const { error } = await supabase.rpc("initialize_user_defaults", {
    p_default_exercises: defaultExercises,
    p_default_measurement_types: defaultMeasurementTypes,
  });

  if (error) throw error;
}
