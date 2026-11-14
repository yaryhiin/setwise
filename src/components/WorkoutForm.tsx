import { useState, useEffect, useRef } from "react";
import cn from "classnames";
import {
  EllipsisVertical,
  Pencil,
  Trash2,
  MessageSquarePlus,
  History,
  Unlink,
  Repeat2,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/WorkoutForm.module.scss";

import type {
  WorkoutExercise,
  Workout,
  WorkoutSet,
  Superset,
  PreviousExerciseRow,
} from "../types/workout";
import type { ExerciseDB } from "../types/exercise.ts";
import type { PreferredWeightUnit } from "../types/profile";
import type { Dispatch, SetStateAction } from "react";

import ExecuteModal from "./ExecuteModal";
import ChooseExerciseModal from "../components/ChooseExerciseModal";
import ExerciseHistoryModal from "./ExerciseHistoryModal";

import {
  formatTime,
  formatPreviousSets,
  restStartFromSet,
  calculatePassedSeconds,
  buildWorkoutExercise,
  hasModifiedSets,
  formatValueBasedOnUnit,
  needsIncrease,
} from "../utils/utils";
import {
  getPersistedJSON,
  getInitialRestStart,
  setPersistedJSON,
  setPersistedString,
} from "../utils/storage";
import {
  findLastCompletedSetsInSuperset,
  findLastCompletedSetInWorkout,
} from "../utils/workoutForm/findLastCompletedSet.ts";
import {
  supersetCompleteExercise,
  supersetCompleteSet,
} from "../utils/workoutForm/supersetActions.ts";

import { useOutsideClick } from "../hooks/useOutsideClick";

const WORKOUT_SELECTED_EXERCISE_KEY = "workoutSelectedExercise";
const WORKOUT_SELECTED_SET_KEY = "workoutSelectedSet";
const WORKOUT_REST_START_KEY = "workoutRestStart";
const WORKOUT_SUPERSET = "workoutSuperset";

type WorkoutFormProps = {
  workout: Workout;
  pageType: string;
  preferredUnit?: PreferredWeightUnit;

  setWorkout?: Dispatch<SetStateAction<Workout>>;
  exercises?: ExerciseDB[];
  previousData?: Record<string, PreviousExerciseRow>;
  addExercise?: (name: string, category: string) => Promise<void>;
  handleUpdate?: () => Promise<void>;
};

const WorkoutForm = ({
  workout,
  pageType,
  setWorkout,
  exercises,
  previousData,
  addExercise,
  preferredUnit,
  handleUpdate,
}: WorkoutFormProps) => {
  const { t } = useTranslation();

  const [showChooseExerciseModal, setShowChooseExerciseModal] = useState(false);
  const [showRemoveExerciseModal, setShowRemoveExerciseModal] = useState(false);
  const [showExerciseInfoModal, setShowExerciseInfoModal] = useState(false);
  const exerciseMenuRef = useRef<HTMLDivElement>(null);
  const supersetMenuRef = useRef<HTMLDivElement>(null);
  const [chosenExerciseId, setChosenExerciseId] = useState("");
  const [selectedSet, setSelectedSet] = useState<WorkoutSet | null>(
    getPersistedJSON(
      WORKOUT_SELECTED_SET_KEY,
      workout?.exercises[0]?.sets[0] ?? null,
    ),
  );
  const [restStart, setRestStart] = useState(
    getInitialRestStart(WORKOUT_REST_START_KEY),
  );
  const [selectedExercise, setSelectedExercise] =
    useState<WorkoutExercise | null>(
      getPersistedJSON(
        WORKOUT_SELECTED_EXERCISE_KEY,
        workout?.exercises[0] ?? null,
      ),
    );
  const [superset, setSuperset] = useState<Superset[] | null>(
    getPersistedJSON(WORKOUT_SUPERSET, null),
  );
  const [increasedWeight, setIncreasedWeight] = useState(0);
  const [showIncrease, setShowIncrease] = useState<Record<string, boolean>>({});
  const [increasingExerciseId, setIncreasingExerciseId] = useState<
    string | null
  >(null);
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});
  const [showExerciseOptions, setShowExerciseOptions] = useState(false);
  const [showSupersetOptions, setShowSupersetOptions] = useState(false);

  // Fires up after user finished the last exercise in the list
  // sets up first exercise in the list with unfinished sets/set
  // if none, sets it to null to signal user that full workout is done
  useEffect(() => {
    if (workout.exercises.length > 0) {
      if (!selectedExercise) {
        for (let e of workout.exercises) {
          for (let s of e.sets) {
            if (!s.done) {
              setSelectedExercise(e);
              setSelectedSet(s);
              return;
            }
          }
        }
        if (pageType === "active") {
          setSelectedExercise(null);
          setSelectedSet(null);
        } else {
          setSelectedExercise(workout.exercises[0]);
          setSelectedSet(workout.exercises[0].sets[0]);
        }
      }
    }
  }, [workout.exercises]);

  useEffect(() => {
    if (!previousData || !workout || !setWorkout) return;
    const populatedExercises = workout.exercises.map((exercise) => {
      if (!previousData[exercise.exercise_id] || hasModifiedSets(exercise))
        return exercise;
      const previousSets = previousData[exercise.exercise_id].workout_sets;
      return {
        ...exercise,
        sets: previousSets.map((set, index) => ({
          set_number: index + 1,
          weight: formatValueBasedOnUnit(set.weight, preferredUnit ?? "kg"),
          reps: 0,
          rest_seconds: 0,
          done: false,
        })),
      };
    });
    setWorkout((prev) => ({
      ...prev,
      exercises: populatedExercises,
    }));
    const newSelectedExercise = selectedExercise
      ? (populatedExercises.find((e) => e.id === selectedExercise.id) ?? null)
      : null;
    setSelectedExercise(newSelectedExercise);
    setSelectedSet(
      (prev) =>
        newSelectedExercise?.sets.find(
          (s) => s.set_number === prev?.set_number,
        ) ?? null,
    );
  }, [previousData]);

  useEffect(() => {
    if (pageType === "view" || !selectedExercise) return;
    setPersistedJSON(WORKOUT_SELECTED_EXERCISE_KEY, selectedExercise);
  }, [selectedExercise]);

  useEffect(() => {
    if (pageType === "view" || !selectedSet) return;
    setPersistedJSON(WORKOUT_SELECTED_SET_KEY, selectedSet);
  }, [selectedSet]);

  useEffect(() => {
    if (pageType !== "active") return;
    setPersistedString(WORKOUT_REST_START_KEY, restStart);
  }, [restStart]);

  useEffect(() => {
    if (pageType !== "active") return;
    setPersistedJSON(WORKOUT_SUPERSET, superset);
  }, [superset]);

  // Rest timer logic
  useEffect(() => {
    if (
      !restStart ||
      !selectedExercise ||
      !selectedSet ||
      pageType === "view" ||
      pageType === "change"
    )
      return;

    const interval = setInterval(() => {
      // Checking if we are in superset exercise
      if (
        superset &&
        superset.some(
          (e) =>
            e.exercise1Id === selectedExercise.id ||
            e.exercise2Id === selectedExercise.id,
        ) &&
        // Skipping first set on first exercise in the superset,
        // cause we need rest time to go into before superset exercise`s last set
        !(
          selectedSet.set_number === 1 &&
          superset.some((e) => e.exercise1Id === selectedExercise.id)
        )
      ) {
        handleSupersetTimer(selectedExercise, superset);
      }
      // Not superset timer logic
      else {
        handleTimer(selectedExercise, selectedSet);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [restStart, selectedExercise, selectedSet, superset]);

  useOutsideClick(exerciseMenuRef, showExerciseOptions, () =>
    setShowExerciseOptions(false),
  );

  useOutsideClick(supersetMenuRef, showSupersetOptions, () =>
    setShowSupersetOptions(false),
  );

  useEffect(() => {
    if (selectedExercise)
      document.getElementById(selectedExercise.id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [selectedExercise?.id, selectedSet?.set_number]);

  function addSet(exerciseId: string) {
    if (!setWorkout || pageType === "view") return;

    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                {
                  set_number: exercise.sets.length + 1,
                  weight: exercise.sets[exercise.sets.length - 1].weight,
                  reps: 0,
                  rest_seconds: 0,
                  done: false,
                },
              ],
            }
          : exercise,
      ),
    }));
    if (selectedExercise?.id === exerciseId) {
      setSelectedExercise((prev) =>
        prev
          ? {
              ...prev,
              sets: [
                ...prev.sets,
                {
                  set_number: prev.sets.length + 1,
                  weight: prev.sets[prev.sets.length - 1].weight,
                  reps: 0,
                  rest_seconds: 0,
                  done: false,
                },
              ],
            }
          : null,
      );
    }
  }

  function deleteSet(exerciseId: string, setNumber: number) {
    if (!setWorkout || pageType === "view") return;

    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets
                .filter((set) => set.set_number !== setNumber)
                .map((set, index) => ({ ...set, set_number: index + 1 })),
            }
          : exercise,
      ),
    }));
    if (selectedExercise?.id === exerciseId) {
      const updatedExercise = selectedExercise
        ? {
            ...selectedExercise,
            sets: selectedExercise.sets
              .filter((set) => set.set_number !== setNumber)
              .map((set, index) => ({ ...set, set_number: index + 1 })),
          }
        : null;
      setSelectedExercise(updatedExercise);
      if (updatedExercise && selectedSet) {
        if (selectedSet.set_number === setNumber) {
          if (updatedExercise.sets.length < setNumber) {
            setSelectedSet(
              updatedExercise.sets[updatedExercise.sets.length - 1],
            );
          } else {
            setSelectedSet(updatedExercise.sets[setNumber - 1] ?? null);
          }
        } else if (selectedSet.set_number > setNumber) {
          setSelectedSet(updatedExercise.sets[setNumber - 1] ?? null);
        }
      }
    }
  }

  function updateSet(
    exerciseId: string,
    setNumber: number,
    field: keyof WorkoutSet,
    value: number | boolean,
  ) {
    if (!setWorkout || pageType === "view") return;

    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.set_number === setNumber ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    }));
    if (selectedExercise?.id === exerciseId) {
      if (selectedSet?.set_number === setNumber) {
        setSelectedSet((prev) => (prev ? { ...prev, [field]: value } : null));
      }
      setSelectedExercise((prev) =>
        prev
          ? {
              ...prev,
              sets: prev.sets.map((set) =>
                set.set_number === setNumber ? { ...set, [field]: value } : set,
              ),
            }
          : null,
      );
    }
  }

  function chooseExercise(exercise: ExerciseDB) {
    if (!setWorkout || pageType === "view") return;
    if (chosenExerciseId !== "") {
      const updatedWorkout = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.id === chosenExerciseId
            ? { ...buildWorkoutExercise(exercise, e.order_index), id: e.id }
            : e,
        ),
      };
      setWorkout(updatedWorkout);
      if (selectedExercise?.id === chosenExerciseId) {
        setSelectedExercise((prev) =>
          prev
            ? (workout.exercises.find((e) => e.id === chosenExerciseId) ?? null)
            : null,
        );
      }
    } else {
      setWorkout((prev) => ({
        ...prev,
        exercises: [
          ...prev.exercises,
          buildWorkoutExercise(exercise, prev.exercises.length + 1),
        ],
      }));
    }
    setChosenExerciseId("");
    setShowChooseExerciseModal(false);
  }

  function removeExercise() {
    if (chosenExerciseId === "" || !setWorkout || pageType === "view") return;
    setWorkout((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises
          .filter((exercise) => exercise.id !== chosenExerciseId)
          .map((exercise, index) => ({ ...exercise, order_index: index + 1 })),
      ],
    }));
    if (superset) {
      removeSuperset(chosenExerciseId);
    }
    setChosenExerciseId("");
    setShowRemoveExerciseModal(false);
  }

  function updateExerciseNote(exerciseId: string, note: string) {
    if (!setWorkout || pageType === "view") return;

    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, notes: note } : exercise,
      ),
    }));
  }

  function handleSwitchSet(exercise: WorkoutExercise, set: WorkoutSet) {
    setSelectedExercise(exercise);
    setSelectedSet(set);
    if (
      superset &&
      superset.some(
        (e) => e.exercise1Id === exercise.id || e.exercise2Id === exercise.id,
      )
    ) {
      const { completedSet1, completedSet2 } = findLastCompletedSetsInSuperset(
        workout,
        exercise,
        superset,
      );
      setSuperset((prev) =>
        prev
          ? prev.map((s) =>
              s.exercise1Id === exercise.id || s.exercise2Id === exercise.id
                ? {
                    ...s,
                    exercise1RestStart: restStartFromSet(completedSet1),
                    exercise2RestStart: restStartFromSet(completedSet2),
                  }
                : s,
            )
          : prev,
      );
    } else {
      const { completedSet } = findLastCompletedSetInWorkout(
        workout,
        exercise,
        set,
      );
      setRestStart(restStartFromSet(completedSet));
    }
  }

  function handleSupersetCompleteExercise() {
    if (!selectedExercise || !superset || !selectedSet) return;
    updateSet(selectedExercise.id, selectedSet.set_number, "done", true);
    const {
      newSelectedExercise,
      newSelectedSet,
      addNewSet,
      newSuperset,
      endSuperset,
    } = supersetCompleteExercise(
      workout,
      superset,
      selectedExercise,
      selectedSet,
    );
    setSelectedSet(newSelectedSet ?? null);
    setSelectedExercise(newSelectedExercise ?? null);
    if (addNewSet && newSelectedExercise) addSet(newSelectedExercise.id);
    setSuperset(newSuperset ?? superset);
    if (endSuperset) setRestStart(new Date().toISOString());
  }

  function handleCompleteExercise() {
    if (!selectedExercise || !selectedSet) return;
    updateSet(selectedExercise.id, selectedSet.set_number, "done", true);
    const nextExercise =
      workout.exercises.find((exercise) =>
        selectedExercise
          ? selectedExercise?.order_index + 1 === exercise.order_index
          : null,
      ) ?? null;
    setSelectedExercise(nextExercise);
    setSelectedSet(nextExercise?.sets[0] ?? null);
    setRestStart(new Date().toISOString());
  }

  function handleSupersetCompleteSet() {
    if (!selectedExercise || !superset || !selectedSet) return;
    updateSet(selectedExercise.id, selectedSet.set_number, "done", true);
    const { newSelectedExercise, newSelectedSet, addNewSet, newSuperset } =
      supersetCompleteSet(workout, superset, selectedExercise, selectedSet);
    setSelectedSet(newSelectedSet ?? null);
    setSelectedExercise(newSelectedExercise ?? null);
    if (addNewSet && newSelectedExercise) addSet(newSelectedExercise.id);
    setSuperset(newSuperset ?? superset);
  }

  function handleCompleteSet() {
    if (!selectedExercise || !selectedSet) return;
    updateSet(selectedExercise.id, selectedSet.set_number, "done", true);
    setSelectedSet(selectedExercise.sets[selectedSet.set_number] ?? null);
    setRestStart(new Date().toISOString());
  }

  function handleTimer(
    selectedExercise: WorkoutExercise,
    selectedSet: WorkoutSet,
  ) {
    const timePassed = calculatePassedSeconds(restStart);

    const { completedSet, exerciseId } = findLastCompletedSetInWorkout(
      workout,
      selectedExercise,
      selectedSet,
    );
    if (completedSet && exerciseId) {
      updateSet(
        exerciseId,
        completedSet.set_number,
        "rest_seconds",
        timePassed,
      );
      setSelectedSet((prev) =>
        prev
          ? {
              ...prev,
              rest_seconds: timePassed,
            }
          : null,
      );
    }
  }

  function handleSupersetTimer(
    selectedExercise: WorkoutExercise,
    superset: Superset[],
  ) {
    const {
      completedSet1,
      completedSet2,
      exerciseSuperset1,
      exerciseSuperset2,
    } = findLastCompletedSetsInSuperset(workout, selectedExercise, superset);
    if (completedSet1 && exerciseSuperset1 && exerciseSuperset1.restStart) {
      const timePassed1 = calculatePassedSeconds(exerciseSuperset1.restStart);
      updateSet(
        exerciseSuperset1.exerciseId,
        completedSet1.set_number,
        "rest_seconds",
        timePassed1,
      );
      // Checking which exercise we are currently on and showing that rest seconds on the bottom bar
      if (exerciseSuperset1.exerciseId === selectedExercise.id) {
        setSelectedSet((prev) =>
          prev
            ? {
                ...prev,
                rest_seconds: timePassed1,
              }
            : null,
        );
      }
    }
    if (completedSet2 && exerciseSuperset2 && exerciseSuperset2.restStart) {
      const timePassed2 = calculatePassedSeconds(exerciseSuperset2.restStart);
      updateSet(
        exerciseSuperset2.exerciseId,
        completedSet2.set_number,
        "rest_seconds",
        timePassed2,
      );
      // Checking which exercise we are currently on and showing that rest seconds on the bottom bar
      if (exerciseSuperset2.exerciseId === selectedExercise.id) {
        setSelectedSet((prev) =>
          prev
            ? {
                ...prev,
                rest_seconds: timePassed2,
              }
            : null,
        );
      }
    }
  }

  function createSuperset(exercise: WorkoutExercise) {
    const newSuperset = {
      exercise0Id:
        exercise.order_index > 1
          ? workout.exercises[exercise.order_index - 2].id
          : "",
      exercise1Id: exercise.id,
      exercise2Id: workout.exercises[exercise.order_index].id,
      exercise1RestStart: "",
      exercise2RestStart: "",
    };
    setSuperset((prev) => (prev ? [...prev, newSuperset] : [newSuperset]));
    setShowExerciseOptions(false);
  }

  function removeSuperset(exerciseId: string) {
    setSuperset((prev) =>
      prev
        ? prev.filter(
            (e) => e.exercise1Id !== exerciseId && e.exercise2Id !== exerciseId,
          )
        : prev,
    );
    setShowExerciseOptions(false);
    setShowSupersetOptions(false);
  }

  return (
    <div className={styles.workoutFormContainer}>
      <div
        className={`${styles.exerciseContainer} ${pageType !== "view" ? styles.addTopMargin : ""}`}
      >
        {workout.exercises.map((exercise) => (
          <div className={styles.exerciseSpace} key={exercise.id}>
            <div
              className={`${styles.exerciseCard} ${exercise.id === selectedExercise?.id ? styles.selected : ""} ${superset?.some((e) => e.exercise1Id === exercise.id || e.exercise2Id === exercise.id) ? styles.superset : ""}`}
              id={exercise.id}
              data-testid={`exercise-${exercise.id}`}
            >
              <div className={styles.exerciseCardHeader}>
                <h2 className={styles.exerciseName}>
                  {exercise.exercise_name}
                </h2>
                <div className="exerciseMenuWrapper">
                  {showExerciseOptions && chosenExerciseId === exercise.id ? (
                    <div ref={exerciseMenuRef} className="exerciseMenu">
                      {pageType !== "view" && (
                        <button
                          className={styles.editExerciseBtn}
                          onClick={() => {
                            setShowChooseExerciseModal(true);
                            setShowExerciseOptions(false);
                          }}
                        >
                          <Pencil size={15} />
                          {t("common.replace")}
                        </button>
                      )}
                      {pageType !== "view" && (
                        <button
                          className={styles.deleteExerciseBtn}
                          onClick={() => {
                            setShowRemoveExerciseModal(true);
                            setShowExerciseOptions(false);
                          }}
                        >
                          <Trash2 size={15} />
                          {t("common.delete")}
                        </button>
                      )}
                      <button
                        className={styles.exerciseHistoryBtn}
                        onClick={() => {
                          setShowExerciseInfoModal(true);
                          setShowExerciseOptions(false);
                        }}
                      >
                        <History size={15} />
                        {t("common.history")}
                      </button>
                      {exercise.order_index < workout.exercises.length &&
                      pageType === "active" &&
                      !superset?.some(
                        (e) =>
                          e.exercise0Id === exercise.id ||
                          e.exercise1Id === exercise.id ||
                          e.exercise2Id === exercise.id,
                      ) ? (
                        <button
                          className={styles.addSupersetBtn}
                          onClick={() => {
                            createSuperset(exercise);
                            setShowExerciseOptions(false);
                          }}
                          aria-label={t("common.superset")}
                        >
                          <Repeat2 size={17} /> {t("common.superset")}
                        </button>
                      ) : (
                        pageType === "active" &&
                        superset?.some(
                          (e) =>
                            e.exercise1Id === exercise.id ||
                            e.exercise2Id === exercise.id,
                        ) && (
                          <button
                            className={styles.unlinkBtn}
                            onClick={() => {
                              removeSuperset(exercise.id);
                              setShowExerciseOptions(false);
                            }}
                          >
                            <Unlink size={15} />
                            {t("common.unlink")}
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <button
                      className="accessBtn"
                      onClick={() => {
                        setShowExerciseOptions(true);
                        setChosenExerciseId(exercise.id);
                      }}
                      aria-label="Exercise options"
                    >
                      <EllipsisVertical size={20} />
                    </button>
                  )}
                </div>
              </div>
              {previousData?.[exercise.exercise_id] && (
                <p className={styles.exercisePrev}>
                  {t("workout.last")}{" "}
                  {formatPreviousSets(
                    preferredUnit ?? "kg",
                    previousData[exercise.exercise_id].workout_sets,
                  )}
                </p>
              )}
              {previousData?.[exercise.exercise_id]?.notes && (
                <p className={styles.exercisePrev}>
                  {t("workout.note.prev")}{" "}
                  {previousData[exercise.exercise_id].notes}
                </p>
              )}
              {showNotes[exercise.id] || exercise.notes ? (
                <input
                  className={styles.exerciseNote}
                  type="text"
                  maxLength={60}
                  placeholder={t("workout.note.placeHolder")}
                  readOnly={pageType === "view"}
                  value={exercise.notes}
                  onChange={(e) =>
                    updateExerciseNote(exercise.id, e.target.value)
                  }
                />
              ) : (
                pageType !== "view" && (
                  <button
                    className={styles.addNoteBtn}
                    onClick={() =>
                      setShowNotes((prev) => ({
                        ...prev,
                        [exercise.id]: true,
                      }))
                    }
                  >
                    <MessageSquarePlus size={15} />
                    {t("workout.note.add")}
                  </button>
                )
              )}
              <div className={styles.exercises}>
                <table className={styles.sets}>
                  <thead>
                    <tr>
                      <th>{t("workout.set")}</th>
                      <th>
                        {t("workout.weight")} ({t(`units.${preferredUnit}`)})
                      </th>
                      <th>{t("workout.reps")}</th>
                      <th>{t("workout.done")}</th>
                      <th>{t("workout.rest")}</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {exercise.sets.map((set) => (
                      <tr
                        key={set.set_number}
                        className={`${styles.set} ${exercise.id === selectedExercise?.id && set.set_number === selectedSet?.set_number ? styles.selected : ""}`}
                        onClick={() => {
                          handleSwitchSet(exercise, set);
                        }}
                      >
                        <td>{set.set_number}</td>
                        <td>{set.weight}</td>
                        <td>{set.reps}</td>
                        <td>{set.done && "✅"}</td>
                        <td>{formatTime(set.rest_seconds, "rest")}</td>
                        <td>
                          <button
                            hidden={
                              pageType === "view" || exercise.sets.length < 2
                            }
                            className={styles.deleteSet}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSet(exercise.id, set.set_number);
                            }}
                            aria-label="Delete set"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pageType !== "view" && (
                  <div className={styles.buttons}>
                    <button
                      className={styles.addSet}
                      onClick={() => addSet(exercise.id)}
                    >
                      {t("workout.addSet")}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {exercise.order_index < workout.exercises.length &&
              pageType === "active" &&
              superset?.some((e) => e.exercise1Id === exercise.id) && (
                <div ref={supersetMenuRef} className={styles.supersetDivider}>
                  <p className={`${styles.supersetBtn} ${styles.superset}`}>
                    {t("common.superset")}{" "}
                    {superset.findIndex((e) => e.exercise1Id === exercise.id) +
                      1}
                  </p>

                  {showSupersetOptions && chosenExerciseId === exercise.id ? (
                    <div ref={supersetMenuRef} className={styles.supersetMenu}>
                      <button
                        className={`${styles.supersetBtn} ${styles.superset}`}
                        onClick={() => {
                          removeSuperset(exercise.id);
                          setShowSupersetOptions(false);
                        }}
                      >
                        <Unlink size={15} />
                        {t("common.unlink")}
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.accessBtnSuperset}
                      onClick={() => {
                        setShowSupersetOptions(true);
                        setChosenExerciseId(exercise.id);
                      }}
                    >
                      <EllipsisVertical size={15} color="#8b5cf6" />
                    </button>
                  )}
                </div>
              )}
          </div>
        ))}
        {pageType !== "view" && (
          <button
            className={cn(styles.addExercise, styles.button)}
            onClick={() => {
              setShowChooseExerciseModal(true);
              setChosenExerciseId("");
            }}
          >
            {t("workout.addExercise")}
          </button>
        )}
      </div>

      {workout.exercises.length > 0 &&
        selectedExercise &&
        selectedSet &&
        pageType !== "view" && (
          <div data-testid="navBar" className={styles.buttonContainer}>
            <div className={styles.barHeader}>
              <p>{selectedExercise.exercise_name}</p>
              <p>
                {t("workout.set")} {selectedSet.set_number}
              </p>
            </div>
            <p>
              {t("workout.rest")}:{" "}
              {formatTime(selectedSet.rest_seconds, "rest")}
            </p>
            {previousData?.[selectedExercise.exercise_id] &&
              selectedExercise.max_reps &&
              needsIncrease(
                selectedSet,
                previousData[selectedExercise.exercise_id],
                selectedExercise.max_reps,
                selectedExercise.requiredSets ?? 1,
              ) &&
              !showIncrease[selectedExercise.id] &&
              (increasingExerciseId === selectedExercise.id ? (
                <div className={styles.increaseSuggestion}>
                  <div>
                    <label htmlFor="increaseWeight">
                      {t("workout.increase.newWeight")}
                    </label>
                    <input
                      id="increaseWeight"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000"
                      placeholder="0"
                      aria-label="Put in new weight"
                      value={increasedWeight ? increasedWeight : ""}
                      onChange={(e) =>
                        setIncreasedWeight(Number(e.target.value))
                      }
                    ></input>
                  </div>
                  <button
                    disabled={
                      increasedWeight <= 0 ||
                      increasedWeight > 1000 ||
                      !Number.isFinite(increasedWeight)
                    }
                    onClick={() => {
                      for (let i = 1; i <= selectedExercise.sets.length; i++) {
                        updateSet(
                          selectedExercise.id,
                          i,
                          "weight",
                          increasedWeight,
                        );
                      }
                      setShowIncrease((prev) => ({
                        ...prev,
                        [selectedExercise.id]: true,
                      }));
                    }}
                  >
                    {t("workout.increase.apply")}
                  </button>
                </div>
              ) : (
                <div className={styles.increaseSuggestion}>
                  <p>
                    <TrendingUp size={17} color="#36f48f" />
                    {t("workout.increase.text")}
                  </p>
                  <button
                    onClick={() => setIncreasingExerciseId(selectedExercise.id)}
                  >
                    {t("workout.increase.button")}
                  </button>
                </div>
              ))}
            <div className={styles.barInputs}>
              <label>
                {t("workout.weight")} ({t(`units.${preferredUnit}`)})
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  placeholder="0"
                  onChange={(e) =>
                    updateSet(
                      selectedExercise.id,
                      selectedSet.set_number,
                      "weight",
                      Number(e.target.value),
                    )
                  }
                  value={selectedSet.weight === 0 ? "" : selectedSet.weight}
                />
              </label>
              <label>
                {t("workout.reps")}
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="1000"
                  placeholder="0"
                  onChange={(e) =>
                    updateSet(
                      selectedExercise.id,
                      selectedSet.set_number,
                      "reps",
                      Number(e.target.value),
                    )
                  }
                  value={selectedSet.reps === 0 ? "" : selectedSet.reps}
                />
              </label>
              {pageType === "active" &&
                (selectedSet.set_number >= selectedExercise.sets.length ? (
                  superset &&
                  superset.some(
                    (e) =>
                      e.exercise1Id === selectedExercise.id ||
                      e.exercise2Id === selectedExercise.id,
                  ) ? (
                    <button
                      className={styles.completeSet}
                      hidden={selectedSet.done}
                      onClick={handleSupersetCompleteExercise}
                    >
                      {t("workout.completeExercise")}
                    </button>
                  ) : (
                    <button
                      className={styles.completeSet}
                      hidden={selectedSet.done}
                      onClick={handleCompleteExercise}
                    >
                      {t("workout.completeExercise")}
                    </button>
                  )
                ) : superset &&
                  superset.some(
                    (e) =>
                      e.exercise1Id === selectedExercise.id ||
                      e.exercise2Id === selectedExercise.id,
                  ) ? (
                  <button
                    className={styles.completeSet}
                    hidden={selectedSet.done}
                    onClick={handleSupersetCompleteSet}
                  >
                    {t("workout.completeSet")}{" "}
                  </button>
                ) : (
                  <button
                    className={styles.completeSet}
                    hidden={selectedSet.done}
                    onClick={handleCompleteSet}
                  >
                    {t("workout.completeSet")}
                  </button>
                ))}
              {pageType === "change" && (
                <button className={styles.saveBtn} onClick={handleUpdate}>
                  {t("common.saveChanges")}
                </button>
              )}
            </div>
          </div>
        )}
      {showExerciseInfoModal && (
        <ExerciseHistoryModal
          exerciseId={chosenExerciseId}
          onClose={() => setShowExerciseInfoModal(false)}
          preferredUnit={preferredUnit ?? "kg"}
        />
      )}
      {showRemoveExerciseModal && (
        <ExecuteModal
          text={t("modal.delete.exerciseWorkout")}
          btnText={t("common.delete")}
          onClose={() => setShowRemoveExerciseModal(false)}
          onDelete={removeExercise}
        />
      )}
      {showChooseExerciseModal && exercises && addExercise && (
        <ChooseExerciseModal
          initialSelectedExerciseId={chosenExerciseId}
          exercises={exercises}
          existingExercises={
            new Set(workout.exercises.map((exercise) => exercise.exercise_id))
          }
          onClose={() => {
            setShowChooseExerciseModal(false);
          }}
          addExercise={addExercise}
          chooseExercise={chooseExercise}
        />
      )}
    </div>
  );
};

export default WorkoutForm;
