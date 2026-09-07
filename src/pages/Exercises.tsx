import { useState, useEffect, useRef } from "react";
import { EllipsisVertical, Pencil, Trash2, History } from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/Exercises.module.scss";

import type { ExerciseDB } from "../types/exercise";

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

type ExercisesProps = {
  preferredUnit: string;
};

const Exercises = ({ preferredUnit }: ExercisesProps) => {
  const { t } = useTranslation();

  const [exercises, setExercises] = useState<ExerciseDB[]>([]);
  const [chosenExercise, setChosenExercise] = useState<ExerciseDB>(
    exercises[0],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showExerciseInfoModal, setShowExerciseInfoModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const exercisesData = await getExercises();
      setExercises(exercisesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!showOptions) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }

    function handleScroll() {
      setShowOptions(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showOptions]);

  async function addExercise(name: string, category: string) {
    setSaving(true);
    try {
      await createExercise({ name, category });
      await loadData();
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

  async function handleUpdateExercise(name: string, category: string) {
    setSaving(true);
    try {
      await updateExercise(name, category, chosenExercise.id);
      await loadData();
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating exercise:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExercise(exercise: ExerciseDB) {
    setDeleting(true);
    try {
      await deleteExercise(exercise.id);
      setExercises((prev) => prev.filter((ex) => ex.id != exercise.id));
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.exercisesContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("exercises.title")}</h1>
        {exercises.length > 0 ? (
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
        {exercises.map((exercise) => (
          <div key={exercise.id} className={styles.exerciseElement}>
            <div className={styles.exerciseElementTop}>
              <div className={styles.exerciseElementHeader}>
                <h3>{exercise.name}</h3>
                <div className="exerciseMenuWrapper">
                  {showOptions && chosenExercise.id === exercise.id ? (
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
      {showExerciseInfoModal && (
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
      {showEditModal && (
        <ManageExerciseModal
          onClose={() => setShowEditModal(false)}
          onAddExercise={handleUpdateExercise}
          exercise={chosenExercise}
        />
      )}
      {showMessageModal && (
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
      {saving && <InfoModal type={"saving"} />}
      {deleting && <InfoModal type={"deleting"} />}
      {showErrorModal && <InfoModal type={"error"} />}
      {showSuccessModal && <InfoModal type={"success"} />}
    </div>
  );
};

export default Exercises;
