import cn from "classnames";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ChooseExerciseModal.module.scss";

import type { ExerciseDB } from "../types/exercise";

import CreateExerciseModal from "./ManageExerciseModal";

type ChooseExerciseModalProps = {
  initialSelectedExerciseId?: string;
  exercises: ExerciseDB[];
  existingExercises: Set<string>;
  onClose: () => void;
  addExercise: (name: string, category: string) => void;
  chooseExercise: (exercise: ExerciseDB) => void;
};

const ChooseExerciseModal = ({
  initialSelectedExerciseId,
  exercises,
  existingExercises,
  onClose,
  addExercise,
  chooseExercise,
}: ChooseExerciseModalProps) => {
  const categories = [
    ...new Set(exercises.map((exercise) => exercise.category)),
  ];
  const { t } = useTranslation();
  const [chosenExerciseCategory, setChosenExerciseCategory] = useState("");
  const [chosenExercise, setChosenExercise] = useState<ExerciseDB>();
  const availableExercises = exercises.filter(
    (exercise) => !existingExercises.has(exercise.id),
  );

  // If user is replacing exercise, show the exercise that is being replaced as selected
  useEffect(() => {
    if (!initialSelectedExerciseId) return;
    setChosenExercise(
      exercises.find((exercise) => exercise.id === initialSelectedExerciseId),
    );
  }, [initialSelectedExerciseId]);

  const [showModal, setShowModal] = useState(false);
  return (
    <div className="modal">
      <div className="modalContent">
        <h2 className="heading">
          {initialSelectedExerciseId
            ? t("chooseExercise.replace")
            : t("chooseExercise.choose")}
        </h2>
        <div className={styles.categoryContainer}>
          <p>{t("chooseExercise.filter")}</p>
          <div className={styles.categories}>
            <button
              type="button"
              className={`${styles.categoryBtn} ${chosenExerciseCategory === "" && "active"}`}
              onClick={() => setChosenExerciseCategory("")}
            >
              {t("frequency.all")}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.categoryBtn} ${chosenExerciseCategory === category ? "active" : ""}`}
                onClick={() => setChosenExerciseCategory(category)}
              >
                {t(`categories.${category.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.exerciseContainer}>
          <div className={styles.exerciseList}>
            {availableExercises.length === 0 ? (
              <p>{t("chooseExercise.emptyState")}</p>
            ) : (
              availableExercises
                .filter((exercise) => {
                  if (chosenExerciseCategory === "") return true;
                  return exercise.category === chosenExerciseCategory;
                })
                .map((exercise) => (
                  <button
                    type="button"
                    key={exercise.id}
                    className={cn(
                      styles.exerciseElement,
                      chosenExercise?.id === exercise.id && styles.selected,
                    )}
                    onClick={() => setChosenExercise(exercise)}
                  >
                    <span>{exercise.name}</span>{" "}
                    <span className={styles.exerciseCategory}>
                      {t(`categories.${exercise.category.toLowerCase()}`)}
                    </span>
                  </button>
                ))
            )}
          </div>
          <div className={styles.hint}>
            <p className={styles.hint}>{t("chooseExercise.selected")}</p>
            <p
              className={
                chosenExercise
                  ? styles.selectedExerciseName
                  : styles.selectedExerciseEmpty
              }
            >
              {chosenExercise
                ? chosenExercise.name
                : t("chooseExercise.selectedEmpty")}
            </p>
          </div>
        </div>
        <button
          className={styles.createExerciseBtn}
          onClick={() => setShowModal(true)}
        >
          {t("chooseExercise.create")}
        </button>
        <div className="buttonContainer">
          <button
            className={cn(styles.addBtn, "button")}
            onClick={() => {
              if (chosenExercise) chooseExercise(chosenExercise);
            }}
          >
            {initialSelectedExerciseId ? t("common.replace") : t("common.add")}
          </button>
          <button className={cn(styles.backBtn, "button")} onClick={onClose}>
            {t("common.back")}
          </button>
        </div>
        {showModal && (
          <CreateExerciseModal
            onClose={() => setShowModal(false)}
            onAddExercise={addExercise}
          />
        )}
      </div>
    </div>
  );
};

export default ChooseExerciseModal;
