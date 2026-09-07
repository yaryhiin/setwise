import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";

import { useTranslation } from "react-i18next";

import styles from "../styles/modules/Routines.module.scss";

import type { RoutineDB } from "../types/routine";

import ExecuteModal from "../components/ExecuteModal";
import InfoModal from "../components/InfoModal";

import { getRoutines, deleteRoutine } from "../services/routines";

const Routines = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [routines, setRoutines] = useState<RoutineDB[]>([]);
  const [chosenRoutineId, setChosenRoutineId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const routinesData = await getRoutines();
      setRoutines(routinesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRoutine(id: string) {
    setDeleting(true);
    try {
      await deleteRoutine(id);
      setRoutines((prev) => prev.filter((routine) => routine.id != id));
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
    } catch (error) {
      console.error("Error deleting routine:", error);
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
    <div className={styles.routinesContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("routine.title2")}</h1>
        {routines.length > 0 ? (
          <p>{t("routine.description")}</p>
        ) : (
          <div className="emptyState">
            <p>{t("routine.emptyState")}</p>
          </div>
        )}
      </div>
      <div className={styles.buttonContainer}>
        <button
          className={styles.createRoutineBtn}
          onClick={() => navigate("/routines/new")}
        >
          {t("routine.create")}
        </button>
      </div>
      <div className={styles.routinesList}>
        {routines.map((routine) => (
          <div key={routine.id} className={styles.routineElement}>
            <div className={styles.routineElementTop}>
              <h3>{routine.name}</h3>
              <p>{routine.exercises_count} Exercises</p>
              <p>{routine.categories.join(" • ")}</p>
            </div>
            <div className={styles.routineElementButtons}>
              <button
                className={styles.startRoutineBtn}
                onClick={() => navigate(`/workout/routine/${routine.id}`)}
              >
                {t("common.start")}
              </button>
              <button
                className={styles.editRoutineBtn}
                onClick={() => navigate(`/routines/${routine.id}/edit`)}
              >
                {t("common.edit")}
              </button>
              <button
                className={styles.deleteRoutineBtn}
                onClick={() => {
                  setShowMessageModal(true);
                  setChosenRoutineId(routine.id);
                }}
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
      {showMessageModal && (
        <ExecuteModal
          text={t("modal.delete.routine")}
          btnText={t("common.delete")}
          onClose={() => setShowMessageModal(false)}
          onDelete={() => {
            handleDeleteRoutine(chosenRoutineId);
            setShowMessageModal(false);
          }}
        />
      )}
      {deleting && <InfoModal type={"deleting"} />}
      {showErrorModal && <InfoModal type={"error"} />}
      {showSuccessModal && <InfoModal type={"success"} />}
    </div>
  );
};

export default Routines;
