import { useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ProfileSetupModal.module.scss";

import type { Dispatch, SetStateAction } from "react";
import type {
  PreferredWeightUnit,
  PreferredMeasurementUnit,
} from "../types/profile";

import InfoModal from "../components/InfoModal";

import { useAsyncAction } from "../hooks/useAsyncAction";

type ProfileSetupModal = {
  onCreate: (
    name: string,
    preferedWeightUnit: PreferredWeightUnit,
    preferredWorkoutUnit: PreferredWeightUnit,
    prefferedMeasurementUnit: PreferredMeasurementUnit,
  ) => void;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
};

const ProfileSetupModal = ({
  onCreate,
  language,
  setLanguage,
}: ProfileSetupModal) => {
  const { t, i18n } = useTranslation();
  const { run, state } = useAsyncAction();

  const [name, setName] = useState("");
  const [preferredWeightUnit, setPreferredWeightUnit] =
    useState<PreferredWeightUnit>("kg");
  const [preferredWorkoutUnit, setPreferredWorkoutUnit] =
    useState<PreferredWeightUnit>("kg");
  const [preferredMeasurementUnit, setPreferredMeasurementUnit] =
    useState<PreferredMeasurementUnit>("cm");

  async function onSubmit() {
    await run("saving", async () => {
      onCreate(
        name,
        preferredWeightUnit,
        preferredWorkoutUnit,
        preferredMeasurementUnit,
      );
    });
  }

  return (
    <div className="modal">
      <div className={styles.modalContent}>
        <h2 className={styles.heading}>{t("profile.welcome")}</h2>
        <p className={styles.message}>{t("profile.setup")}</p>
        <div className={styles.inputContainer}>
          <p className={styles.inputLabel}>{t("profile.name.title")}:</p>
          <input
            className={styles.input}
            type="text"
            placeholder={t("profile.name.placeHolder")}
            onChange={(e) => setName(e.target.value.trim())}
            value={name}
          />
        </div>
        <div className={styles.inputContainer}>
          <p className={styles.inputLabel}>{t("profile.preferences.weight")}</p>
          <div className="toggle">
            <button
              type="button"
              className={preferredWeightUnit === "kg" ? "active" : ""}
              onClick={() => setPreferredWeightUnit("kg")}
            >
              {t("units.kg")}
            </button>

            <button
              type="button"
              className={preferredWeightUnit === "lb" ? "active" : ""}
              onClick={() => setPreferredWeightUnit("lb")}
            >
              {t("units.lb")}
            </button>
          </div>
        </div>
        <div className={styles.inputContainer}>
          <p className={styles.inputLabel}>
            {t("profile.preferences.measurements")}
          </p>
          <div className="toggle">
            <button
              type="button"
              className={preferredMeasurementUnit === "cm" ? "active" : ""}
              onClick={() => setPreferredMeasurementUnit("cm")}
            >
              {t("units.cm")}
            </button>

            <button
              type="button"
              className={preferredMeasurementUnit === "in" ? "active" : ""}
              onClick={() => setPreferredMeasurementUnit("in")}
            >
              {t("units.in")}
            </button>
          </div>
        </div>
        <div className={styles.inputContainer}>
          <p className={styles.inputLabel}>
            {t("profile.preferences.workout")}
          </p>
          <div className="toggle">
            <button
              type="button"
              className={preferredWorkoutUnit === "kg" ? "active" : ""}
              onClick={() => setPreferredWorkoutUnit("kg")}
            >
              {t("units.kg")}
            </button>

            <button
              type="button"
              className={preferredWorkoutUnit === "lb" ? "active" : ""}
              onClick={() => setPreferredWorkoutUnit("lb")}
            >
              {t("units.lb")}
            </button>
          </div>
        </div>
        <div className={styles.inputContainer}>
          <p className={styles.inputLabel}>{t("language.title")}</p>
          <select
            value={language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              setLanguage(e.target.value);
            }}
            className={styles.langaugeSelect}
          >
            <option value="en">{t("language.en")}</option>
            <option value="uk">{t("language.uk")}</option>
            <option value="es">{t("language.es")}</option>
            <option value="ru">{t("language.ru")}</option>
          </select>
        </div>
        <div className="buttonContainer">
          <button className={styles.skipBtn} onClick={onSubmit}>
            {t("common.skipNow")}
          </button>
          <button className={styles.continueBtn} onClick={onSubmit}>
            {t("common.continue")}
          </button>
        </div>
      </div>
      <InfoModal state={state} />
    </div>
  );
};

export default ProfileSetupModal;
