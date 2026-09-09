import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import cn from "classnames";
import {
  EllipsisVertical,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/RoutineBuilder.module.scss";

import type { Routine, RoutineDraft } from "../types/routine";
import type { ExerciseDB } from "../types/exercise";
import type { RoutineErrors } from "../types/errors";

import LoadingScreen from "../components/LoadingScreen";
import ExecuteModal from "../components/ExecuteModal";
import ChooseExerciseModal from "../components/ChooseExerciseModal";
import InfoModal from "../components/InfoModal";

import {
  getRoutineDetails,
  createRoutine,
  updateRoutine,
} from "../services/routines";
import { getExercises, createExercise } from "../services/exercises";
import { getPersistedJSON } from "../services/storage";

import { useOutsideClick } from "../hooks/useOutsideClick";
import { useAsyncAction } from "../hooks/useAsyncAction";

const EXERCISES_KEY = "exercises";

const RoutineBuilder = () => {
  const navigate = useNavigate();
  const { routineId } = useParams();
  const { t } = useTranslation();
  const { run, state } = useAsyncAction();

  const draftKey = routineId ? `routineDraft:${routineId}` : "routineDraft:new";

  const [routineDraft, setRoutineDraft] = useState<RoutineDraft>(
    getPersistedJSON(draftKey, {
      name: "",
      exercises: [],
    }),
  );
  const [exercises, setExercises] = useState<ExerciseDB[] | null>(
    getPersistedJSON(EXERCISES_KEY, null),
  );
  const [chosenExerciseId, setChosenExerciseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<RoutineErrors>({
    name: false,
    exercises: false,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChooseExerciseModal, setShowChooseExerciseModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);

  useEffect(() => {
    const savedRoutine = localStorage.getItem(draftKey);
    if (savedRoutine) {
      setLoading(false);
      return;
    }
    if (!routineId) {
      setLoading(false);
      return;
    }
    async function getDetails() {
      setLoading(true);
      try {
        const routine = await getRoutineDetails(String(routineId));
        if (!routine) return;
        setRoutineDraft({
          name: routine.name,
          exercises: [...routine.routine_exercises]
            .sort((a, b) => a.order_index - b.order_index)
            .map((item) => ({
              exercise_id: item.exercise_id,
              exercise_name: item.exercises.name,
              category: item.exercises.category,
              order_index: item.order_index,
            })),
        });
      } catch (error) {
        console.error("Error loading data: ", error);
      } finally {
        setLoading(false);
      }
    }

    getDetails();
  }, [routineId]);

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
    if (routineDraft)
      localStorage.setItem(draftKey, JSON.stringify(routineDraft));
  }, [routineDraft]);

  useEffect(() => {
    if (exercises)
      localStorage.setItme(EXERCISES_KEY, JSON.stringify(exercises));
  });

  useOutsideClick(menuRef, showOptions, () => setShowOptions(false));

  async function addRoutine(routine: Routine) {
    const newErrors = { name: false, exercises: false };
    if (!routineDraft.name.trim()) newErrors.name = true;
    if (routineDraft.exercises.length === 0) newErrors.exercises = true;
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }
    const success = await run("saving", async () => {
      await createRoutine(routine);
    });
    if (success) {
      localStorage.removeItem(draftKey);
      setTimeout(() => {
        navigate("/routines");
      }, 1000);
    }
  }

  async function handleUpdateRoutine(routine: Routine, routineId: string) {
    const newErrors = { name: false, exercises: false };
    if (!routineDraft.name.trim()) newErrors.name = true;
    if (routineDraft.exercises.length === 0) newErrors.exercises = true;
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }
    const success = await run("saving", async () => {
      await updateRoutine(routine, routineId);
    });
    if (success) {
      localStorage.removeItem(draftKey);
      setTimeout(() => {
        navigate("/routines");
      }, 1000);
    }
  }

  async function addExercise(name: string, category: string) {
    await run("saving", async () => {
      const createdExercise = await createExercise({ name, category });
      if (createExercise)
        setExercises((prev) =>
          prev ? [...prev, createdExercise] : [createExercise],
        );
    });
  }

  function chooseExercise(exercise: ExerciseDB) {
    if (chosenExerciseId != "") {
      setRoutineDraft((prev) => ({
        ...prev,
        exercises: prev.exercises.map((e) =>
          e.exercise_id === chosenExerciseId
            ? {
                exercise_id: exercise.id,
                exercise_name: exercise.name,
                category: exercise.category,
                order_index: e.order_index,
              }
            : e,
        ),
      }));
    } else {
      setRoutineDraft((prev) => ({
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            category: exercise.category,
            order_index: prev.exercises.length + 1,
          },
        ],
      }));
    }
    setChosenExerciseId("");
    setShowChooseExerciseModal(false);
  }

  function deleteExercise() {
    setRoutineDraft((prev) => ({
      ...prev,
      exercises: prev.exercises
        .filter((exercise) => exercise.exercise_id !== chosenExerciseId)
        .map((exercise, index) => ({ ...exercise, order_index: index + 1 })),
    }));
    setChosenExerciseId("");
    setShowDeleteModal(false);
  }

  function moveExercise(exerciseId: string, direction: "up" | "down") {
    setRoutineDraft((prev) => {
      const currentIndex = prev.exercises.findIndex(
        (exercise) => exercise.exercise_id === exerciseId,
      );

      if (currentIndex === -1) return prev;

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= prev.exercises.length) {
        return prev;
      }

      const updatedExercises = [...prev.exercises];

      const temp = updatedExercises[currentIndex];
      updatedExercises[currentIndex] = updatedExercises[targetIndex];
      updatedExercises[targetIndex] = temp;

      const reorderedExercises = updatedExercises.map((exercise, index) => ({
        ...exercise,
        order_index: index + 1,
      }));

      return {
        ...prev,
        exercises: reorderedExercises,
      };
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.routineBuilderContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("routine.title")}</h2>
        <div className={styles.input}>
          <input
            className={cn(styles.input, errors.name && "error")}
            type="text"
            value={routineDraft.name}
            onChange={(e) =>
              setRoutineDraft((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={t("routine.placeHolder")}
          />
          {errors.name && (
            <p className="errorMessage">{t("routine.error.name")}</p>
          )}
        </div>
      </div>
      <div className={styles.selectedExercisesList}>
        {routineDraft.exercises.map((exercise) => (
          <div
            key={exercise.exercise_id}
            className={styles.selectedExerciseElement}
          >
            <div className={styles.orderButtons}>
              <button
                className={styles.orderBtn}
                onClick={() => moveExercise(exercise.exercise_id, "up")}
                hidden={exercise.order_index === 1}
                aria-label="Move exercise up"
              >
                <ChevronUp size={17} strokeWidth={2} />
              </button>
              <button
                className={styles.orderBtn}
                onClick={() => moveExercise(exercise.exercise_id, "down")}
                hidden={exercise.order_index === routineDraft.exercises.length}
                aria-label="Move exercise down"
              >
                <ChevronDown size={17} strokeWidth={2} />
              </button>
            </div>
            <div className={styles.selectedExerciseElementTop}>
              <div className={styles.exerciseElementHeader}>
                <h3>{exercise.exercise_name}</h3>
                <div className="exerciseMenuWrapper">
                  {showOptions && chosenExerciseId === exercise.exercise_id ? (
                    <div ref={menuRef} className="exerciseMenu">
                      <button
                        className={styles.editExerciseBtn}
                        onClick={() => {
                          setShowChooseExerciseModal(true);
                          setChosenExerciseId(exercise.exercise_id);
                        }}
                      >
                        <Pencil size={15} />
                        {t("common.replace")}
                      </button>
                      <button
                        className={styles.deleteExerciseBtn}
                        onClick={() => {
                          setShowDeleteModal(true);
                          setChosenExerciseId(exercise.exercise_id);
                        }}
                      >
                        <Trash2 size={15} />
                        {t("common.delete")}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="accessBtn"
                      onClick={() => {
                        setShowOptions(true);
                        setChosenExerciseId(exercise.exercise_id);
                      }}
                      aria-label="Exercise options"
                    >
                      <EllipsisVertical size={20} />
                    </button>
                  )}
                </div>
              </div>
              <p>{exercise.category}</p>
            </div>
          </div>
        ))}
        <button
          className={cn(styles.addExerciseBtn, errors.exercises && "error")}
          onClick={() => setShowChooseExerciseModal(true)}
        >
          {t("routine.add")}
        </button>
        {errors.exercises && (
          <p className="errorMessage">{t("routine.error.exercise")}</p>
        )}
      </div>

      <div className="buttonContainer">
        <button
          className={styles.saveRoutine}
          onClick={() => {
            const routineToSave = {
              name: routineDraft.name,
              exercises: routineDraft.exercises.map((exercise) => ({
                exercise_id: exercise.exercise_id,
                order_index: exercise.order_index,
              })),
              exercises_count: routineDraft.exercises.length,
              categories: [
                ...new Set(
                  routineDraft.exercises.map((exercise) => exercise.category),
                ),
              ],
            };
            if (routineId) {
              handleUpdateRoutine(routineToSave, routineId);
            } else {
              addRoutine(routineToSave);
            }
          }}
        >
          {t("common.save")}
        </button>
        <button
          className={styles.backBtn}
          onClick={() => setShowBackModal(true)}
        >
          {t("common.back")}
        </button>
      </div>
      {showDeleteModal && (
        <ExecuteModal
          text={t("modal.delete.routineBuilder")}
          btnText={t("common.delete")}
          onClose={() => {
            setChosenExerciseId("");
            setShowDeleteModal(false);
          }}
          onDelete={deleteExercise}
        />
      )}
      {showChooseExerciseModal && exercises && (
        <ChooseExerciseModal
          initialSelectedExerciseId={chosenExerciseId}
          exercises={exercises}
          existingExercises={
            new Set(
              routineDraft.exercises.map((exercise) => exercise.exercise_id),
            )
          }
          onClose={() => {
            setChosenExerciseId("");
            setShowChooseExerciseModal(false);
          }}
          addExercise={addExercise}
          chooseExercise={chooseExercise}
        />
      )}
      {showBackModal && (
        <ExecuteModal
          text={t("modal.back")}
          btnText={t("common.exit")}
          onClose={() => setShowBackModal(false)}
          onDelete={() => {
            setShowBackModal(false);
            localStorage.removeItem(draftKey);
            navigate("/routines");
          }}
        />
      )}
      <InfoModal state={state} />
    </div>
  );
};

export default RoutineBuilder;
