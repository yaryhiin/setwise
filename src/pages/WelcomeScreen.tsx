import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import cn from "classnames";
import { useTranslation } from "react-i18next";
import {
  EllipsisVertical,
  Pencil,
  Trash2,
  MessageSquarePlus,
  History,
  Repeat2,
} from "lucide-react";

import Chart from "../components/Chart";
import { exerciseData } from "../services/defaults";

import styles from "../styles/modules/WelcomeScreen.module.scss";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const exerciseMenuRef = useRef<HTMLDivElement>(null);
  const [showExerciseOptions, setShowExerciseOptions] = useState(false);

  useEffect(() => {
    if (!showExerciseOptions) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        exerciseMenuRef.current &&
        !exerciseMenuRef.current.contains(event.target as Node)
      ) {
        setShowExerciseOptions(false);
      }
    }

    function handleScroll() {
      setShowExerciseOptions(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showExerciseOptions]);

  return (
    <div className={styles.welcomeScreenContainer}>
      <div className={styles.title}>
        <h1>{t("welcomeScreen.title.part1")}</h1>
        <h1>{t("welcomeScreen.title.part2")}</h1>
      </div>
      <h3 className={styles.description}>{t("welcomeScreen.description")}</h3>
      <div className={styles.sessionBox}>
        <button
          onClick={() => navigate("/signup")}
          className={cn("button", styles.signUp)}
        >
          {t("welcomeScreen.signupBtn")}
        </button>
        <div className={styles.loginContainer}>
          <p className={styles.loginText}>{t("welcomeScreen.member")}</p>
          <p onClick={() => navigate("/login")} className={styles.logIn}>
            {t("auth.login")}
          </p>
        </div>
      </div>
      <div className={styles.preview}>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>
            {t("welcomeScreen.preview.title1")}
          </h2>
          <div className={styles.exerciseCard}>
            <div className={styles.exerciseCardHeader}>
              <h2 className={styles.exerciseName}>
                {t("welcomeScreen.preview.exerciseName")}
              </h2>
              <div className="exerciseMenuWrapper">
                {showExerciseOptions ? (
                  <div ref={exerciseMenuRef} className="exerciseMenu">
                    <button className={styles.editExerciseBtn}>
                      <Pencil size={15} />
                      {t("common.replace")}
                    </button>
                    <button className={styles.deleteExerciseBtn}>
                      <Trash2 size={15} />
                      {t("common.delete")}
                    </button>

                    <button className={styles.exerciseHistoryBtn}>
                      <History size={15} />
                      {t("common.history")}
                    </button>
                    <button className={styles.addSupersetBtn}>
                      <Repeat2 size={17} /> {t("common.superset")}
                    </button>
                  </div>
                ) : (
                  <button
                    aria-label="Exercise Options"
                    className="accessBtn"
                    onClick={() => {
                      setShowExerciseOptions(true);
                    }}
                  >
                    <EllipsisVertical size={20} />
                  </button>
                )}
              </div>
            </div>
            <p className={styles.exercisePrev}>
              {t("workout.last")} 140{t("units.lb")} 11, 11, 10
            </p>
            <p className={styles.exercisePrev}>
              {t("workout.note.prev")} {t("welcomeScreen.preview.last")}
            </p>
            <button className={styles.addNoteBtn}>
              <MessageSquarePlus size={15} />
              {t("workout.note.add")}
            </button>
            <div className={styles.exercises}>
              <table className={styles.sets}>
                <thead>
                  <tr>
                    <th>{t("workout.set")}</th>
                    <th>
                      {t("workout.weight")} ({t(`units.lb`)})
                    </th>
                    <th>{t("workout.reps")}</th>
                    <th className={styles.actionsTitle}>{t("workout.done")}</th>
                    <th>{t("workout.rest")}</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  <tr className={styles.set}>
                    <td>1</td>
                    <td>
                      <p>140</p>
                    </td>
                    <td>
                      <p>12</p>
                    </td>
                    <td>
                      <p>✅</p>
                    </td>
                    <td>2:36</td>
                    <td>
                      <button className={styles.deleteSet}>×</button>
                    </td>
                  </tr>
                  <tr className={`${styles.set} ${styles.selected}`}>
                    <td>2</td>
                    <td>
                      <p>140</p>
                    </td>
                    <td>
                      <p>0</p>
                    </td>
                    <td>
                      <p></p>
                    </td>
                    <td>0:00</td>
                    <td>
                      <button className={styles.deleteSet}>×</button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className={styles.buttons}>
                <button className={styles.addSet}>{t("workout.addSet")}</button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>
            {t("welcomeScreen.preview.title2")}
          </h2>
          <h3 className={styles.chartHeader}>
            {t("welcomeScreen.preview.exerciseName")}
          </h3>

          <Chart
            chartData={exerciseData}
            yPadding={2}
            unit="lb"
            label={t("label.totalVol")}
            firstDayOfTheWeek="monday"
          />
        </div>
        <div className={styles.previewSection}>
          <h2 className={styles.moreTitle}>
            {t("welcomeScreen.preview.more.title")}
          </h2>
          <p className={styles.moreDesc}>
            {t("welcomeScreen.preview.more.description")}
          </p>
          <button
            onClick={() => navigate("/signup")}
            className={cn("button", styles.signUp)}
          >
            {t("welcomeScreen.signupBtn")}
          </button>
        </div>
      </div>
      <footer className={styles.footer}>
        <p>
          Built by{" "}
          <a
            href="https://yaryhin.com"
            target="_blank"
            aria-label="Tim Yaryhin Portfolio"
          >
            Tim Yaryhin
          </a>
        </p>
        <p>Setwise &copy; 2026</p>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
