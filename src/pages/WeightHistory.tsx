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

import type { PreferredWeightUnit } from "../types/profile";
import type { WeightLogDB } from "../types/weight";

import LoadingScreen from "../components/LoadingScreen";
import ExecuteModal from "../components/ExecuteModal";
import ManageLogModal from "../components/ManageLogModal";
import InfoModal from "../components/InfoModal";

import {
  getWeightsHistory,
  createWeightLog,
  deleteWeightLog,
  updateWeightLog,
} from "../services/weightLogs";
import {
  formatDate,
  formatDateForInput,
  formatValueBasedOnUnit,
} from "../services/utils";

import { useOutsideClick } from "../hooks/useOutsideClick";
import { useAsyncAction } from "../hooks/useAsyncAction";

type WeightHistoryProps = {
  unit: PreferredWeightUnit;
};

const WeightHistory = ({ unit }: WeightHistoryProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { run, state } = useAsyncAction();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightLogDB[] | null>(null);
  const [chosenLogId, setChosenLogId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function getLogs() {
      setLoading(true);
      try {
        const logs = await getWeightsHistory();
        if (logs)
          setWeightData(
            logs
              .sort(
                (a: WeightLogDB, b: WeightLogDB) =>
                  new Date(b.measured_at).getTime() -
                  new Date(a.measured_at).getTime(),
              )
              .map((log) => ({
                ...log,
                weight_kg: formatValueBasedOnUnit(log.weight_kg, unit),
              })),
          );
      } catch (error) {
        console.error("Error getting weight logs:", error);
      } finally {
        setLoading(false);
      }
    }

    getLogs();
  }, []);

  useOutsideClick(menuRef, showOptions, () => setShowOptions(false));

  async function handleCreateLog(date: string, value: number) {
    await run("saving", async () => {
      const newLog = await createWeightLog(value, date);
      if (newLog) {
        setWeightData((prev) =>
          prev
            ? [
                ...prev,
                {
                  ...newLog,
                  weight_kg: formatValueBasedOnUnit(newLog.weight_kg, unit),
                },
              ].sort(
                (a: WeightLogDB, b: WeightLogDB) =>
                  new Date(b.measured_at).getTime() -
                  new Date(a.measured_at).getTime(),
              )
            : null,
        );
        setShowAddModal(false);
      }
    });
  }

  async function handleEditLog(date: string, value: number) {
    if (chosenLogId === "") return;
    await run("saving", async () => {
      const updatedLog = await updateWeightLog({ date, value }, chosenLogId);
      if (updatedLog) {
        setWeightData((prev) =>
          prev
            ? prev
                .map((log) =>
                  log.id === updatedLog.id
                    ? {
                        ...updatedLog,
                        weight_kg: formatValueBasedOnUnit(
                          updatedLog.weight_kg,
                          unit,
                        ),
                      }
                    : log,
                )
                .sort(
                  (a: WeightLogDB, b: WeightLogDB) =>
                    new Date(b.measured_at).getTime() -
                    new Date(a.measured_at).getTime(),
                )
            : null,
        );
        setChosenLogId("");
        setShowEditModal(false);
      }
    });
  }

  async function handleDeleteLog() {
    if (chosenLogId === "") return;
    await run("deleting", async () => {
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
        setChosenLogId("");
        setShowDeleteModal(false);
      }
    });
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
                  {log.weight_kg} {t(`units.${unit}`)}
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
      <InfoModal state={state} />
    </div>
  );
};

export default WeightHistory;
