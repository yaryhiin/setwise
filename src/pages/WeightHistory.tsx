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
  getWeightsHistory,
  createWeightLog,
  deleteWeightLog,
  updateWeightLog,
} from "../services/weightLogs";
import type { WeightLogDB } from "../types/weight";
import { formatDate, formatDateForInput } from "../services/utils";

import LoadingScreen from "../components/LoadingScreen";

import ExecuteModal from "../components/ExecuteModal";
import ManageLogModal from "../components/ManageLogModal";
import InfoModal from "../components/InfoModal";

type WeightHistoryProps = {
  unit: string;
};

const WeightHistory = ({ unit }: WeightHistoryProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightLogDB[] | null>(null);
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
        const logs = await getWeightsHistory();
        if (logs)
          setWeightData(
            logs.sort(
              (a: WeightLogDB, b: WeightLogDB) =>
                new Date(b.measured_at).getTime() -
                new Date(a.measured_at).getTime(),
            ),
          );
      } catch (error) {
        console.error("Error getting weight logs:", error);
      } finally {
        setLoading(false);
      }
    }

    getLogs();
  }, []);

  useEffect(() => {
    if (!showOptions) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }

    function handleScroll() {
      setShowOptions(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showOptions]);

  async function handleCreateLog(date: string, value: number) {
    setSaving(true);
    try {
      const newLog = await createWeightLog(value, date);
      if (newLog) {
        setWeightData((prev) =>
          prev
            ? [...prev, newLog].sort(
                (a: WeightLogDB, b: WeightLogDB) =>
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
      console.error("Error creating weight log:", error);
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
    } finally {
      setShowAddModal(false);
      setSaving(false);
    }
  }

  async function handleDeleteLog() {
    if (chosenLogId === "") return;
    setDeleting(true);
    try {
      const deletedLog = await deleteWeightLog(chosenLogId);
      if (deletedLog) {
        setWeightData((prev) =>
          prev
            ? prev
                .filter((data) => data.id !== chosenLogId)
                .sort(
                  (a: WeightLogDB, b: WeightLogDB) =>
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
      console.error("Error deleting weight log:", error);
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

  async function handleEditLog(date: string, value: number) {
    if (chosenLogId === "") return;
    setSaving(true);
    try {
      const updatedLog = await updateWeightLog({ date, value }, chosenLogId);
      if (updatedLog) {
        setWeightData((prev) =>
          prev
            ? prev
                .map((log) => (log.id === updatedLog.id ? updatedLog : log))
                .sort(
                  (a: WeightLogDB, b: WeightLogDB) =>
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
      console.error("Error editing weight log:", error);
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
        <h2 className={styles.title}>{t("label.bw")}</h2>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus />
        </button>
      </div>
      {weightData && weightData.length > 0 ? (
        <table className={styles.weightLogs}>
          <thead>
            <tr>
              <th>{t("history.date")} </th>
              <th>{t("history.weight")} </th>
              <th>{t("history.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {weightData.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.measured_at)}</td>
                <td>
                  {unit === "lb"
                    ? Math.round(log.weight_kg * 10 * 2.20462262) / 10
                    : log.weight_kg}{" "}
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
          type="weight"
          onSave={handleCreateLog}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showEditModal && (
        <ManageLogModal
          unit={unit}
          type="weight"
          onSave={handleEditLog}
          onClose={() => {
            setShowEditModal(false);
            setChosenLogId("");
          }}
          log={{
            date: formatDateForInput(
              weightData?.find((log) => log.id === chosenLogId)?.measured_at ??
                "",
            ),
            value:
              weightData?.find((log) => log.id === chosenLogId)?.weight_kg ?? 0,
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

export default WeightHistory;
