import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  EllipsisVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import styles from "../styles/modules/WeightHistory.module.scss";

import {
  createMeasurementLog,
  getMeasurementsHistory,
  getMeasurementTypes,
  updateMeasurementLog,
  deleteMeasurementLog,
  createMeasurementType,
  updateMeasurementType,
  archiveMeasurementType,
} from "../services/measurements";
import {
  formatDate,
  formatDateForInput,
  formatValueBasedOnUnit,
} from "../services/utils";

import LoadingScreen from "../components/LoadingScreen";

import ExecuteModal from "../components/ExecuteModal";
import ManageLogModal from "../components/ManageLogModal";
import InfoModal from "../components/InfoModal";
import type {
  MeasurementLogDB,
  MeasurementTypeDB,
} from "../types/measurements";
import type { PreferredMeasurementUnit } from "../types/profile";
import { useOutsideClick } from "../hooks/useOutsideClick";

type MeasurementsHistoryProps = {
  unit: PreferredMeasurementUnit;
};

const MeasurementsHistory = ({ unit }: MeasurementsHistoryProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [measurementsData, setMeasurementsData] = useState<
    MeasurementLogDB[] | null
  >(null);
  const [measurementsTypes, setMeasurementsTypes] = useState<
    MeasurementTypeDB[] | null
  >(null);
  const [chosenLogId, setChosenLogId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function getLogs() {
      setLoading(true);
      try {
        const logs = await getMeasurementsHistory();
        const types = await getMeasurementTypes();
        if (logs)
          setMeasurementsData(
            logs.sort(
              (a: MeasurementLogDB, b: MeasurementLogDB) =>
                new Date(b.measured_at).getTime() -
                new Date(a.measured_at).getTime(),
            ),
          );
        if (types) setMeasurementsTypes(types);
      } catch (error) {
        console.error("Error getting measurements data:", error);
      } finally {
        setLoading(false);
      }
    }

    getLogs();
  }, []);

  useOutsideClick(menuRef, showOptions, () => {
    setShowOptions(false);
  });

  async function handleCreateLog(date: string, value: number, typeId?: string) {
    if (!typeId) return;
    setSaving(true);
    try {
      const newLog = await createMeasurementLog([
        { value_cm: value, measured_at: date, measurement_type_id: typeId },
      ]);
      if (newLog) {
        setMeasurementsData((prev) =>
          prev
            ? [...prev, newLog[0]].sort(
                (a: MeasurementLogDB, b: MeasurementLogDB) =>
                  new Date(b.measured_at).getTime() -
                  new Date(a.measured_at).getTime(),
              )
            : null,
        );
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating measurement log:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setShowAddModal(false);
      setSaving(false);
    }
  }

  async function handleArchiveMeasurementType(id: string) {
    setDeleting(true);
    try {
      const deletedType = await archiveMeasurementType(id);
      if (deletedType) {
        setMeasurementsTypes((prev) =>
          prev ? prev.filter((type) => type.id !== id) : null,
        );
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error deleting measurement type:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteLog() {
    if (chosenLogId === "") return;
    setDeleting(true);
    try {
      const deletedLog = await deleteMeasurementLog(chosenLogId);
      if (deletedLog) {
        setMeasurementsData((prev) =>
          prev
            ? prev
                .filter((data) => data.id !== chosenLogId)
                .sort(
                  (a: MeasurementLogDB, b: MeasurementLogDB) =>
                    new Date(b.measured_at).getTime() -
                    new Date(a.measured_at).getTime(),
                )
            : null,
        );
      }
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
    } catch (error) {
      console.error("Error deleting measurement log:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setChosenLogId("");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleEditLog(date: string, value: number, typeId?: string) {
    if (!typeId) return;
    if (chosenLogId === "") return;
    setSaving(true);
    try {
      const updatedLog = await updateMeasurementLog(
        { value_cm: value, measured_at: date, measurement_type_id: typeId },
        chosenLogId,
      );
      if (updatedLog) {
        setMeasurementsData((prev) =>
          prev
            ? prev
                .map((log) => (log.id === updatedLog.id ? updatedLog : log))
                .sort(
                  (a: MeasurementLogDB, b: MeasurementLogDB) =>
                    new Date(b.measured_at).getTime() -
                    new Date(a.measured_at).getTime(),
                )
            : null,
        );
      }
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
    } catch (error) {
      console.error("Error editing measurement log:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setChosenLogId("");
      setSaving(false);
      setShowEditModal(false);
    }
  }

  async function handleUpdateMeasurementType(id: string, name: string) {
    setSaving(true);
    try {
      const updatedType = await updateMeasurementType(id, name);
      if (updatedType) {
        setMeasurementsTypes((prev) =>
          prev
            ? prev.map((type) => (type.id === id ? { ...type, name } : type))
            : null,
        );
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error updating measurement type:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMeasurementType(name: string) {
    setSaving(true);
    try {
      setSaving(true);
      const createdType = await createMeasurementType(name);
      setMeasurementsTypes((prev) =>
        prev ? [...prev, createdType] : [createdType],
      );
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
    } catch (error) {
      console.error("Error creating measurement type:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <ArrowLeft
          className={styles.backBtn}
          onClick={() => navigate("/progress")}
        />
        <h2 className={styles.title}>{t("label.measurement")}</h2>
        <button
          className={styles.addBtn}
          onClick={() => {
            setShowAddModal(true);
          }}
        >
          <Plus />
        </button>
      </div>
      {measurementsData && measurementsData.length > 0 ? (
        <table className={styles.weightLogs}>
          <thead>
            <tr>
              <th>{t("history.date")} </th>
              <th>{t("history.type")} </th>
              <th>{t("history.measurement")} </th>
              <th>{t("history.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {measurementsData.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.measured_at)}</td>
                <td>
                  {
                    measurementsTypes?.find(
                      (type) => type.id === log.measurement_type_id,
                    )?.name
                  }
                </td>
                <td>
                  {formatValueBasedOnUnit(log.value_cm, unit)}{" "}
                  {t(`units.${unit}`)}
                </td>
                <td>
                  <div className="exerciseMenuWrapper">
                    {showOptions && chosenLogId === log.id ? (
                      <div ref={menuRef} className="exerciseMenu">
                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setChosenLogId(log.id);
                          }}
                        >
                          <Pencil size={15} />
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(true);
                            setChosenLogId(log.id);
                          }}
                        >
                          <Trash2 size={15} />
                          {t("common.delete")}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="accessBtn"
                        onClick={() => {
                          setShowOptions(true);
                          setChosenLogId(log.id);
                        }}
                      >
                        <EllipsisVertical size={20} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.emptyState}>
          <h3>{t("history.emptyState.title")}</h3>
          <p>{t("history.emptyState.description")}</p>
        </div>
      )}
      {showDeleteModal && (
        <ExecuteModal
          text={t("modal.delete.log")}
          btnText={t("common.delete")}
          onClose={() => {
            setShowDeleteModal(false);
            setChosenLogId("");
          }}
          onDelete={handleDeleteLog}
        />
      )}
      {showAddModal && (
        <ManageLogModal
          unit={unit}
          type=""
          measurementTypes={measurementsTypes}
          onSave={handleCreateLog}
          onClose={() => setShowAddModal(false)}
          onAddType={handleCreateMeasurementType}
          onArchiveType={handleArchiveMeasurementType}
          onUpdateType={handleUpdateMeasurementType}
        />
      )}
      {showEditModal && (
        <ManageLogModal
          unit={unit}
          type={
            measurementsData?.find((log) => log.id === chosenLogId)
              ?.measurement_type_id
          }
          onArchiveType={handleArchiveMeasurementType}
          onUpdateType={handleUpdateMeasurementType}
          measurementTypes={measurementsTypes}
          onSave={handleEditLog}
          onClose={() => {
            setShowEditModal(false);
            setChosenLogId("");
          }}
          onAddType={handleCreateMeasurementType}
          log={{
            date: formatDateForInput(
              measurementsData?.find((log) => log.id === chosenLogId)
                ?.measured_at ?? "",
            ),
            value:
              measurementsData?.find((log) => log.id === chosenLogId)
                ?.value_cm ?? 0,
          }}
        />
      )}
      {saving && <InfoModal type="saving" />}
      {showErrorModal && <InfoModal type="error" />}
      {showSuccessModal && <InfoModal type="success" />}
      {deleting && <InfoModal type="deleting" />}
    </div>
  );
};

export default MeasurementsHistory;
