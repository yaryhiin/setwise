import cn from "classnames";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ChooseExerciseModal.module.scss";

import type {
  ExerciseCategory,
  ExerciseDB,
  ExerciseCategoryGroup,
} from "../types/exercise";

import CreateExerciseModal from "./ManageExerciseModal";
import { categoryGroups } from "../services/defaults";

type ChooseExerciseModalProps = {
  initialSelectedExerciseId?: string;
  availableExercises: ExerciseDB[];
  onClose: () => void;
  addExercise: (name: string, category: ExerciseCategory) => void;
  chooseExercise: (exercise: ExerciseDB) => void;
};

const ChooseExerciseModal = ({
  initialSelectedExerciseId,
  availableExercises,
  onClose,
  addExercise,
  chooseExercise,
}: ChooseExerciseModalProps) => {
  const filteredCategories: ExerciseCategoryGroup[] = (
    Object.keys(categoryGroups) as ExerciseCategoryGroup[]
  ).filter((key) =>
    availableExercises.some((e) => categoryGroups[key].includes(e.category)),
  );
  const { t } = useTranslation();
  const [chosenExerciseCategory, setChosenExerciseCategory] = useState<
    ExerciseCategoryGroup | ""
  >("");
  const [chosenExercise, setChosenExercise] = useState<ExerciseDB>();
  const [query, setQuery] = useState("");
  const filteredExercises = availableExercises
    ? availableExercises
        .filter((exercise) => {
          if (chosenExerciseCategory === "") return true;
          return categoryGroups[chosenExerciseCategory].includes(
            exercise.category,
          );
        })
        .filter((exercise) => {
          if (query === "") return true;
          return exercise.name
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase());
        })
    : null;

  // If user is replacing exercise, show the exercise that is being replaced as selected
  useEffect(() => {
    if (!initialSelectedExerciseId) return;
    setChosenExercise(
      availableExercises.find(
        (exercise) => exercise.id === initialSelectedExerciseId,
      ),
    );
  }, [initialSelectedExerciseId]);

  const [showModal, setShowModal] = useState(false);
  return (
    <div className="modal">
      <div className="modalContent">
        <h2 className={styles.heading}>
          {initialSelectedExerciseId
            ? t("chooseExercise.replace")
            : t("chooseExercise.choose")}
        </h2>
        <input
          type="search"
          value={query}
          className={styles.search}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("chooseExercise.search")}
          aria-label={t("chooseExercise.search")}
        />
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
            {filteredCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.categoryBtn} ${chosenExerciseCategory === category ? "active" : ""}`}
                onClick={() => setChosenExerciseCategory(category)}
              >
                {t(`categories.${category}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.exerciseContainer}>
          <div className={styles.exerciseList}>
            {filteredExercises && filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => (
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
            ) : (
              <p>{t("chooseExercise.emptySearch")}</p>
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
