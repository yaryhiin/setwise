import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/Routines.module.scss";

import type { RoutineDB } from "../types/routine";

import ExecuteModal from "../components/ExecuteModal";
import InfoModal from "../components/InfoModal";
import LoadingScreen from "../components/LoadingScreen";

import { getRoutines, deleteRoutine } from "../services/routines";
import { getPersistedJSON } from "../services/storage";

import { useAsyncAction } from "../hooks/useAsyncAction";

const ROUTINES_KEY = "routines";

const Routines = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { run, state } = useAsyncAction();

  const [routines, setRoutines] = useState<RoutineDB[] | null>(
    getPersistedJSON(ROUTINES_KEY, null),
  );
  const [chosenRoutineId, setChosenRoutineId] = useState("");
  const [loading, setLoading] = useState(true);

  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    const savedRoutines = localStorage.getItem(ROUTINES_KEY);
    if (savedRoutines) {
      const parsedExercises = JSON.parse(savedRoutines) as RoutineDB[];
      if (parsedExercises.length > 0) {
        setLoading(false);
        return;
      }
    }

    async function loadRoutines() {
      setLoading(true);
      try {
        const exercisesData = await getRoutines();
        if (exercisesData.length) {
          setRoutines(exercisesData);
        }
      } catch (error) {
        console.error("Error fetching routines:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRoutines();
  }, []);

  useEffect(() => {
    if (routines) localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  }, [routines]);

  async function handleDeleteRoutine(id: string) {
    await run("deleting", async () => {
      const deletedRoutine = await deleteRoutine(id);
      if (deletedRoutine)
        setRoutines((prev) =>
          prev ? prev.filter((routine) => routine.id != id) : null,
        );
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.routinesContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("routine.title2")}</h1>
        {routines && routines.length > 0 ? (
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
        {routines?.map((routine) => (
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
      <InfoModal state={state} />
    </div>
  );
};

export default Routines;
