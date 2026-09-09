import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import cn from "classnames";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ActiveWorkout.module.scss";

import type { Workout } from "../types/workout";
import type { ExerciseDB } from "../types/exercise";
import type { PreferredWeightUnit } from "../types/profile";

import ExecuteModal from "../components/ExecuteModal";
import WorkoutForm from "../components/WorkoutForm";
import InfoModal from "../components/InfoModal";
import LoadingScreen from "../components/LoadingScreen";

import { getRoutineDetails } from "../services/routines";
import { createExercise, getExercises } from "../services/exercises";
import { createWorkout, getPreviousExerciseData } from "../services/workouts";
import { convertValueToBaseUnit, formatTime } from "../services/utils";
import { getPersistedJSON, getInitialPreferredUnit } from "../services/storage";
import { getProfile } from "../services/profiles";
import { createEmptyWorkout } from "../services/defaults";

import { useAsyncAction } from "../hooks/useAsyncAction";

const ACTIVE_WORKOUT_ROUTINE_KEY = "activeWorkoutRoutine";
const ACTIVE_WORKOUT_KEY = "activeWorkout";
const ACTIVE_WORKOUT_SECONDS_KEY = "activeWorkoutSeconds";
const EXERCISES_KEY = "exercises";
const PREFERRED_UNIT_KEY = "preferredUnit";
const ACTIVE_WORKOUT_PREVIOUS_DATA_KEY = "activeWorkoutPreviousData";
const WORKOUT_SELECTED_EXERCISE_KEY = "workoutSelectedExercise";
const WORKOUT_SELECTED_SET_KEY = "workoutSelectedSet";
const WORKOUT_REST_START_KEY = "workoutRestStart";
const WORKOUT_SUPERSET = "workoutSuperset";

function getInitialSeconds() {
  const savedSeconds = localStorage.getItem(ACTIVE_WORKOUT_SECONDS_KEY);
  if (!savedSeconds) return 0;

  const parsedSeconds = Number(savedSeconds);
  return Number.isNaN(parsedSeconds) ? 0 : parsedSeconds;
}

const ActiveWorkout = () => {
  const navigate = useNavigate();
  const { routineId } = useParams();
  const { t } = useTranslation();
  const { run, state } = useAsyncAction();

  const [workout, setWorkout] = useState<Workout>(
    getPersistedJSON(ACTIVE_WORKOUT_KEY, createEmptyWorkout),
  );
  const [seconds, setSeconds] = useState(getInitialSeconds);
  const [exercises, setExercises] = useState<ExerciseDB[] | null>(
    getPersistedJSON(EXERCISES_KEY, null),
  );
  const [preferredUnit, setPreferredUnit] = useState<PreferredWeightUnit>(
    getInitialPreferredUnit,
  );
  const [previousData, setPreviousData] = useState<Record<string, any>>(
    getPersistedJSON(ACTIVE_WORKOUT_PREVIOUS_DATA_KEY, {}),
  );
  const exerciseIdsKey = workout.exercises
    .map((exercise) => exercise.exercise_id)
    .join(",");
  const [loading, setLoading] = useState(false);

  const [showBackModal, setShowBackModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

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
    const savedPreferredUnit = localStorage.getItem(PREFERRED_UNIT_KEY);
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
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    if (preferredUnit === "kg" || preferredUnit === "lb") {
      localStorage.setItem(PREFERRED_UNIT_KEY, String(preferredUnit));
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
    await run("saving", async () => {
      const createdExercise = await createExercise({ name, category });
      setExercises((prev) =>
        prev ? [...prev, createdExercise] : [createdExercise],
      );
    });
  }

  async function finishWorkout() {
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
    const finishedWorkout: Workout = {
      ...workout,
      exercises: formattedWorkoutExercises,
      finished_at: new Date().toISOString(),
      duration_seconds: seconds,
    };
    const success = await run("saving", async () => {
      await createWorkout(finishedWorkout);
      setShowFinishModal(false);
    });
    if (success) {
      setTimeout(() => {
        navigate("/");
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_SECONDS_KEY);
        localStorage.removeItem(EXERCISES_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_PREVIOUS_DATA_KEY);
        localStorage.removeItem(PREFERRED_UNIT_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
        localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
        localStorage.removeItem(WORKOUT_REST_START_KEY);
        localStorage.removeItem(ACTIVE_WORKOUT_ROUTINE_KEY);
        localStorage.removeItem(WORKOUT_SUPERSET);
      }, 1000);
    }
  }

  function handleBack() {
    setShowBackModal(false);
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    localStorage.removeItem(ACTIVE_WORKOUT_SECONDS_KEY);
    localStorage.removeItem(EXERCISES_KEY);
    localStorage.removeItem(ACTIVE_WORKOUT_PREVIOUS_DATA_KEY);
    localStorage.removeItem(PREFERRED_UNIT_KEY);
    localStorage.removeItem(WORKOUT_SELECTED_EXERCISE_KEY);
    localStorage.removeItem(WORKOUT_SELECTED_SET_KEY);
    localStorage.removeItem(WORKOUT_REST_START_KEY);
    localStorage.removeItem(ACTIVE_WORKOUT_ROUTINE_KEY);
    localStorage.removeItem(WORKOUT_SUPERSET);
    navigate("/");
  }

  if (loading) return <LoadingScreen />;

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
        exercises={exercises ?? []}
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
          onDelete={handleBack}
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
      <InfoModal state={state} />
    </div>
  );
};

export default ActiveWorkout;
