import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/CompletedWorkoutModal.module.scss";

import type { PreferredWeightUnit } from "../types/profile";
import type { PreviousExerciseRow, Workout } from "../types/workout";
import {
  calculatePassedSeconds,
  formatDuration,
  convertValueToBaseUnit,
} from "../utils/utils";
import { findBestSet, findBestWeightUsed } from "../utils/setsComparison";

type ActionState =
  | { phase: "idle" }
  | { phase: "loading"; type: string }
  | { phase: "success" }
  | { phase: "error" };

type CompletedWorkoutModalProps = {
  state: ActionState;
  workout: Workout;
  previousData: Record<string, PreviousExerciseRow>;
  unit: PreferredWeightUnit;
  onDone: () => void;
};

const CompletedWorkoutModal = ({
  state,
  workout,
  previousData,
  unit,
  onDone,
}: CompletedWorkoutModalProps) => {
  const { t } = useTranslation();

  const passedSeconds = calculatePassedSeconds(workout.started_at);
  const message =
    state.phase === "loading"
      ? t("completedWorkoutModal.save")
      : state.phase === "success" || state.phase === "idle"
        ? t("completedWorkoutModal.success")
        : state.phase === "error"
          ? t("completedWorkoutModal.error")
          : "";

  const [totalVolume, setTotalVolume] = useState(0);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [improvement, setImprovement] = useState(
    t("completedWorkoutModal.improvement.generic"),
  );

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.65 },
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    calculateStats();
    calculateImprovement();
  }, [workout]);

  function calculateImprovement() {
    let exercisesImproved = 0;
    for (let exercise of workout.exercises) {
      const previousExercise = previousData[exercise.exercise_id];
      if (!previousExercise) continue;
      let prevCompletedSets = previousExercise.workout_sets.filter(
        (set) => set.done,
      );
      let currCompletedSets = exercise.sets
        .filter((set) => set.done)
        .map((set) => ({
          ...set,
          weight: convertValueToBaseUnit(set.weight, unit),
        }));
      if (!prevCompletedSets.length || !currCompletedSets.length) {
        continue;
      }
      const prevBestSet = findBestSet(prevCompletedSets);
      const currBestSet = findBestSet(currCompletedSets);

      if (
        currBestSet.weight * currBestSet.reps >
        prevBestSet.weight * prevBestSet.reps
      ) {
        exercisesImproved++;
        continue;
      }

      const prevBestWeight = findBestWeightUsed(prevCompletedSets);
      const currBestWeight = findBestWeightUsed(currCompletedSets);

      if (
        currBestWeight.weight > prevBestWeight.weight &&
        Math.ceil(currBestWeight.reps * 1.2) >= prevBestWeight.reps
      ) {
        exercisesImproved++;
        continue;
      }
      let setPerformanceScore = 0;
      for (
        let i = 0;
        i < Math.min(prevCompletedSets.length, currCompletedSets.length);
        i++
      ) {
        let prevSetVolume =
          prevCompletedSets[i].weight * prevCompletedSets[i].reps;
        let currSetVolume =
          currCompletedSets[i].weight * currCompletedSets[i].reps;

        if (currSetVolume > prevSetVolume) {
          setPerformanceScore++;
        } else if (currSetVolume < prevSetVolume) {
          setPerformanceScore--;
        }
      }
      if (setPerformanceScore > 0) {
        exercisesImproved++;
        continue;
      }
    }

    // if (exercisesImproved > 0) {
    setImprovement(
      t("completedWorkoutModal.improvement.exercises", {
        count: exercisesImproved,
      }),
    );
    // }
  }

  function calculateStats() {
    let volume = 0;
    let setCount = 0;
    let doneSetCount = 0;
    let reps = 0;
    for (let exercise of workout.exercises) {
      const notEmptySets = exercise.sets.filter((set) => set.done);
      setCount += exercise.sets.length;
      if (notEmptySets.length === 0) continue;
      volume += notEmptySets.reduce(
        (total, set) => total + set.weight * set.reps,
        0,
      );
      reps += notEmptySets.reduce((total, set) => total + set.reps, 0);
      doneSetCount += notEmptySets.length;
    }
    setTotalVolume(volume);
    setSetsCompleted(doneSetCount);
    setTotalSets(setCount);
    setTotalReps(reps);
  }

  return (
    <div className="modal">
      <div className="modalContent">
        <h2 className={styles.title}>{t("completedWorkoutModal.title")}</h2>
        <h3 className={styles.workoutName}>{workout.name}</h3>
        <div className={styles.statsContainer}>
          <div className={styles.stat}>
            <h4 className={styles.statTitle}>
              {t("completedWorkoutModal.duration")}
            </h4>
            <p className={styles.statData}>{formatDuration(passedSeconds)}</p>
          </div>
          <div className={styles.stat}>
            <h4 className={styles.statTitle}>
              {t("completedWorkoutModal.volumeLifted")}
            </h4>
            <p className={styles.statData}>
              {totalVolume.toFixed(2)} {unit}
            </p>
          </div>
          <div className={styles.stat}>
            <h4 className={styles.statTitle}>
              {t("completedWorkoutModal.setsCompleted")}
            </h4>
            <p className={styles.statData}>
              {setsCompleted} / {totalSets}{" "}
              {totalSets === setsCompleted && "✅"}
            </p>
          </div>
          <div className={styles.stat}>
            <h4 className={styles.statTitle}>
              {t("completedWorkoutModal.totalReps")}
            </h4>
            <p className={styles.statData}>{totalReps}</p>
          </div>
        </div>
        <div className={styles.stat}>
          <p className={styles.improvMessage}>{improvement}</p>
        </div>
        <p className={styles.infoMessage}>{message}</p>
        <button
          className={styles.closeBtn}
          disabled={state.phase === "loading"}
          onClick={onDone}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default CompletedWorkoutModal;
