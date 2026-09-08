import cn from "classnames";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, EllipsisVertical } from "lucide-react";

import styles from "../styles/modules/ManageLogModal.module.scss";

import { useOutsideClick } from "../hooks/useOutsideClick";
import { convertValueToBaseUnit } from "../services/utils";

import type { MeasurementTypeDB } from "../types/measurements";
import type {
  PreferredMeasurementUnit,
  PreferredWeightUnit,
} from "../types/profile";

import ExecuteModal from "./ExecuteModal";

type Log = {
  date: string;
  value: number;
};

type ManageLogModalProps = {
  unit: PreferredWeightUnit | PreferredMeasurementUnit;
  log?: Log;
  measurementTypes?: MeasurementTypeDB[] | null;
  type?: string;
  onClose: () => void;
  onSave: (date: string, value: number, typeId?: string) => Promise<void>;
  onAddType?: (name: string) => Promise<void>;
  onArchiveType?: (id: string) => Promise<void>;
  onUpdateType?: (id: string, name: string) => Promise<void>;
};

const ManageLogModal = ({
  unit,
  log,
  measurementTypes,
  type,
  onClose,
  onSave,
  onAddType,
  onArchiveType,
  onUpdateType,
}: ManageLogModalProps) => {
  const { t } = useTranslation();
  const [newLog, setNewLog] = useState(
    log ?? {
      date: new Date(
        new Date().getTime() - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16),
      value: 0,
    },
  );
  const [typeId, setTypeId] = useState(
    type !== "" ? (type ?? "") : (measurementTypes?.[0].id ?? ""),
  );
  const [newTypeName, setNewTypeName] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  const [errors, setErrors] = useState({
    value: false,
    date: false,
    type: false,
    name: false,
  });
  const [showAddInput, setShowAddInput] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (typeId === "add") {
      setShowAddInput(true);
    }
  }, [typeId]);

  useOutsideClick(menuRef, showOptions, () => {
    setShowOptions(false);
  });

  function handleSubmit() {
    let hasErrors = false;
    if (newLog.value <= 0) {
      setErrors((prev) => ({ ...prev, value: true }));
      hasErrors = true;
    }

    if (!newLog.date) {
      setErrors((prev) => ({ ...prev, date: true }));
      hasErrors = true;
    }

    if (typeId === "add" || !typeId) {
      setErrors((prev) => ({ ...prev, type: true }));
      hasErrors = true;
    }
    if (hasErrors) return;
    if (Object.values(errors))
      if (typeId)
        onSave(
          new Date(newLog.date).toISOString(),
          convertValueToBaseUnit(newLog.value, unit),
          typeId,
        );
      else
        onSave(
          new Date(newLog.date).toISOString(),
          convertValueToBaseUnit(newLog.value, unit),
        );
  }

  function handleCreateMeasurementType() {
    const trimmedName = newTypeName.trim();

    if (!trimmedName) {
      setErrors((prev) => ({ ...prev, name: true }));
      return;
    }
    if (onAddType) {
      onAddType(trimmedName);
      setNewTypeName("");
      setShowAddInput(false);
      setTypeId(measurementTypes?.[0].id ?? "");
    }
  }

  function handleUpdateMeasurementType() {
    const trimmedName = newTypeName.trim();

    if (!trimmedName) {
      setErrors((prev) => ({ ...prev, name: true }));
      return;
    }
    if (onUpdateType) {
      onUpdateType(typeId, trimmedName);
      setNewTypeName("");
      setShowAddInput(false);
      setTypeId(measurementTypes?.[0].id ?? "");
    }
  }

  return (
    <div className="modal">
      <div className="modalContent">
        <h2 className="heading">
          {log ? t("manageLogModal.change") : t("manageLogModal.add")}
        </h2>
        <div className={styles.mainContainer}>
          <div className={styles.valueContainer}>
            <p className={styles.inputLabel}>
              {unit === "kg" || unit === "lb"
                ? t("weightCheckin.new")
                : measurementTypes?.find((type) => type.id === typeId)
                    ?.name}{" "}
              ({t(`units.${unit}`)})
            </p>
            <input
              className={`${styles.input} ${errors.value && "error"}`}
              type="number"
              step="0.01"
              min="0"
              max="1000"
              placeholder="0"
              onChange={(e) =>
                setNewLog((prev) => ({
                  ...prev,
                  value: Number(e.target.value),
                }))
              }
              value={newLog.value === 0 ? "" : newLog.value}
            />
            {errors.value && (
              <p className={`errorMessage`}>{t("weightCheckin.error")}</p>
            )}
          </div>
          {measurementTypes &&
            (showAddInput ? (
              <div className={`${styles.addType} ${styles.inputContainer}`}>
                <p className={styles.inputLabel}>{t("history.type")}</p>
                <input
                  className={`${styles.input} ${errors.name || errors.type ? "error" : ""}`}
                  type="text"
                  placeholder={t("measurementsCheckin.placeHolder")}
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                ></input>

                <button
                  className={styles.addTypeBtn}
                  onClick={() => {
                    if (editing) {
                      handleUpdateMeasurementType();
                      setEditing(false);
                    } else handleCreateMeasurementType();
                  }}
                  aria-label={editing ? t("common.edit") : t("common.add")}
                >
                  ✓
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowAddInput(false);
                    setTypeId(measurementTypes[0].id);
                    setNewTypeName("");
                    setErrors({
                      value: false,
                      date: false,
                      type: false,
                      name: false,
                    });
                  }}
                  aria-label={t("common.cancel")}
                >
                  ✕
                </button>
                {errors.name && (
                  <p className="errorMessage">
                    {t("measurementsCheckin.error")}
                  </p>
                )}
                {errors.type && (
                  <p className="errorMessage">
                    {t("manageLogModal.error.type")}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.typeContainer}>
                <p className={styles.inputLabel}>{t("history.type")}</p>
                <select
                  className={styles.select}
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                >
                  {measurementTypes
                    .filter((type) => type.is_active)
                    .map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  <option value="add">{t("manageLogModal.addType")}</option>
                </select>
                <div className={styles.menu}>
                  <div className="exerciseMenuWrapper">
                    {showOptions ? (
                      <div ref={menuRef} className="exerciseMenu">
                        <button
                          onClick={() => {
                            setShowAddInput(true);
                            setNewTypeName(
                              measurementTypes.find(
                                (type) => type.id === typeId,
                              )?.name ?? "",
                            );
                            setEditing(true);
                          }}
                          aria-label={t("common.edit")}
                        >
                          <Pencil size={15} />
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(true);
                          }}
                          aria-label={t("common.delete")}
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
                        }}
                        aria-label="Open options menu"
                      >
                        <EllipsisVertical size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          <div className={styles.dateContainer}>
            <p>{t("history.date")}</p>
            <input
              className={`${styles.input} ${errors.date && "error"}`}
              type="datetime-local"
              onChange={(e) => {
                setNewLog((prev) => ({
                  ...prev,
                  date: e.target.value,
                }));
              }}
              value={newLog.date}
            />
            {errors.date && (
              <p className={`errorMessage`}>{t("manageLogModal.error.date")}</p>
            )}
          </div>
        </div>
        <div className="buttonContainer">
          <button
            className={cn(styles.saveBtn, "button")}
            onClick={handleSubmit}
          >
            {t("common.save")}
          </button>
          <button className={cn(styles.backBtn, "button")} onClick={onClose}>
            {t("common.back")}
          </button>
        </div>
        {showDeleteModal && (
          <ExecuteModal
            text={t("modal.delete.type")}
            btnText={t("common.delete")}
            onClose={() => {
              setShowDeleteModal(false);
            }}
            onDelete={() => {
              if (onArchiveType) onArchiveType(typeId);
              setShowDeleteModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ManageLogModal;
