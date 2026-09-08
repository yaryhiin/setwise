import { useState } from "react";
import cn from "classnames";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/Modal.module.scss";

import type { AddErrors } from "../types/errors";
import type { ExerciseDB } from "../types/exercise";

type CreateExerciseModalProps = {
  exercise?: ExerciseDB;
  onClose: () => void;
  onAddExercise: (name: string, category: string) => void;
};

const ManageExerciseModal = ({
  exercise,
  onClose,
  onAddExercise,
}: CreateExerciseModalProps) => {
  const { t } = useTranslation();

  const [newExerciseName, setNewExerciseName] = useState(exercise?.name || "");
  const [newExerciseCategory, setNewExerciseCategory] = useState(
    exercise?.category || "",
  );
  const categories = [
    "Chest",
    "Back",
    "Legs",
    "Shoulders",
    "Arms",
    "Core",
    "Cardio",
    "Other",
  ];
  const [errors, setErrors] = useState<AddErrors>({
    name: false,
    category: false,
  });

  function handleSubmit() {
    const newErrors = { name: false, category: false };
    if (!newExerciseName.trim()) newErrors.name = true;
    if (!newExerciseCategory.trim()) newErrors.category = true;
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }
    onAddExercise(newExerciseName, newExerciseCategory);
    onClose();
  }

  return (
    <div className="modal">
      <div className="modalContent">
        <h2 className="heading">
          {exercise ? t("manageExercise.edit") : t("manageExercise.create")}
        </h2>
        <div className={styles.inputNameContainer}>
          <input
            className={cn(styles.input, errors.name && "error")}
            type="text"
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            placeholder={t("manageExercise.placeHolder")}
          />
          {errors.name && (
            <p className="errorMessage">{t("manageExercise.error.name")}</p>
          )}
        </div>
        <div className={styles.categoryContainer}>
          <h2 className={styles.label}>{t("manageExercise.category")}</h2>
          <div className={styles.categories}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={cn(
                  styles.categoryBtn,
                  newExerciseCategory === category && "active",
                  errors.category && "error",
                )}
                onClick={() => setNewExerciseCategory(category)}
              >
                {t(`categories.${category.toLowerCase()}`)}
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="errorMessage">{t("manageExercise.error.category")}</p>
          )}
        </div>
        <div className="buttonContainer">
          <button
            className={cn(styles.addBtn, "button")}
            onClick={handleSubmit}
          >
            {t("common.save")}
          </button>
          <button className={cn(styles.backBtn, "button")} onClick={onClose}>
            {t("common.back")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageExerciseModal;
