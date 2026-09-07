import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import cn from "classnames";
import LoadingScreen from "../components/LoadingScreen";

import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ActiveWorkout.module.scss";

import type { Workout } from "../types/workout";
import type { ExerciseDB } from "../types/exercise";

import ExecuteModal from "../components/ExecuteModal";
import WorkoutForm from "../components/WorkoutForm";

import { getRoutineDetails } from "../services/routines";
import { createExercise, getExercises } from "../services/exercises";
import { createWorkout, getPreviousExerciseData } from "../services/workouts";
import { formatTime } from "../services/utils";
import InfoModal from "../components/InfoModal";
import type { PreferredWeightUnit } from "../types/profile";
import { getProfile } from "../services/profiles";

const ACTIVE_WORKOUT_ROUTINE_KEY = "activeWorkoutRoutine";
const ACTIVE_WORKOUT_KEY = "activeWorkout";
const ACTIVE_WORKOUT_SECONDS_KEY = "activeWorkoutSeconds";
const ACTIVE_WORKOUT_EXERCISES_KEY = "activeWorkoutExercises";
const ACTIVE_WORKOUT_PREFERRED_UNIT_KEY = "activeWorkoutPreferredUnit";
const ACTIVE_WORKOUT_PREVIOUS_DATA_KEY = "activeWorkoutPreviousData";
const WORKOUT_SELECTED_EXERCISE_KEY = "workoutSelectedExercise";
const WORKOUT_SELECTED_SET_KEY = "workoutSelectedSet";
const WORKOUT_REST_START_KEY = "workoutRestStart";
const WORKOUT_SUPERSET = "workoutSuperset";

function createEmptyWorkout(): Workout {
  return {
    name: "Custom Workout",
    started_at: new Date().toISOString(),
    finished_at: "",
    duration_seconds: 0,
    exercises: [],
  };
}

function getInitialSeconds() {
  const savedSeconds = localStorage.getItem(ACTIVE_WORKOUT_SECONDS_KEY);
  if (!savedSeconds) return 0;

  const parsedSeconds = Number(savedSeconds);
  return Number.isNaN(parsedSeconds) ? 0 : parsedSeconds;
}

function getInitialWorkout() {
  const savedWorkout = localStorage.getItem(ACTIVE_WORKOUT_KEY);

  if (savedWorkout) {
    try {
      return JSON.parse(savedWorkout) as Workout;
    } catch {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    }
  }

  return createEmptyWorkout();
}

function getInitialExercises() {
  const savedExercises = localStorage.getItem(ACTIVE_WORKOUT_EXERCISES_KEY);

  if (savedExercises) {
    try {
      return JSON.parse(savedExercises) as ExerciseDB[];
    } catch {
      localStorage.removeItem(ACTIVE_WORKOUT_EXERCISES_KEY);
    }
  }

  return [];
}

function getInitialPreviousData() {
  const savedPreviousData = localStorage.getItem(
    ACTIVE_WORKOUT_PREVIOUS_DATA_KEY,
  );

  if (savedPreviousData) {
    try {
      return JSON.parse(savedPreviousData) as Record<string, any>;
    } catch {
      localStorage.removeItem(ACTIVE_WORKOUT_PREVIOUS_DATA_KEY);
    }
  }

  return {};
}

function getInitialPreferredUnit(): "kg" | "lb" | null {
  const savedUnit = localStorage.getItem(ACTIVE_WORKOUT_PREFERRED_UNIT_KEY);

  return savedUnit === "kg" || savedUnit === "lb" ? savedUnit : null;
}

