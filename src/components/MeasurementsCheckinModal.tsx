import { useEffect, useState } from "react";
import LoadingScreen from "./LoadingScreen";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/Modal.module.scss";

import type { MeasurementTypeDB } from "../types/measurements";

import ExecuteModal from "./ExecuteModal";
import InfoModal from "../components/InfoModal";

import {
  createMeasurementType,
  archiveMeasurementType,
  getMeasurementTypes,
  createMeasurementLog,
} from "../services/measurements";
import { convertValueToBaseUnit } from "../services/utils";

import { useAsyncAction } from "../hooks/useAsyncAction";

type MeasurementsCheckinModalProps = {
  unit: "cm" | "in";
  name: string;
  onSkip: () => void;
};

type NewLog = {
  measurement_type_id: string;
  value_cm: string;
};

const MeasurementsCheckinModal = ({
  unit,
  name,
  onSkip,
}: MeasurementsCheckinModalProps) => {
  const { t } = useTranslation();
  const { run, state } = useAsyncAction();

  const [measurementTypes, setMeasurementTypes] = useState<
    MeasurementTypeDB[] | null
  >(null);
  const [newMeasurementData, setNewMeasurementData] = useState<NewLog[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chosenType, setChosenType] = useState<MeasurementTypeDB | null>(null);

  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [newMeasurementName, setNewMeasurementName] = useState("");
  const [addingMeasurement, setAddingMeasurement] = useState(false);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadMeasurementTypes() {
      setLoading(true);

      try {
        const types = await getMeasurementTypes();
        if (types) {
          setMeasurementTypes(types.filter((type) => type.is_active));
          setNewMeasurementData(
            types.map((type) => ({
              measurement_type_id: type.id,
              value_cm: "",
            })),
          );
        }
      } catch (error) {
        console.error("Error loading measurement types:", error);
      } finally {
        setLoading(false);
      }
    }

    loadMeasurementTypes();
  }, []);

  async function handleCreateMeasurementType() {
    const trimmedName = newMeasurementName.trim();

    if (!trimmedName) {
      setError(true);
      return;
    }
    const success = await run("saving", async () => {
      setAddingMeasurement(true);
      const createdType = await createMeasurementType(trimmedName);
      if (createdType)
        setMeasurementTypes((prev) =>
          prev ? [...prev, createdType] : [createdType],
        );
    });
    if (success) {
      setNewMeasurementName("");
      setIsAddingMeasurement(false);
    }
  }

  async function handleDeleteType() {
    if (!chosenType) return;
    await run("deleting", async () => {
      const deletedType = await archiveMeasurementType(chosenType.id);
      if (deletedType)
        setMeasurementTypes((prev) =>
          prev ? prev.filter((type) => type.id != chosenType.id) : null,
        );
      setShowModal(false);
    });
  }

  async function handleCreateMeasurementLog() {
    if (!newMeasurementData) return;

    const formatedMeasurements = newMeasurementData
      .filter((measurement) => measurement.value_cm.trim() !== "")
      .map((measurement) => {
        const value = Number(measurement.value_cm);
        const formatedValue = convertValueToBaseUnit(value, unit);
        return {
          measurement_type_id: measurement.measurement_type_id,
          value_cm: formatedValue,
          measured_at: new Date().toISOString(),
        };
      });

    const success = await run("saving", async () => {
      await createMeasurementLog(formatedMeasurements);
    });
    if (success) {
      setTimeout(() => {
        onSkip();
      }, 1000);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className="modal">
      <div className="modalContent">
        <h1 className="heading">{t("measurementsCheckin.title")}</h1>
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
          <p className={styles.message}>{t("measurementsCheckin.message")}</p>
        </div>
        <div className={styles.measurements}>
          {!measurementTypes ? (
            <p className={styles.emptyText}>
              {t("measurementsCheckin.emptyState")}
            </p>
          ) : (
            measurementTypes
              .filter((type) => type.is_active)
              .map((type) => (
                <div key={type.id} className={styles.inputContainer}>
                  <p className={styles.inputLabel}>
                    {`${type.name} (${t(`units.${unit}`)}):`}
                  </p>

                  <div className={styles.inputBox}>
                    <input
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000"
                      onChange={(e) =>
                        setNewMeasurementData((prev) =>
                          prev
                            ? prev.map((log) =>
                                log.measurement_type_id === type.id
                                  ? { ...log, value_cm: e.target.value }
                                  : log,
                              )
                            : null,
                        )
                      }
                      value={
                        newMeasurementData?.find(
                          (log) => log.measurement_type_id === type.id,
                        )?.value_cm ?? ""
                      }
                    />
                    <button
                      className={styles.deleteTypeBtn}
                      onClick={() => {
                        setChosenType(type);
                        setShowModal(true);
                      }}
                      aria-label={`Delete ${type.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
          )}
          {isAddingMeasurement ? (
            <div className={`${styles.addType} ${styles.inputContainer}`}>
              <input
                className={error ? "error" : ""}
                type="text"
                placeholder={t("measurementsCheckin.placeHolder")}
                value={newMeasurementName}
                onChange={(e) => setNewMeasurementName(e.target.value)}
              ></input>
              {error && (
                <p className="errorMessage">{t("measurementsCheckin.error")}</p>
              )}

              <button
                className={styles.addTypeBtn}
                onClick={handleCreateMeasurementType}
                disabled={addingMeasurement}
                aria-label="Add measurement type"
              >
                ✓
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => setIsAddingMeasurement(false)}
                aria-label="Cancel adding measurement type"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className={styles.addMeasurement}
              type="button"
              onClick={() => setIsAddingMeasurement(true)}
            >
              {t("measurementsCheckin.add")}
            </button>
          )}
        </div>
        {showModal && (
          <ExecuteModal
            text={`${t("measurementsCheckin.delete.part1")} ${chosenType?.name}${t("measurementsCheckin.delete.part2")}`}
            btnText={t("common.yes")}
            onClose={() => setShowModal(false)}
            onDelete={handleDeleteType}
          />
        )}
        <div className="buttonContainer">
          <button
            className={styles.continueBtn}
            onClick={handleCreateMeasurementLog}
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

export default MeasurementsCheckinModal;
