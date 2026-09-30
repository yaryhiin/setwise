import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadingScreen from "./LoadingScreen";

import styles from "../styles/modules/ExerciseHistoryModal.module.scss";

import type { ExerciseHistory } from "../types/exercise";
import type { Range } from "../types/workout";

import { getExercisesLogs } from "../services/exercises";

import { formatDate, formatValueBasedOnUnit, formatTime } from "../utils/utils";
import type { PreferredWeightUnit } from "../types/profile";

type ExerciseHistoryModalProps = {
  exerciseId: string;
  onClose: () => void;
  preferredUnit: PreferredWeightUnit;
};

const step = 10;

const ExerciseHistoryModal = ({
  exerciseId,
  onClose,
  preferredUnit,
}: ExerciseHistoryModalProps) => {
  const { t } = useTranslation();

  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>({ from: 0, to: 10 });
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;

    async function getInitialExerciseHistory() {
      setLoading(true);
      try {
        const history = await getExercisesLogs({ from: 0, to: 10 }, exerciseId);
        setHasMore(history.length > 10);
        setExerciseHistory(history.slice(0, 10));
      } catch (error) {
        console.error("Error fetching exercise history:", error);
      } finally {
        setLoading(false);
      }
    }

    getInitialExerciseHistory();
  }, [exerciseId]);

  async function getExerciseHistory(newRange: Range) {
    setLoading(true);
    try {
      const history = await getExercisesLogs(newRange, exerciseId);
      setHasMore(history.length > 10);
      setExerciseHistory((prev) => [...prev, ...history.slice(0, 10)]);
    } catch (error) {
      console.error("Error fetching exercise history:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="modal">
        <div className="modalContent">
          <button
            className={styles.loadingCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={25} />
          </button>
          <LoadingScreen />
        </div>
      </div>
    );
  }
  return (
    <div className="modal">
      <div className="modalContent">
        <div className={styles.header}>
          <h2 className={styles.heading}>
            {exerciseHistory?.[0]?.workout_exercises?.[0]?.exercise_name}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={25} />
          </button>
        </div>
        {exerciseHistory && exerciseHistory.length > 0 ? (
          <div className={styles.historyList}>
            {exerciseHistory.map((workout) => (
              <div className={styles.historyCard} key={workout.id}>
                <div className={styles.historyCardHeader}>
                  <h2 className={styles.historyCardName}>{workout.name}</h2>
                  <p className={styles.historyCardDate}>
                    {formatDate(workout.started_at)}
                  </p>
                </div>
                {workout.workout_exercises[0].notes && (
                  <p className={styles.historyCardNote}>
                    {workout.workout_exercises[0].notes}
                  </p>
                )}
                <table className={styles.sets}>
                  <thead>
                    <tr>
                      <th>{t("workout.set")}</th>
                      <th>
                        {t("workout.weight")} ({t(`units.${preferredUnit}`)})
                      </th>
                      <th>{t("workout.reps")}</th>
                      <th>{t("workout.done")}</th>
                      <th>{t("workout.rest")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {workout.workout_exercises[0].workout_sets.map((set) => (
                      <tr key={set.set_number} className={styles.set}>
                        <td>{set.set_number}</td>
                        <td>
                          {formatValueBasedOnUnit(set.weight, preferredUnit)}
                        </td>
                        <td>{set.reps}</td>
                        <td>{set.done && "✅"}</td>
                        <td>{formatTime(set.rest_seconds, "rest")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {hasMore && (
              <button
                className="loadMore"
                onClick={() => {
                  const newRange = {
                    from: range.from + step,
                    to: range.to + step,
                  };
                  setRange(newRange);
                  getExerciseHistory(newRange);
                }}
              >
                Load More
              </button>
            )}
          </div>
        ) : (
          <p>{t("exerciseHistory.emptyState")}</p>
        )}
        <div className="buttonContainer"></div>
      </div>
    </div>
  );
};

export default ExerciseHistoryModal;
