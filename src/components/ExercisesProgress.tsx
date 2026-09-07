import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ProgressComponents.module.scss";

import Chart from "./Chart";
import { getExercises, getExercisesLogs } from "../services/exercises";
import { formatValueBasedOnUnit } from "../services/utils";

import type { ChartData } from "../types/chart";
import type { ExerciseDB, ExerciseLogDB } from "../types/exercise";
import type { PreferredWeightUnit } from "../types/profile";

type ExercisesProgressProps = {
  unit: PreferredWeightUnit;
  firstDayOfTheWeek: string;
};

const ExercisesProgress = ({
  unit,
  firstDayOfTheWeek,
}: ExercisesProgressProps) => {
  const { t } = useTranslation();

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogDB[]>();
  const [exercises, setExercises] = useState<ExerciseDB[]>();
  const [label, setLabel] = useState("");

  const [filterCriteria, setFilterCriteria] = useState("best-set-volume");
  const [chosenExercise, setChosenExercise] = useState<ExerciseDB>();
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getData() {
      setLoading(true);
      try {
        const list = await getExercises();
        const logs = await getExercisesLogs();
        if (!list || !logs) {
          return;
        }

        const formattedData = logs.flatMap((workout) =>
          workout.workout_exercises.map((exercise) => ({
            date: workout.finished_at ?? workout.created_at,
            exercise_id: exercise.exercise_id,
            exercise_name: exercise.exercise_name,
            sets: exercise.workout_sets,
          })),
        );
        setExercises(list);
        setExerciseLogs(formattedData);
        setChosenExercise(list[0] ?? null);
      } catch (error) {
        console.error("Error fetching exercises data:", error);
      } finally {
        setLoading(false);
      }
    }

    getData();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!chosenExercise) return;
    if (!exerciseLogs) return;
    if (!filterCriteria) return;

    let filtered;

    if (filterCriteria === "best-set-volume") {
      filtered = exerciseLogs
        .filter((entry) => entry.exercise_id === chosenExercise.id)
        .map((entry) => {
          const completedSets = entry.sets.filter((set) => set.done);

          if (completedSets.length === 0) return null;

          const bestSet = completedSets.reduce((best, current) => {
            // If weight is 0, we consider it as 1 for volume calculation,
            // to avoid having a volume of 0 for bodyweight exercises
            const formattedBestWeight = best.weight === 0 ? 1 : best.weight;
            const formattedCurrentWeight = best.weight === 0 ? 1 : best.weight;
            const bestVolume = formattedBestWeight * best.reps;
            const currentVolume = formattedCurrentWeight * current.reps;

            return currentVolume > bestVolume ? current : best;
          });

          const displayedWeight =
            bestSet.weight === 0
              ? 1
              : formatValueBasedOnUnit(bestSet.weight, unit);

          return {
            date: entry.date.split("T")[0],
            value: Math.round(displayedWeight * bestSet.reps * 10) / 10,
          };
        })
        .filter((entry) => entry !== null);
      setLabel(t("label.bestVol"));
    } else if (filterCriteria === "total-volume") {
      filtered = exerciseLogs
        .filter((entry) => entry.exercise_id === chosenExercise.id)
        .map((entry) => {
          const completedSets = entry.sets.filter((set) => set.done);

          if (completedSets.length === 0) return null;

          let totalVolume = 0;

          for (const set of completedSets) {
            if (set.weight === 0) {
              totalVolume += set.reps;
            } else {
              totalVolume += set.weight * set.reps;
            }
          }

          const displayedWeight = formatValueBasedOnUnit(totalVolume, unit);

          return {
            date: entry.date.split("T")[0],
            value: displayedWeight,
          };
        })
        .filter((entry) => entry !== null);
      setLabel(t("label.totalVol"));
    } else if (filterCriteria === "best-weight") {
      filtered = exerciseLogs
        .filter((entry) => entry.exercise_id === chosenExercise.id)
        .map((entry) => {
          const completedSets = entry.sets.filter((set) => set.done);

          if (completedSets.length === 0) return null;

          const best = completedSets.reduce((best, current) => {
            return current.weight > best.weight ? current : best;
          });

          const displayedWeight = formatValueBasedOnUnit(best.weight, unit);

          return {
            date: entry.date.split("T")[0],
            value: displayedWeight,
          };
        })
        .filter((entry) => entry !== null);
      setLabel(t("label.bestWeight"));
    } else if (filterCriteria === "average-rest-time") {
      filtered = exerciseLogs
        .filter((entry) => entry.exercise_id === chosenExercise.id)
        .map((entry) => {
          const completedSets = entry.sets.filter((set) => set.done);

          if (completedSets.length === 0) return null;

          let totalRest = 0;
          let count = 0;
          for (let set of completedSets) {
            if (set.rest_seconds > 5) {
              totalRest += set.rest_seconds;
              count++;
            }
          }

          if (totalRest < 1 || count < 1) return null;

          return {
            date: entry.date.split("T")[0],
            value: Math.round(totalRest / count),
          };
        })
        .filter((entry) => entry !== null);

      setLabel(t("label.avgRest"));
    } else {
      return;
    }
    if (filtered.length === 0) {
      setFilteredData([]);
      return;
    }

    setFilteredData(filtered);
  }, [chosenExercise, exerciseLogs, filterCriteria]);

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("exerciseProgress.title")}</h2>
        <div className={styles.selectGroup}>
          <label>{t("exerciseProgress.description")}</label>
          {exercises && exercises.length > 0 ? (
            <select
              value={chosenExercise?.id}
              onChange={(e) => {
                const selectedType = exercises.find(
                  (type) => type.id === e.target.value,
                );

                setChosenExercise(selectedType);
              }}
            >
              {exercises?.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          ) : (
            <p>{t("exerciseProgress.emptyState")}</p>
          )}
        </div>
        <div className={styles.selectGroup}>
          <label>{t("exerciseProgress.metric")}</label>
          <select
            value={filterCriteria}
            onChange={(e) => {
              setFilterCriteria(e.target.value.trim());
            }}
          >
            <option value="best-set-volume">{t("label.bestVol")}</option>
            <option value="total-volume">{t("label.totalVol")}</option>
            <option value="best-weight">{t("label.bestWeight")}</option>
            <option value="average-rest-time">{t("label.avgRest")}</option>
          </select>
        </div>
      </div>
      <Chart
        chartData={filteredData}
        yPadding={2}
        label={label}
        unit={filterCriteria === "average-rest-time" ? t("units.sec") : unit}
        firstDayOfTheWeek={firstDayOfTheWeek}
      />
    </div>
  );
};

export default ExercisesProgress;