const ActiveWorkout = () => {
  const navigate = useNavigate();
  const { routineId } = useParams();
  const { t } = useTranslation();

  const [workout, setWorkout] = useState<Workout>(getInitialWorkout);
  const [seconds, setSeconds] = useState(getInitialSeconds);
  const [exercises, setExercises] = useState<ExerciseDB[]>(getInitialExercises);
  const [preferredUnit, setPreferredUnit] =
    useState<PreferredWeightUnit | null>(getInitialPreferredUnit);
  const [previousData, setPreviousData] = useState<Record<string, any>>(
    getInitialPreviousData,
  );
  const exerciseIdsKey = workout.exercises
    .map((exercise) => exercise.exercise_id)
    .join(",");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showBackModal, setShowBackModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const savedExercises = localStorage.getItem(ACTIVE_WORKOUT_EXERCISES_KEY);
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
    const savedPreferredUnit = localStorage.getItem(
      ACTIVE_WORKOUT_PREFERRED_UNIT_KEY,
    );
    if (savedPreferredUnit === "kg" || savedPreferredUnit === "lb") {
      setPreferredUnit(savedPreferredUnit);
      return;
    }
    async function loadProfile() {
      try {
        const data = await getProfile();
        if (data) {
          setPreferredUnit(data.preferred_workout_unit);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    async function loadPreviousData() {
      try {
        const exerciseIds = workout.exercises
          .map((exercise) => exercise.exercise_id)
          .filter(Boolean);
        if (exerciseIds.length === 0) return;

        const data = await getPreviousExerciseData(exerciseIds);
        setPreviousData(data);
      } catch (error) {
        console.error("Error fetching previous data:", error);
      }
    }

    loadPreviousData();
  }, [exerciseIdsKey]);

  useEffect(() => {
    const savedWorkout = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (savedWorkout) {
      return;
    }
    if (routineId) {
      localStorage.setItem(ACTIVE_WORKOUT_ROUTINE_KEY, routineId);
      async function getDetails() {
        setLoading(true);
        try {
          const routine = await getRoutineDetails(String(routineId));
          if (routine) {
            setWorkout({
              name: routine.name,
              started_at: new Date().toISOString(),
              finished_at: "",
              duration_seconds: seconds,
              exercises: [...routine.routine_exercises]
                .sort((a, b) => a.order_index - b.order_index)
                .map((item) => ({
                  id: item.id,
                  exercise_id: item.exercise_id,
                  exercise_name: item.exercises.name,
                  category: item.exercises.category,
                  order_index: item.order_index,
                  notes: "",
                  sets: [
                    {
                      set_number: 1,
                      weight: 0,
                      reps: 0,
                      rest_seconds: 0,
                      done: false,
                    },
                  ],
                })),
            });
          }
        } catch (error) {
          console.error("Error loading data: ", error);
        } finally {
          setLoading(false);
        }
      }

      getDetails();
    } else {
      setWorkout({
        name: t("workout.custom"),
        started_at: new Date().toISOString(),
        finished_at: "",
        duration_seconds: seconds,
        exercises: [],
      });
    }
  }, [routineId]);

  useEffect(() => {
    if (!workout.started_at) return;

    const interval = setInterval(() => {
      const timePassed = Date.now() - new Date(workout.started_at).getTime();
      setSeconds(Math.floor(timePassed / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [workout.started_at]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(workout));
  }, [workout]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_WORKOUT_SECONDS_KEY, String(seconds));
  }, [seconds]);

  useEffect(() => {
    localStorage.setItem(
      ACTIVE_WORKOUT_EXERCISES_KEY,
      JSON.stringify(exercises),
    );
  }, [exercises]);

  useEffect(() => {
    if (preferredUnit === "kg" || preferredUnit === "lb") {
      localStorage.setItem(
        ACTIVE_WORKOUT_PREFERRED_UNIT_KEY,
        String(preferredUnit),
      );
    }
  }, [preferredUnit]);

  useEffect(() => {
    if (Object.keys(previousData).length === 0) return;

    localStorage.setItem(
      ACTIVE_WORKOUT_PREVIOUS_DATA_KEY,
      JSON.stringify(previousData),
    );
  }, [previousData]);

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

  async function finishWorkout() {
    setSaving(true);

    const formattedWorkoutExercises = workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        weight:
          preferredUnit === "lb"
            ? Math.round((set.weight / 2.20462262) * 100) / 100
            : set.weight,
      })),
    }));
    const finishedWorkout: Workout = {
      ...workout,
      exercises: formattedWorkoutExercises,
      finished_at: new Date().toISOString(),
      duration_seconds: seconds,
    };
    try {
      await createWorkout(finishedWorkout);
      setShowFinishModal(false);
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate("/");
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_SECONDS_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_EXERCISES_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_PREVIOUS_DATA_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_PREFERRED_UNIT_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
        localStorage.removeItem(WORKOUT_REST_START_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_ROUTINE_KEY);
        localStorage.removeItem(WORKOUT_SUPERSET);
      }, 1000);
    } catch (error) {
      setShowFinishModal(false);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <LoadingScreen />

  return (
    <div className={styles.workoutContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>{workout.name}</h3>
        <div>
          <button
            className={cn(styles.backBtn, styles.button)}
            onClick={() => setShowBackModal(true)}
          >
            {t("common.exit")}
          </button>
          <p className={styles.stopwatch}>{formatTime(seconds, "workout")}</p>
          <button
            className={cn(styles.button, styles.finishBtn)}
            onClick={() => setShowFinishModal(true)}
          >
            {t("common.finish")}
          </button>
        </div>
      </div>
      <WorkoutForm
        workout={workout}
        setWorkout={setWorkout}
        exercises={exercises}
        previousData={previousData}
        addExercise={addExercise}
        pageType="active"
        preferredUnit={preferredUnit}
      />
      {showBackModal && (
        <ExecuteModal
          text={t("modal.back")}
          btnText={t("common.exit")}
          onClose={() => setShowBackModal(false)}
          onDelete={() => {
            setShowBackModal(false);
            localStorage.removeItem(ACTIVE_WORKOUT_KEY);
            localStorage.removeItem(ACTIVE_WORKOUT_SECONDS_KEY);
            localStorage.removeItem(ACTIVE_WORKOUT_EXERCISES_KEY);
            localStorage.removeItem(ACTIVE_WORKOUT_PREVIOUS_DATA_KEY);
            localStorage.removeItem(ACTIVE_WORKOUT_PREFERRED_UNIT_KEY);
            localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
            localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
            localStorage.removeItem(WORKOUT_REST_START_KEY);
            localStorage.removeItem(ACTIVE_WORKOUT_ROUTINE_KEY);
            localStorage.removeItem(WORKOUT_SUPERSET);
            navigate("/");
          }}
        />
      )}
      {showFinishModal && (
        <ExecuteModal
          text={t("modal.finish")}
          btnText={t("common.finish")}
          onDelete={finishWorkout}
          onClose={() => {
            setShowFinishModal(false);
          }}
        />
      )}

      <div className={styles.buttonContainer}></div>
      {saving && <InfoModal type={"saving"} />}
      {showErrorModal && <InfoModal type={"error"} />}
      {showSuccessModal && <InfoModal type={"success"} />}
    </div>
  );
};

export default ActiveWorkout;
