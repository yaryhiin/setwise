import type { ChartData } from "../types/chart";
import type { Workout } from "../types/workout";
import i18n from "../i18n";

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
      category: "Chest",
    },
    {
      name: i18n.t("exercise.inclineDumbbellPress"),
      category: "Chest",
    },
    {
      name: i18n.t("exercise.machineChestPress"),
      category: "Chest",
    },
    {
      name: i18n.t("exercise.cableFly"),
      category: "Chest",
    },
    {
      name: i18n.t("exercise.dumbbellFly"),
      category: "Chest",
    },

    // Back
    {
      name: i18n.t("exercise.pullUp"),
      category: "Back",
    },
    {
      name: i18n.t("exercise.latPulldown"),
      category: "Back",
    },
    {
      name: i18n.t("exercise.barbellRow"),
      category: "Back",
    },
    {
      name: i18n.t("exercise.seatedCableRow"),
      category: "Back",
    },
    {
      name: i18n.t("exercise.chestSupportedRow"),
      category: "Back",
    },
    {
      name: i18n.t("exercise.deadlift"),
      category: "Back",
    },

    // Legs
    {
      name: i18n.t("exercise.barbellSquat"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.hackSquat"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.legPress"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.bulgarianSplitSquat"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.legExtension"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.legCurl"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.romanianDeadlift"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.hipThrust"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.standingCalfRaise"),
      category: "Legs",
    },
    {
      name: i18n.t("exercise.seatedCalfRaise"),
      category: "Legs",
    },

    // Shoulders
    {
      name: i18n.t("exercise.overheadPress"),
      category: "Shoulders",
    },
    {
      name: i18n.t("exercise.dumbbellShoulderPress"),
      category: "Shoulders",
    },
    {
      name: i18n.t("exercise.lateralRaise"),
      category: "Shoulders",
    },
    {
      name: i18n.t("exercise.rearDeltFly"),
      category: "Shoulders",
    },
    {
      name: i18n.t("exercise.facePull"),
      category: "Shoulders",
    },

    // Arms
    {
      name: i18n.t("exercise.barbellCurl"),
      category: "Arms",
    },
    {
      name: i18n.t("exercise.dumbbellCurl"),
      category: "Arms",
    },
    {
      name: i18n.t("exercise.hammerCurl"),
      category: "Arms",
    },
    {
      name: i18n.t("exercise.tricepsPushdown"),
      category: "Arms",
    },
    {
      name: i18n.t("exercise.overheadTricepsExtension"),
      category: "Arms",
    },
    {
      name: i18n.t("exercise.dips"),
      category: "Arms",
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
