import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingScreen from "../components/LoadingScreen";

import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ActiveWorkout.module.scss";

import type { ExerciseDB } from "../types/exercise";
import type { Workout } from "../types/workout";

import ExecuteModal from "../components/ExecuteModal";
import WorkoutForm from "../components/WorkoutForm";

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
import type { PreferredWeightUnit } from "../types/profile";

const CHANGE_WORKOUT_KEY = "changeWorkout";
const WORKOUT_SELECTED_EXERCISE_KEY = "workoutSelectedExercise";
const WORKOUT_SELECTED_SET_KEY = "workoutSelectedSet";
const WORKOUT_REST_START_KEY = "workoutRestStart";
const EXERCISES_KEY = "exercises";
const PREFERRED_UNIT_KEY = "preferredUnit";

function createEmptyWorkout(): Workout {
  return {
    name: "Custom Workout",
    started_at: Date.now().toString(),
    finished_at: "",
    duration_seconds: 0,
    exercises: [],
  };
}

function getInitialWorkout() {
  const savedWorkout = localStorage.getItem(CHANGE_WORKOUT_KEY);

  if (savedWorkout) {
    try {
      return JSON.parse(savedWorkout) as Workout;
    } catch {
      localStorage.removeItem(CHANGE_WORKOUT_KEY);
    }
  }

  return createEmptyWorkout();
}

function getInitialExercises() {
  const savedExercises = localStorage.getItem(EXERCISES_KEY);

  if (savedExercises) {
    try {
      return JSON.parse(savedExercises) as ExerciseDB[];
    } catch {
      localStorage.removeItem(EXERCISES_KEY);
    }
  }

  return [];
}

function getInitialPreferredUnit(): "kg" | "lb" {
  const savedUnit = localStorage.getItem(PREFERRED_UNIT_KEY);

  return savedUnit === "kg" || savedUnit === "lb" ? savedUnit : "kg";
}

const ChangeWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [workout, setWorkout] = useState<Workout>(getInitialWorkout);
  const [exercises, setExercises] = useState<ExerciseDB[]>(getInitialExercises);
  const [preferredUnit, setPreferredUnit] = useState<PreferredWeightUnit>(
    getInitialPreferredUnit,
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      if (parsedExercises.length > 0) {
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
    setDeleting(true);
    try {
      await deleteWorkout(String(workoutId));
      setShowModal(false);
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate("/");
        localStorage.removeItem(CHANGE_WORKOUT_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
        localStorage.removeItem(WORKOUT_REST_START_KEY);
        localStorage.removeItem("preferredUnit");
      }, 1000);
    } catch (error) {
      console.error("Error deleting workout:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setDeleting(false);
    }
  }

  async function addExercise(name: string, category: string) {
    setSaving(true);
    try {
      const createdExercise = await createExercise({ name, category });
      setExercises((prev) => [...prev, createdExercise]);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
    } catch (error) {
      console.error("Error adding exercise:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
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
    setSaving(true);
    try {
      await updateWorkout(
        { ...workout, exercises: formattedWorkoutExercises },
        String(workoutId),
      );
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate("/");
        localStorage.removeItem(CHANGE_WORKOUT_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
        localStorage.removeItem(WORKOUT_REST_START_KEY);
        localStorage.removeItem("preferredUnit");
      }, 1000);
    } catch (error) {
      console.error("Error updating workout:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setSaving(false);
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
        exercises={exercises}
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
      {saving && <InfoModal type={"saving"} />}
      {deleting && <InfoModal type={"deleting"} />}
      {showErrorModal && <InfoModal type={"error"} />}
      {showSuccessModal && <InfoModal type={"success"} />}
    </div>
  );
};

export default ChangeWorkout;
