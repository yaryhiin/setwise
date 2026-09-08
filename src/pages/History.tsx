import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Eye, Pencil, EllipsisVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/History.module.scss";

import type { WorkoutDB } from "../types/workout";

import LoadingScreen from "../components/LoadingScreen";

import { formatDate, formatDuration } from "../services/utils";
import { getWorkoutsHistory } from "../services/workouts";
import { useOutsideClick } from "../hooks/useOutsideClick";

type SortKey = "duration_seconds" | "finished_at" | "name";

type SortDirection = "asc" | "desc";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

const History = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [workouts, setWorkouts] = useState<WorkoutDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [chosenWorkoutId, setChosenWorkoutId] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "finished_at",
    direction: "desc",
  });
  const arrow = sortConfig.direction === "asc" ? "▴" : "▾";

  const sortedWorkouts = [...workouts].sort((a: WorkoutDB, b: WorkoutDB) => {
    const { key, direction } = sortConfig as SortConfig;

    let aValue: string | number | Date;
    let bValue: string | number | Date;

    if (key === "finished_at") {
      aValue = new Date(a.finished_at ?? a.created_at);
      bValue = new Date(b.finished_at ?? b.created_at);
    } else if (key === "duration_seconds") {
      aValue = Number(a.duration_seconds);
      bValue = Number(b.duration_seconds);
    } else {
      aValue = a.name;
      bValue = b.name;
    }

    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    if (aValue < bValue) return direction === "asc" ? -1 : 1;

    return 0;
  });

  useOutsideClick(menuRef, showOptions, () => setShowOptions(false));

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const workoutsData = await getWorkoutsHistory();
        setWorkouts(workoutsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleSort(key: SortKey) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.historyContainer}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/")}
          aria-label="Back to home"
        >
          <ArrowLeft />
        </button>
        <h2 className={styles.title}>{t("history.title")}</h2>
      </div>
      {sortedWorkouts && sortedWorkouts.length > 0 ? (
        <table className={styles.workouts}>
          <thead>
            <tr>
              <th onClick={() => handleSort("finished_at")}>
                <span className={styles.tableHeaderContent}>
                  {t("history.date")}{" "}
                  <span>{sortConfig.key === "finished_at" && arrow}</span>
                </span>
              </th>
              <th onClick={() => handleSort("name")}>
                <span className={styles.tableHeaderContent}>
                  {t("history.workout")}{" "}
                  <span>{sortConfig.key === "name" && arrow}</span>
                </span>
              </th>
              <th onClick={() => handleSort("duration_seconds")}>
                <span className={styles.tableHeaderContent}>
                  {t("history.duration")}{" "}
                  <span>{sortConfig.key === "duration_seconds" && arrow}</span>
                </span>
              </th>
              <th>{t("history.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedWorkouts.map((workout) => (
              <tr key={workout.id}>
                <td>{formatDate(workout.started_at)}</td>
                <td>{workout.name}</td>
                <td>{formatDuration(workout.duration_seconds)} </td>
                <td>
                  <div className="exerciseMenuWrapper">
                    {showOptions && chosenWorkoutId === workout.id ? (
                      <div ref={menuRef} className="exerciseMenu">
                        <button
                          onClick={() => {
                            navigate(`/history/${workout.id}`);
                            setChosenWorkoutId("");
                          }}
                        >
                          <Eye size={15} />
                          {t("common.view")}
                        </button>
                        <button
                          onClick={() => {
                            navigate(`/history/${workout.id}/edit`);
                            setChosenWorkoutId("");
                          }}
                        >
                          <Pencil size={15} />
                          {t("common.edit")}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="accessBtn"
                        onClick={() => {
                          setShowOptions(true);
                          setChosenWorkoutId(workout.id);
                        }}
                        aria-label="Workout options"
                      >
                        <EllipsisVertical size={20} />
                      </button>
                    )}
                  </div>
                  <div className={styles.actions}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.emptyText}>
          <h3>{t("home.emptyState.title")}</h3>
          <p>{t("home.emptyState.description")}</p>
        </div>
      )}
    </div>
  );
};

export default History;
