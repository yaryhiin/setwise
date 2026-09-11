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
} from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/WorkoutForm.module.scss";

import type { WorkoutExercise, Workout, WorkoutSet } from "../types/workout";
import type { ExerciseDB } from "../types/exercise";
import type { PreferredWeightUnit } from "../types/profile";
import type { Dispatch, SetStateAction } from "react";

import ExecuteModal from "./ExecuteModal";
import ChooseExerciseModal from "../components/ChooseExerciseModal";

import { createLocalId } from "../utils/utils";
import { formatTime, formatPreviousSets } from "../utils/utils";
import ExerciseHistoryModal from "./ExerciseHistoryModal";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { getPersistedJSON, getInitialRestStart } from "../utils/storage";

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
  previousData?: Record<string, any>;
  addExercise?: (name: string, category: string) => Promise<void>;
  handleUpdate?: () => Promise<void>;
};

type Superset = {
  exercise0Id: string;
  exercise1Id: string;
  exercise2Id: string;
  exercise1RestStart: string;
  exercise2RestStart: string;
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
    if (pageType === "view") return;
    localStorage.setItem(
      WORKOUT_SELECTED_EXERCISE_KEY,
      JSON.stringify(selectedExercise),
    );
  }, [selectedExercise]);

  useEffect(() => {
    if (pageType === "view") return;
    localStorage.setItem(WORKOUT_SELECTED_SET_KEY, JSON.stringify(selectedSet));
  }, [selectedSet]);

  useEffect(() => {
    if (pageType === "active")
      localStorage.setItem(WORKOUT_REST_START_KEY, restStart);
  }, [restStart]);

  useEffect(() => {
    if (pageType === "active")
      localStorage.setItem(WORKOUT_SUPERSET, JSON.stringify(superset));
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
            e.exercise1Id === selectedExercise.exercise_id ||
            e.exercise2Id === selectedExercise.exercise_id,
        ) &&
        // Skipping first set on first exercise in the superset,
        // cause we need rest time to go into before superset exercise`s last set
        !(
          selectedSet.set_number === 1 &&
          superset.some((e) => e.exercise1Id === selectedExercise.exercise_id)
        )
      ) {
        for (let i of superset) {
          if (
            i.exercise1Id !== selectedExercise.exercise_id &&
            i.exercise2Id !== selectedExercise.exercise_id
          )
            continue;

          const timePassed1 =
            Date.now() - new Date(i.exercise1RestStart).getTime();
          const timePassed2 =
            Date.now() - new Date(i.exercise2RestStart).getTime();

          const exercise1 = workout.exercises.find(
            (exercise) => exercise.exercise_id === i.exercise1Id,
          );
          const exercise2 = workout.exercises.find(
            (exercise) => exercise.exercise_id === i.exercise2Id,
          );

          if (!exercise1 || !exercise2) continue;

          let setNumber1 = null;
          let setNumber2 = null;

          // Looking for the last completed set in each superset exercise
          for (let j = exercise1.sets.length - 1; j >= 0; j--) {
            if (exercise1.sets[j].done) {
              setNumber1 = exercise1.sets[j].set_number;
              break;
            }
          }

          for (let j = exercise2.sets.length - 1; j >= 0; j--) {
            if (exercise2.sets[j].done) {
              setNumber2 = exercise2.sets[j].set_number;
              break;
            }
          }
          if (setNumber1 && timePassed1) {
            updateSet(
              exercise1.exercise_id,
              setNumber1,
              "rest_seconds",
              Math.floor(timePassed1 / 1000),
            );
          }
          if (setNumber2 && timePassed2) {
            updateSet(
              exercise2.exercise_id,
              setNumber2,
              "rest_seconds",
              Math.floor(timePassed2 / 1000),
            );
          }

          // Checking which exercise we are currently on and showing that rest seconds on the bottom bar
          if (
            superset.some((e) => e.exercise1Id === selectedExercise.exercise_id)
          ) {
            if (timePassed1)
              setSelectedSet((prev) =>
                prev
                  ? {
                      ...prev,
                      rest_seconds: Math.floor(timePassed1 / 1000),
                    }
                  : null,
              );
          } else if (timePassed2)
            setSelectedSet((prev) =>
              prev
                ? {
                    ...prev,
                    rest_seconds: Math.floor(timePassed2 / 1000),
                  }
                : null,
            );
        }
      }
      // Not superset timer logic
      else {
        const timePassed = Date.now() - new Date(restStart).getTime();
        let setNumber = 0;
        let exerciseId = "";
        let completedSetFound = false;

        const exerciseIndex = selectedExercise.order_index - 1;

        for (let i = exerciseIndex; i >= 0 && !completedSetFound; i--) {
          const currentExercise = workout.exercises[i];
          const startingSetIndex =
            i === exerciseIndex
              ? selectedSet.set_number - 2
              : currentExercise.sets.length - 1;

          for (let j = startingSetIndex; j >= 0; j--) {
            const previousSet = currentExercise.sets[j];

            if (previousSet.done) {
              setNumber = previousSet.set_number;
              exerciseId = currentExercise.exercise_id;
              completedSetFound = true;
              break;
            }
          }
        }
        if (!setNumber || !exerciseId) return;

        updateSet(
          exerciseId,
          setNumber,
          "rest_seconds",
          Math.floor(timePassed / 1000),
        );
        setSelectedSet((prev) =>
          prev
            ? {
                ...prev,
                rest_seconds: Math.floor(timePassed / 1000),
              }
            : null,
        );
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
  }, [selectedExercise?.exercise_id, selectedSet?.set_number]);

  function addSet(exerciseId: string) {
    if (!setWorkout || pageType === "view") return;

    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.exercise_id === exerciseId
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
    if (selectedExercise?.exercise_id === exerciseId) {
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
        exercise.exercise_id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets
                .filter((set) => set.set_number !== setNumber)
                .map((set, index) => ({ ...set, set_number: index + 1 })),
            }
          : exercise,
      ),
    }));
    if (selectedExercise?.exercise_id === exerciseId) {
      const updatedExercise = selectedExercise
        ? {
            ...selectedExercise,
            sets: selectedExercise.sets
              .filter((set) => set.set_number !== setNumber)
              .map((set, index) => ({ ...set, set_number: index + 1 })),
          }
        : null;
      setSelectedExercise(updatedExercise);
      if (selectedSet?.set_number === setNumber)
        setSelectedSet(
          updatedExercise?.sets[updatedExercise?.sets.length - 1] ?? null,
        );
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
        exercise.exercise_id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.set_number === setNumber ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    }));
    if (
      selectedExercise?.exercise_id === exerciseId &&
      selectedSet?.set_number === setNumber
    ) {
      setSelectedSet((prev) => (prev ? { ...prev, [field]: value } : null));
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
      setWorkout((prev) => ({
        ...prev,
        exercises: prev.exercises.map((e) =>
          e.exercise_id === chosenExerciseId
            ? {
                id: createLocalId(),
                exercise_name: exercise.name,
                exercise_id: exercise.id,
                category: exercise.category,
                order_index: e.order_index,
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
              }
            : e,
        ),
      }));
      if (selectedExercise?.exercise_id === chosenExerciseId) {
        setSelectedExercise((prev) =>
          prev
            ? {
                id: createLocalId(),
                exercise_name: exercise.name,
                exercise_id: exercise.id,
                category: exercise.category,
                order_index: prev.order_index,
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
              }
            : null,
        );
      }
      if (
        superset?.some(
          (e) =>
            e.exercise0Id === chosenExerciseId ||
            e.exercise1Id === chosenExerciseId ||
            e.exercise2Id === chosenExerciseId,
        )
      ) {
        for (let i of superset) {
          if (i.exercise0Id === chosenExerciseId) {
            setSuperset((prev) =>
              prev
                ? prev.map((e) =>
                    e.exercise0Id === chosenExerciseId
                      ? {
                          ...e,
                          exercise0Id: exercise.id,
                        }
                      : e,
                  )
                : null,
            );
            break;
          } else if (i.exercise1Id === chosenExerciseId) {
            setSuperset((prev) =>
              prev
                ? prev.map((e) =>
                    e.exercise1Id === chosenExerciseId
                      ? {
                          ...e,
                          exercise1Id: exercise.id,
                          exercise1RestStart: "",
                        }
                      : e,
                  )
                : null,
            );
            break;
          } else if (i.exercise2Id === chosenExerciseId) {
            setSuperset((prev) =>
              prev
                ? prev.map((e) =>
                    e.exercise2Id === chosenExerciseId
                      ? {
                          ...e,
                          exercise2Id: exercise.id,
                          exercise2RestStart: "",
                        }
                      : e,
                  )
                : null,
            );
            break;
          }
        }
      }
    } else {
      setWorkout((prev) => ({
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            id: createLocalId(),
            exercise_name: exercise.name,
            exercise_id: exercise.id,
            category: exercise.category,
            order_index: prev.exercises.length + 1,
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
          },
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
          .filter((exercise) => exercise.exercise_id !== chosenExerciseId)
          .map((exercise, index) => ({ ...exercise, order_index: index + 1 })),
      ],
    }));
    setChosenExerciseId("");
    setShowRemoveExerciseModal(false);
  }

  function updateExerciseNote(exerciseId: string, note: string) {
    if (!setWorkout || pageType === "view") return;

    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.exercise_id === exerciseId
          ? { ...exercise, notes: note }
          : exercise,
      ),
    }));
  }

  return (
    <div className={styles.workoutFormContainer}>
      <div
        className={`${styles.exerciseContainer} ${pageType !== "view" ? styles.addTopMargin : ""}`}
      >
        {workout.exercises.map((exercise) => (
          <div className={styles.exerciseSpace} key={exercise.id}>
            <div
              className={`${styles.exerciseCard} ${exercise.id === selectedExercise?.id ? styles.selected : ""} ${superset?.some((e) => e.exercise1Id === exercise.exercise_id || e.exercise2Id === exercise.exercise_id) ? styles.superset : ""}`}
              id={exercise.id}
            >
              <div className={styles.exerciseCardHeader}>
                <h2 className={styles.exerciseName}>
                  {exercise.exercise_name}
                </h2>
                <div className="exerciseMenuWrapper">
                  {showExerciseOptions &&
                  chosenExerciseId === exercise.exercise_id ? (
                    <div ref={exerciseMenuRef} className="exerciseMenu">
                      {pageType !== "view" && (
                        <button
                          className={styles.editExerciseBtn}
                          onClick={() => {
                            setShowChooseExerciseModal(true);
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
                        }}
                      >
                        <History size={15} />
                        {t("common.history")}
                      </button>
                      {exercise.order_index < workout.exercises.length &&
                      pageType === "active" &&
                      !superset?.some(
                        (e) =>
                          e.exercise0Id === exercise.exercise_id ||
                          e.exercise1Id === exercise.exercise_id ||
                          e.exercise2Id === exercise.exercise_id,
                      ) ? (
                        <button
                          className={styles.addSupersetBtn}
                          onClick={() => {
                            setSuperset((prev) =>
                              prev
                                ? [
                                    ...prev,
                                    {
                                      exercise0Id:
                                        exercise.order_index > 1
                                          ? workout.exercises[
                                              exercise.order_index - 2
                                            ].exercise_id
                                          : "",
                                      exercise1Id: exercise.exercise_id,
                                      exercise2Id:
                                        workout.exercises[exercise.order_index]
                                          .exercise_id,
                                      exercise1RestStart: "",
                                      exercise2RestStart: "",
                                    },
                                  ]
                                : [
                                    {
                                      exercise0Id:
                                        exercise.order_index > 1
                                          ? workout.exercises[
                                              exercise.order_index - 2
                                            ].exercise_id
                                          : "",
                                      exercise1Id: exercise.exercise_id,
                                      exercise2Id:
                                        workout.exercises[exercise.order_index]
                                          .exercise_id,
                                      exercise1RestStart: "",
                                      exercise2RestStart: "",
                                    },
                                  ],
                            );
                          }}
                          aria-label={t("common.superset")}
                        >
                          <Repeat2 size={17} /> {t("common.superset")}
                        </button>
                      ) : (
                        pageType === "active" &&
                        superset?.some(
                          (e) =>
                            e.exercise1Id === exercise.exercise_id ||
                            e.exercise2Id === exercise.exercise_id,
                        ) && (
                          <button
                            className={styles.unlinkBtn}
                            onClick={() => {
                              setSuperset((prev) =>
                                prev
                                  ? prev.filter(
                                      (e) =>
                                        e.exercise1Id !== exercise.exercise_id,
                                    )
                                  : prev,
                              );
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
                        setChosenExerciseId(exercise.exercise_id);
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
                    previousData[exercise.exercise_id],
                  )}
                </p>
              )}
              {previousData?.[exercise.exercise_id]?.notes && (
                <p className={styles.exercisePrev}>
                  {t("workout.note.prev")}{" "}
                  {previousData[exercise.exercise_id].notes}
                </p>
              )}
              {showNotes[exercise.exercise_id] || exercise.notes ? (
                <input
                  className={styles.exerciseNote}
                  type="text"
                  maxLength={60}
                  placeholder={t("workout.note.placeHolder")}
                  readOnly={pageType === "view"}
                  value={exercise.notes}
                  onChange={(e) =>
                    updateExerciseNote(exercise.exercise_id, e.target.value)
                  }
                />
              ) : (
                pageType !== "view" && (
                  <button
                    className={styles.addNoteBtn}
                    onClick={() =>
                      setShowNotes((prev) => ({
                        ...prev,
                        [exercise.exercise_id]: true,
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
                      <th className={styles.actionsTitle}>
                        {t("workout.done")}
                      </th>
                      <th>{t("workout.rest")}</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {exercise.sets.map((set) => (
                      <tr
                        key={set.set_number}
                        className={`${styles.set} ${exercise.exercise_id === selectedExercise?.exercise_id && set.set_number === selectedSet?.set_number ? styles.selected : ""}`}
                        onClick={() => {
                          setSelectedExercise(exercise);
                          setSelectedSet(set);
                          let restTime = 0;
                          let completedSetFound = false;

                          const exerciseIndex = exercise.order_index - 1;

                          for (
                            let i = exerciseIndex;
                            i >= 0 && !completedSetFound;
                            i--
                          ) {
                            const currentExercise = workout.exercises[i];

                            const startingSetIndex =
                              i === exerciseIndex
                                ? set.set_number - 2
                                : currentExercise.sets.length - 1;

                            for (let j = startingSetIndex; j >= 0; j--) {
                              const previousSet = currentExercise.sets[j];

                              if (previousSet.done) {
                                restTime = previousSet.rest_seconds;
                                completedSetFound = true;
                                break;
                              }
                            }
                          }
                          setRestStart(
                            restTime > 0
                              ? new Date(
                                  Date.now() - restTime * 1000,
                                ).toISOString()
                              : new Date().toISOString(),
                          );
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
                              deleteSet(exercise.exercise_id, set.set_number);
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
                      onClick={() => addSet(exercise.exercise_id)}
                    >
                      {t("workout.addSet")}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {exercise.order_index < workout.exercises.length &&
              pageType === "active" &&
              superset?.some((e) => e.exercise1Id === exercise.exercise_id) && (
                <div ref={supersetMenuRef} className={styles.supersetDivider}>
                  <p className={`${styles.supersetBtn} ${styles.superset}`}>
                    {t("common.superset")}{" "}
                    {superset.findIndex(
                      (e) => e.exercise1Id === exercise.exercise_id,
                    ) + 1}
                  </p>

                  {showSupersetOptions &&
                  chosenExerciseId === exercise.exercise_id ? (
                    <div ref={supersetMenuRef} className={styles.supersetMenu}>
                      <button
                        className={`${styles.supersetBtn} ${styles.superset}`}
                        onClick={() => {
                          setSuperset((prev) =>
                            prev
                              ? prev.filter(
                                  (e) => e.exercise1Id !== exercise.exercise_id,
                                )
                              : prev,
                          );
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
                        setChosenExerciseId(exercise.exercise_id);
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
          <div className={styles.buttonContainer}>
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
                      selectedExercise.exercise_id,
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
                      selectedExercise.exercise_id,
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
                  <button
                    className={styles.completeSet}
                    hidden={selectedSet.done}
                    onClick={() => {
                      updateSet(
                        selectedExercise.exercise_id,
                        selectedSet.set_number,
                        "done",
                        true,
                      );
                      const nextExercise =
                        workout.exercises.find((exercise) =>
                          selectedExercise
                            ? selectedExercise?.order_index + 1 ===
                              exercise.order_index
                            : null,
                        ) ?? null;
                      const prevExercise =
                        workout.exercises.find((exercise) =>
                          selectedExercise
                            ? selectedExercise?.order_index - 1 ===
                              exercise.order_index
                            : null,
                        ) ?? null;
                      if (
                        superset &&
                        superset.some(
                          (e) =>
                            e.exercise1Id === selectedExercise.exercise_id ||
                            e.exercise2Id === selectedExercise.exercise_id,
                        )
                      ) {
                        for (let i of superset) {
                          if (i.exercise1Id === selectedExercise.exercise_id) {
                            if (
                              nextExercise &&
                              nextExercise.sets?.length < selectedSet.set_number
                            ) {
                              addSet(nextExercise.exercise_id);
                              setSelectedSet({
                                set_number: selectedSet.set_number,
                                weight:
                                  workout.exercises.find(
                                    (exercise) =>
                                      exercise.exercise_id ===
                                      nextExercise.exercise_id,
                                  )?.sets[nextExercise.sets.length - 1]
                                    .weight ?? 0,
                                reps: 0,
                                rest_seconds: 0,
                                done: false,
                              });
                            } else {
                              setSelectedSet(
                                nextExercise?.sets[
                                  selectedSet.set_number - 1
                                ] ?? null,
                              );
                            }
                            setSelectedExercise(nextExercise);
                            setSuperset((prev) =>
                              prev
                                ? [
                                    ...prev.map((e) =>
                                      e.exercise1Id ===
                                      selectedExercise.exercise_id
                                        ? {
                                            ...e,
                                            exercise1RestStart:
                                              new Date().toISOString(),
                                          }
                                        : e,
                                    ),
                                  ]
                                : prev,
                            );
                            break;
                          } else if (
                            i.exercise2Id === selectedExercise.exercise_id
                          ) {
                            if (
                              prevExercise &&
                              prevExercise.sets.length > selectedSet.set_number
                            ) {
                              setSelectedExercise(prevExercise);
                              setSelectedSet(
                                prevExercise?.sets[selectedSet.set_number] ??
                                  null,
                              );
                              setSuperset((prev) =>
                                prev
                                  ? [
                                      ...prev.map((e) =>
                                        e.exercise2Id ===
                                        selectedExercise.exercise_id
                                          ? {
                                              ...e,
                                              exercise2RestStart:
                                                new Date().toISOString(),
                                            }
                                          : e,
                                      ),
                                    ]
                                  : prev,
                              );
                              break;
                            } else {
                              setSelectedExercise(nextExercise);
                              setSelectedSet(nextExercise?.sets[0] ?? null);
                              setRestStart(new Date().toISOString());
                            }
                          }
                        }
                      } else {
                        setSelectedExercise(nextExercise);
                        setSelectedSet(nextExercise?.sets[0] ?? null);
                        setRestStart(new Date().toISOString());
                      }
                    }}
                  >
                    {t("workout.completeExercise")}
                  </button>
                ) : (
                  <button
                    className={styles.completeSet}
                    hidden={selectedSet.done}
                    onClick={() => {
                      updateSet(
                        selectedExercise.exercise_id,
                        selectedSet.set_number,
                        "done",
                        true,
                      );
                      if (
                        superset &&
                        superset.some(
                          (e) =>
                            e.exercise1Id === selectedExercise.exercise_id ||
                            e.exercise2Id === selectedExercise.exercise_id,
                        )
                      ) {
                        for (let i of superset) {
                          if (i.exercise1Id === selectedExercise.exercise_id) {
                            const nextExercise =
                              workout.exercises.find((exercise) =>
                                selectedExercise
                                  ? selectedExercise?.order_index + 1 ===
                                    exercise.order_index
                                  : null,
                              ) ?? null;
                            if (
                              nextExercise &&
                              nextExercise.sets?.length < selectedSet.set_number
                            ) {
                              addSet(nextExercise.exercise_id);
                              setSelectedSet({
                                set_number: selectedSet.set_number,
                                weight:
                                  workout.exercises.find(
                                    (exercise) =>
                                      exercise.exercise_id ===
                                      nextExercise.exercise_id,
                                  )?.sets[nextExercise.sets.length - 1]
                                    .weight ?? 0,
                                reps: 0,
                                rest_seconds: 0,
                                done: false,
                              });
                            } else {
                              setSelectedSet(
                                nextExercise?.sets[
                                  selectedSet.set_number - 1
                                ] ?? null,
                              );
                            }
                            setSelectedExercise(nextExercise);
                            setSuperset((prev) =>
                              prev
                                ? [
                                    ...prev.map((e) =>
                                      e.exercise1Id ===
                                      selectedExercise.exercise_id
                                        ? {
                                            ...e,
                                            exercise1RestStart:
                                              new Date().toISOString(),
                                          }
                                        : e,
                                    ),
                                  ]
                                : prev,
                            );
                            break;
                          }
                          if (i.exercise2Id === selectedExercise.exercise_id) {
                            const nextExercise =
                              workout.exercises.find((exercise) =>
                                selectedExercise
                                  ? selectedExercise?.order_index - 1 ===
                                    exercise.order_index
                                  : null,
                              ) ?? null;
                            if (
                              nextExercise &&
                              nextExercise.sets?.length <=
                                selectedSet.set_number
                            ) {
                              addSet(nextExercise.exercise_id);
                              setSelectedSet({
                                set_number: selectedSet.set_number + 1,
                                weight:
                                  workout.exercises.find(
                                    (exercise) =>
                                      exercise.exercise_id ===
                                      nextExercise.exercise_id,
                                  )?.sets[nextExercise.sets.length - 1]
                                    .weight ?? 0,
                                reps: 0,
                                rest_seconds: 0,
                                done: false,
                              });
                            } else {
                              setSelectedSet(
                                nextExercise?.sets[selectedSet.set_number] ??
                                  null,
                              );
                            }
                            setSelectedExercise(nextExercise);
                            setSuperset((prev) =>
                              prev
                                ? [
                                    ...prev.map((e) =>
                                      e.exercise2Id ===
                                      selectedExercise.exercise_id
                                        ? {
                                            ...e,
                                            exercise2RestStart:
                                              new Date().toISOString(),
                                          }
                                        : e,
                                    ),
                                  ]
                                : prev,
                            );
                            break;
                          }
                        }
                      } else {
                        setSelectedSet(
                          selectedExercise.sets[selectedSet.set_number] ?? null,
                        );
                        setRestStart(new Date().toISOString());
                      }
                    }}
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
