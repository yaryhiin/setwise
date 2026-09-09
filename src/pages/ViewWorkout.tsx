import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ActiveWorkout.module.scss";

import type { Workout } from "../types/workout";
import type { PreferredWeightUnit } from "../types/profile";

import WorkoutForm from "../components/WorkoutForm";
import LoadingScreen from "../components/LoadingScreen";

import { getWorkoutDetails } from "../services/workouts";
import { formatTime, formatValueBasedOnUnit } from "../services/utils";
import { getPersistedJSON, getInitialPreferredUnit } from "../services/storage";
import { getProfile } from "../services/profiles";
import { createEmptyWorkout } from "../services/defaults";

const VIEW_WORKOUT_KEY = "viewWorkout";
const PREFERRED_UNIT_KEY = "preferredUnit";

const ViewWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [workout, setWorkout] = useState<Workout>(
    getPersistedJSON(VIEW_WORKOUT_KEY, createEmptyWorkout),
  );
  const [preferredUnit, setPreferredUnit] = useState<PreferredWeightUnit>(
    getInitialPreferredUnit,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedWorkout = localStorage.getItem(VIEW_WORKOUT_KEY);
    if (savedWorkout) {
      return;
    }
    async function loadData() {
      setLoading(true);
      try {
        const workoutDetails = await getWorkoutDetails(String(workoutId));
        if (!workoutDetails) {
          console.error("Workout details not found");
          return;
        }
        const preferredUnitData = await getProfile();
        if (preferredUnitData) {
          setPreferredUnit(preferredUnitData.preferred_workout_unit);
        }
        setWorkout({
          name: workoutDetails.name,
          started_at: workoutDetails.started_at,
          finished_at: workoutDetails.finished_at,
          duration_seconds: workoutDetails.duration_seconds,
          exercises: [...workoutDetails.workout_exercises]
            .sort((a, b) => a.order_index - b.order_index)
            .map((item) => ({
              id: item.id,
              exercise_id: item.exercise_id,
              exercise_name: item.exercise_name,
              category: item.exercise_category,
              order_index: item.order_index,
              notes: item.notes,
              sets: [...item.workout_sets]
                .sort((a, b) => a.set_number - b.set_number)
                .map((item) => ({
                  set_number: item.set_number,
                  weight: formatValueBasedOnUnit(
                    Number(item.weight),
                    preferredUnitData?.preferred_workout_unit ?? "kg",
                  ),
                  reps: item.reps,
                  rest_seconds: item.rest_seconds,
                  done: item.done,
                })),
            })),
        });
      } catch (error) {
        console.error("Error loading data: ", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (workout)
      localStorage.setItem(VIEW_WORKOUT_KEY, JSON.stringify(workout));
  }, [workout]);

  useEffect(() => {
    if (preferredUnit) localStorage.setItem(PREFERRED_UNIT_KEY, preferredUnit);
  }, [preferredUnit]);

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.workoutContainer}>
      <div className={styles.viewHeader}>
        <button
          className={styles.editBtn}
          onClick={() => navigate(`/history/${workoutId}/edit`)}
        >
          {t("common.edit")}
        </button>
        <div>
          <h3 className={styles.title}>{workout?.name}</h3>
          <p className={styles.stopwatch}>
            {formatTime(workout?.duration_seconds, "workout")}
          </p>
        </div>
      </div>
      <WorkoutForm
        workout={workout}
        pageType="view"
        preferredUnit={preferredUnit}
      />
    </div>
  );
};

export default ViewWorkout;
