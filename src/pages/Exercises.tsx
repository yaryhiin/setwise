import { useState, useRef, useEffect } from "react";
import { EllipsisVertical, Pencil, Trash2, History } from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/Exercises.module.scss";

import type { ExerciseDB } from "../types/exercise";
import type { PreferredWeightUnit } from "../types/profile";

import LoadingScreen from "../components/LoadingScreen";
import ManageExerciseModal from "../components/ManageExerciseModal";
import ExecuteModal from "../components/ExecuteModal";
import InfoModal from "../components/InfoModal";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";

import {
  createExercise,
  getExercises,
  deleteExercise,
  updateExercise,
} from "../services/exercises";
import { getPersistedJSON } from "../services/storage";

import { useOutsideClick } from "../hooks/useOutsideClick";
import { useAsyncAction } from "../hooks/useAsyncAction";

type ExercisesProps = {
  preferredUnit: PreferredWeightUnit;
};

const EXERCISES_KEY = "exercises";

const Exercises = ({ preferredUnit }: ExercisesProps) => {
  const { t } = useTranslation();
  const { run, state } = useAsyncAction();

  const [exercises, setExercises] = useState<ExerciseDB[] | null>(
    getPersistedJSON(EXERCISES_KEY, null),
  );
  const [chosenExercise, setChosenExercise] = useState<ExerciseDB | null>(
    exercises?.[0] ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showExerciseInfoModal, setShowExerciseInfoModal] = useState(false);

  useEffect(() => {
    const savedExercises = localStorage.getItem(EXERCISES_KEY);
    if (savedExercises) {
      const parsedExercises = JSON.parse(savedExercises) as ExerciseDB[];
      if (parsedExercises && parsedExercises.length > 0) {
        setLoading(false);
        return;
      }
    }

    async function loadExercises() {
      setLoading(true);
      try {
        const exercisesData = await getExercises();
        if (exercisesData.length) {
          setExercises(exercisesData);
        }
      } catch (error) {
        console.error("Error fetching exercises:", error);
      } finally {
        setLoading(false);
      }
    }

    loadExercises();
  }, []);

  useEffect(() => {
    if (exercises)
      localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  }, [exercises]);

  useOutsideClick(menuRef, showOptions, () => setShowOptions(false));

  async function addExercise(name: string, category: string) {
    await run("saving", async () => {
      const createdExercise = await createExercise({ name, category });
      setExercises((prev) =>
        prev ? [...prev, createdExercise] : [createdExercise],
      );
    });
  }

  async function handleUpdateExercise(name: string, category: string) {
    await run("saving", async () => {
      if (!chosenExercise) return;
      const updatedExercise = await updateExercise(
        name,
        category,
        chosenExercise?.id,
      );
      setExercises((prev) =>
        prev
          ? prev.map((exercise) =>
              exercise.id === chosenExercise.id ? updatedExercise : exercise,
            )
          : null,
      );
    });
  }

  async function handleDeleteExercise(exercise: ExerciseDB) {
    await run("deleting", async () => {
      const deletedExercise = await deleteExercise(exercise.id);
      if (deletedExercise)
        setExercises((prev) =>
          prev ? prev.filter((ex) => ex.id != exercise.id) : null,
        );
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.exercisesContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("exercises.title")}</h1>
        {exercises && exercises.length > 0 ? (
          <p>{t("exercises.description")}</p>
        ) : (
          <div className="emptyState">
            <p>{t("exercises.emptyState")}</p>
          </div>
        )}
      </div>
      <div className={styles.buttonContainer}>
        <button
          className={styles.createExerciseBtn}
          onClick={() => setShowCreateModal(true)}
        >
          {t("exercises.create")}
        </button>
      </div>
      <div className={styles.exercisesList}>
        {exercises?.map((exercise) => (
          <div key={exercise.id} className={styles.exerciseElement}>
            <div className={styles.exerciseElementTop}>
              <div className={styles.exerciseElementHeader}>
                <h3>{exercise.name}</h3>
                <div className="exerciseMenuWrapper">
                  {showOptions && chosenExercise?.id === exercise.id ? (
                    <div ref={menuRef} className="exerciseMenu">
                      <button
                        className={styles.editExerciseBtn}
                        onClick={() => {
                          setShowEditModal(true);
                        }}
                      >
                        <Pencil size={15} />
                        {t("common.edit")}
                      </button>
                      <button
                        className={styles.deleteExerciseBtn}
                        onClick={() => {
                          setShowMessageModal(true);
                        }}
                      >
                        <Trash2 size={15} />
                        {t("common.delete")}
                      </button>
                      <button
                        className={styles.exerciseHistoryBtn}
                        onClick={() => {
                          setShowExerciseInfoModal(true);
                        }}
                      >
                        <History size={15} />
                        {t("common.history")}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="accessBtn"
                      onClick={() => {
                        setShowOptions(true);
                        setChosenExercise(exercise);
                      }}
                      aria-label="Exercise options"
                    >
                      <EllipsisVertical size={20} />
                    </button>
                  )}
                </div>
              </div>
              <p>{t(`categories.${exercise.category.toLowerCase()}`)}</p>
            </div>
          </div>
        ))}
      </div>
      {showExerciseInfoModal && chosenExercise && (
        <ExerciseHistoryModal
          exerciseId={chosenExercise.id}
          onClose={() => setShowExerciseInfoModal(false)}
          preferredUnit={preferredUnit ?? "kg"}
        />
      )}
      {showCreateModal && (
        <ManageExerciseModal
          onClose={() => setShowCreateModal(false)}
          onAddExercise={addExercise}
        />
      )}
      {showEditModal && chosenExercise && (
        <ManageExerciseModal
          onClose={() => setShowEditModal(false)}
          onAddExercise={handleUpdateExercise}
          exercise={chosenExercise}
        />
      )}
      {showMessageModal && chosenExercise && (
        <ExecuteModal
          text={t("modal.delete.exercise")}
          btnText={t("common.delete")}
          onClose={() => setShowMessageModal(false)}
          onDelete={() => {
            handleDeleteExercise(chosenExercise);
            setShowMessageModal(false);
          }}
        />
      )}
      <InfoModal state={state} />
    </div>
  );
};

export default Exercises;
