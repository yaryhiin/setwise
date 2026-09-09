import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ActiveWorkout.module.scss";

import type { ExerciseDB } from "../types/exercise";
import type { Workout } from "../types/workout";
import type { PreferredWeightUnit } from "../types/profile";

import ExecuteModal from "../components/ExecuteModal";
import WorkoutForm from "../components/WorkoutForm";
import LoadingScreen from "../components/LoadingScreen";
import InfoModal from "../components/InfoModal";

import { createExercise, getExercises } from "../services/exercises";
import {
  getWorkoutDetails,
  deleteWorkout,
  updateWorkout,
} from "../services/workouts";
import {
  convertValueToBaseUnit,
  formatTime,
  formatValueBasedOnUnit,
} from "../services/utils";
import { getProfile } from "../services/profiles";
import { getPersistedJSON, getInitialPreferredUnit } from "../services/storage";
import { createEmptyWorkout } from "../services/defaults";

import { useAsyncAction } from "../hooks/useAsyncAction";

const CHANGE_WORKOUT_KEY = "changeWorkout";
const WORKOUT_SELECTED_EXERCISE_KEY = "workoutSelectedExercise";
const WORKOUT_SELECTED_SET_KEY = "workoutSelectedSet";
const WORKOUT_REST_START_KEY = "workoutRestStart";
const EXERCISES_KEY = "exercises";
const PREFERRED_UNIT_KEY = "preferredUnit";

const ChangeWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { run, state } = useAsyncAction();

  const [workout, setWorkout] = useState<Workout>(
    getPersistedJSON(CHANGE_WORKOUT_KEY, createEmptyWorkout),
  );
  const [exercises, setExercises] = useState<ExerciseDB[] | null>(
    getPersistedJSON(EXERCISES_KEY, null),
  );
  const [preferredUnit, setPreferredUnit] = useState<PreferredWeightUnit>(
    getInitialPreferredUnit,
  );

  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedWorkout = localStorage.getItem(CHANGE_WORKOUT_KEY);
    if (savedWorkout) {
      return;
    }
    async function loadData() {
      setLoading(true);
      try {
        const preferredUnitData = await getProfile();
        if (preferredUnitData) {
          setPreferredUnit(preferredUnitData.preferred_workout_unit);
        }
        const workoutDetails = await getWorkoutDetails(String(workoutId));
        if (!workoutDetails) {
          console.error("Workout details not found");
          return;
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
    const savedExercises = localStorage.getItem(EXERCISES_KEY);
    if (savedExercises) {
      const parsedExercises = JSON.parse(savedExercises) as ExerciseDB[];
      if (parsedExercises && parsedExercises.length > 0) {
        return;
      }
    }

    async function loadExercises() {
      try {
        const exercisesData = await getExercises();
        if (exercisesData.length) {
          setExercises(exercisesData);
        }
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    }

    loadExercises();
  }, []);

  useEffect(() => {
    localStorage.setItem(CHANGE_WORKOUT_KEY, JSON.stringify(workout));
  }, [workout]);

  useEffect(() => {
    if (preferredUnit)
      localStorage.setItem(PREFERRED_UNIT_KEY, preferredUnit ?? "kg");
  }, [preferredUnit]);

  useEffect(() => {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  }, [exercises]);

  async function handleDelete() {
    const success = await run("deleting", async () => {
      await deleteWorkout(String(workoutId));
      setShowModal(false);
    });
    if (success) {
      setTimeout(() => {
        navigate("/");
        localStorage.removeItem(CHANGE_WORKOUT_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
        localStorage.removeItem(WORKOUT_REST_START_KEY);
        localStorage.removeItem(PREFERRED_UNIT_KEY);
      }, 1000);
    }
  }

  async function addExercise(name: string, category: string) {
    await run("saving", async () => {
      const createdExercise = await createExercise({ name, category });
      setExercises((prev) =>
        prev ? [...prev, createdExercise] : [createdExercise],
      );
    });
  }

  async function handleUpdate() {
    const formattedWorkoutExercises = workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        weight: convertValueToBaseUnit(
          Number(set.weight),
          preferredUnit ?? "kg",
        ),
      })),
    }));
    const success = await run("saving", async () => {
      await updateWorkout(
        { ...workout, exercises: formattedWorkoutExercises },
        String(workoutId),
      );
    });
    if (success) {
      setTimeout(() => {
        navigate("/");
        localStorage.removeItem(CHANGE_WORKOUT_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
        localStorage.removeItem(WORKOUT_REST_START_KEY);
        localStorage.removeItem(PREFERRED_UNIT_KEY);
      }, 1000);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.workoutContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>{workout?.name}</h3>
        <div>
          <button
            className={styles.backBtn}
            onClick={() => {
              navigate("/");
              localStorage.removeItem(CHANGE_WORKOUT_KEY);
              localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
              localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
              localStorage.removeItem(WORKOUT_REST_START_KEY);
              localStorage.removeItem("preferredUnit");
            }}
          >
            {t("common.back")}
          </button>
          <p className={styles.stopwatch}>
            {formatTime(workout?.duration_seconds, "workout")}
          </p>
          <button
            className={styles.deleteBtn}
            onClick={() => setShowModal(true)}
          >
            {t("common.delete")}
          </button>
        </div>
      </div>

      <WorkoutForm
        workout={workout}
        pageType="change"
        setWorkout={setWorkout}
        exercises={exercises ?? []}
        addExercise={addExercise}
        preferredUnit={preferredUnit}
        handleUpdate={handleUpdate}
      />
      {showModal && (
        <ExecuteModal
          text={t("modal.delete.workout")}
          btnText={t("common.delete")}
          onClose={() => {
            setShowModal(false);
          }}
          onDelete={handleDelete}
        />
      )}
      <InfoModal state={state} />
    </div>
  );
};

export default ChangeWorkout;
