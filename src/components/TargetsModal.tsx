import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";

import styles from "../styles/modules/TargetsModal.module.scss";
import type { Targets } from "../types/routine";

type TargetsModalProps = {
  targets: Targets;
  exerciseName: string;
  onClose: () => void;
  onSave: (newTargets: Targets) => void;
};

const TargetsModal = ({
  targets,
  exerciseName,
  onClose,
  onSave,
}: TargetsModalProps) => {
  const { t } = useTranslation();

  const [errors, setErrors] = useState({ sets: false, reps: false });

  const [newTargets, setNewTargets] = useState(targets);

  function handleSave() {
    const newErrors = { sets: false, reps: false };
    if (newTargets.sets && (newTargets.sets < 1 || newTargets.sets > 50)) {
      newErrors.sets = true;
    }
    if (
      (newTargets.min_reps && !newTargets.max_reps) ||
      (!newTargets.min_reps && newTargets.max_reps) ||
      newTargets.min_reps < 0 ||
      newTargets.max_reps < 0 ||
      (newTargets.min_reps > 0 && newTargets.max_reps <= newTargets.min_reps)
    ) {
      newErrors.reps = true;
    }

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    onSave(newTargets);
  }
  return (
    <div className="modal">
      <div className="modalContent">
        <div className={styles.header}>
          <h2 className="heading">{t("targetsModal.title")}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X />
          </button>
        </div>
        <div className={styles.body}>
          <h3 className={styles.exerciseName}>{exerciseName}</h3>
          <div className={styles.sets}>
            <p className={styles.title}>{t("targetsModal.sets")}</p>
            <div className={styles.adjustment}>
              <button
                disabled={newTargets.sets <= 0}
                className={styles.decrement}
                onClick={() =>
                  setNewTargets((prev) => ({ ...prev, sets: prev.sets - 1 }))
                }
              >
                <Minus size={15} strokeWidth={3} />
              </button>
              <p>{newTargets.sets}</p>
              <button
                className={styles.increment}
                onClick={() =>
                  setNewTargets((prev) => ({ ...prev, sets: prev.sets + 1 }))
                }
              >
                <Plus size={15} strokeWidth={3} />
              </button>
            </div>
            {errors.sets && (
              <p className="errorMessage">{t("targetsModal.error.sets")}</p>
            )}
          </div>
          <div className={styles.reps}>
            <p className={styles.title}>{t("targetsModal.range")}</p>
            <div className={styles.rangeInput}>
              <div>
                <label htmlFor="min_reps">{t("targetsModal.min")}</label>
                <input
                  className={`${errors.reps ? "error" : ""}`}
                  type="number"
                  min="0"
                  max={newTargets.max_reps}
                  id="min_reps"
                  placeholder="0"
                  value={newTargets.min_reps === 0 ? "" : newTargets.min_reps}
                  onChange={(e) => {
                    setNewTargets((prev) => ({
                      ...prev,
                      min_reps: Number(e.target.value),
                    }));
                  }}
                />
              </div>
              <div>
                <label htmlFor="max_reps">{t("targetsModal.max")}</label>
                <input
                  className={`${errors.reps ? "error" : ""}`}
                  type="number"
                  min={newTargets.min_reps}
                  max="100"
                  id="max_reps"
                  placeholder="0"
                  value={newTargets.max_reps === 0 ? "" : newTargets.max_reps}
                  onChange={(e) => {
                    setNewTargets((prev) => ({
                      ...prev,
                      max_reps: Number(e.target.value),
                    }));
                  }}
                />
              </div>
            </div>
            {errors.reps && (
              <p className="errorMessage">{t("targetsModal.error.reps")}</p>
            )}
          </div>
          <p className={styles.preview}>
            {newTargets.sets} {t("targetsModal.sets")} x {newTargets.min_reps}-
            {newTargets.max_reps} {t("workout.reps")}
          </p>
        </div>
        <button className={styles.saveBtn} onClick={handleSave}>
          {t("targetsModal.save")}
        </button>
      </div>
    </div>
  );
};

export default TargetsModal;
