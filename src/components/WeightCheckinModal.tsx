import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/Modal.module.scss";

import type { WeightCheckinErrors } from "../types/errors";

import InfoModal from "../components/InfoModal";

import { createWeightLog, getLatestWeightLog } from "../services/weightLogs";
import { convertValueToBaseUnit, formatDate } from "../services/utils";

import { useAsyncAction } from "../hooks/useAsyncAction";

type WeightCheckinModalProps = {
  unit: "kg" | "lb";
  name: string;
  onSkip: () => void;
};

const WeightCheckinModal = ({
  unit,
  name,
  onSkip,
}: WeightCheckinModalProps) => {
  const { t } = useTranslation();
  const { run, state } = useAsyncAction();

  const [newWeight, setNewWeight] = useState("");
  const [errors, setErrors] = useState<WeightCheckinErrors>({
    weight: false,
  });
  const [previousData, setPreviousData] = useState({ date: "", weight: "" });

  useEffect(() => {
    async function getLatestData() {
      const latestData = await getLatestWeightLog();
      if (!latestData) return;
      setPreviousData({
        date: latestData.measured_at,
        weight: latestData.weight_kg,
      });
    }

    getLatestData();
  }, []);

  async function handleCreateWeightLog() {
    if (!newWeight) {
      setErrors({ weight: true });
      return;
    }

    const weight = Number(newWeight);
    const weightInKg = convertValueToBaseUnit(weight, unit);

    const success = await run("saving", async () => {
      await createWeightLog(weightInKg, new Date().toISOString());
    });
    if (success) {
      setTimeout(() => {
        onSkip();
      }, 1000);
    }
  }

  return (
    <div className="modal">
      <div className="modalContent">
        <h1 className="heading">{t("weightCheckin.title")}</h1>
        <div className={styles.message}>
          <p className={styles.messageContainer}>
            {new Date().getHours()
              ? t("home.greeting.morning")
              : new Date().getHours() < 18
                ? t("home.greeting.afternoon")
                : t("home.greeting.evening")}
            {", "}
            {name}
          </p>
          <p className={styles.message}>{t("weightCheckin.message")}</p>
        </div>
        {previousData && (
          <p className={styles.previous}>
            {unit === "lb"
              ? Math.round(Number(previousData.weight) * 2.20462262 * 10) / 10
              : previousData.weight}
            {t(`units.${unit}`)} - {formatDate(previousData.date)}
          </p>
        )}

        <div className={styles.weightContainer}>
          <p className={styles.inputLabel}>{t("weightCheckin.new")}</p>
          <div>
            <input
              className={`${styles.input} ${errors.weight && "error"}`}
              type="number"
              step="0.01"
              min="0"
              max="1000"
              onChange={(e) => setNewWeight(e.target.value)}
              value={newWeight}
            />
            {unit}
          </div>
          {errors.weight && (
            <p className={`errorMessage ${styles.fullWidth}`}>
              {t("weightCheckin.error")}
            </p>
          )}
        </div>
        <div className="buttonContainer">
          <button
            className={styles.continueBtn}
            onClick={handleCreateWeightLog}
          >
            {t("common.save")}
          </button>
          <button className={styles.skipBtn} onClick={onSkip}>
            {t("common.skipToday")}
          </button>
        </div>
      </div>
      <InfoModal state={state} />
    </div>
  );
};

export default WeightCheckinModal;
