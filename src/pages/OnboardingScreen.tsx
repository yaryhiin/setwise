import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ArrowDown, ListChecks } from "lucide-react";

import styles from "../styles/modules/OnboardingScreen.module.scss";
import exerciseCardStyles from "../styles/modules/RoutineBuilder.module.scss";

import type { ReactNode, SetStateAction, Dispatch } from "react";
import type { ExerciseDB } from "../types/exercise";

import { getExercises } from "../services/exercises";

import ChooseExerciseModal from "../components/ChooseExerciseModal";
import type { SelectedRoutineExercise } from "../types/routine";
import TargetsModal from "../components/TargetsModal";
import type { ProfileDB } from "../types/profile";
import { updateProfile } from "../services/profiles";

type OnboardingScreenProps = {
  profile: ProfileDB;
  setProfile: Dispatch<SetStateAction<ProfileDB | null>>;
};

type OnboardingScreenStep = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  preview: ReactNode;
};

const OnboardingScreen = ({ profile, setProfile }: OnboardingScreenProps) => {
  const { t } = useTranslation();

  const [stepCount, setStepCount] = useState(0);
  const [exercises, setExercises] = useState<ExerciseDB[] | null>(null);
  const [chosenExercise, setChosenExercise] = useState<SelectedRoutineExercise>(
    {
      exercise_id: "default",
      exercise_name: t("exercise.barbellBenchPress"),
      category: t("categories.chest"),
      order_index: 1,
      sets: null,
      min_reps: null,
      max_reps: null,
    },
  );
  const [showChooseExerciseModal, setShowChooseExerciseModal] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const steps: OnboardingScreenStep[] = [
    {
      id: "start",
      titleKey: "onboarding.welcome",
      descriptionKey: "",
      preview: (
        <div className={styles.startScreen}>
          <h2>{t("onboarding.takeTour")}</h2>
          <div className={styles.startButtons}>
            <button
              className={styles.startBtn}
              onClick={() => {
                setStepCount(1);
              }}
            >
              {t("onboarding.start")}
            </button>
            <button className={styles.skipBtn} onClick={finishOnboarding}>
              {t("onboarding.skip")}
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "create-routine",
      titleKey: "onboarding.createRoutine.title",
      descriptionKey: "onboarding.createRoutine.description",
      preview: (
        <div className={styles.preview}>
          <button
            className={`${styles.routines} ${styles.navButton} ${styles.active}`}
          >
            <ListChecks size={18} />
            {t("navigation.routines")}
          </button>
          <ArrowDown />
          <button className={styles.createRoutineBtn}>
            {t("routine.create")}
          </button>
        </div>
      ),
    },
    {
      id: "add-exercise",
      titleKey: "onboarding.addExercise.title",
      descriptionKey: "onboarding.addExercise.description",
      preview: (
        <div className={styles.preview}>
          <div className={styles.hint}>
            <p>{t("onboarding.addExercise.hint")}</p>
            <button
              className={styles.addExerciseBtn}
              onClick={() => setShowChooseExerciseModal(true)}
            >
              {t("routine.add")}
            </button>
          </div>
          {chosenExercise.exercise_id !== "default" && (
            <>
              <ArrowDown />
              <div
                key={chosenExercise.exercise_id}
                className={exerciseCardStyles.selectedExerciseElement}
              >
                <div className={exerciseCardStyles.selectedExerciseElementTop}>
                  <div className={exerciseCardStyles.exerciseElementHeader}>
                    <h3>{chosenExercise.exercise_name}</h3>
                  </div>
                  <div className={exerciseCardStyles.exerciseElementBottom}>
                    <p className={exerciseCardStyles.exerciseCategory}>
                      {chosenExercise.category}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          {showChooseExerciseModal && exercises && (
            <ChooseExerciseModal
              availableExercises={exercises}
              onClose={() => setShowChooseExerciseModal(false)}
              addExercise={(name, category) => {
                console.log(name);
                console.log(category);
              }}
              chooseExercise={(exercise) => {
                setChosenExercise({
                  exercise_id: exercise.id,
                  exercise_name: exercise.name,
                  category: exercise.category,
                  order_index: 1,
                  sets: null,
                  min_reps: null,
                  max_reps: null,
                });
                setShowChooseExerciseModal(false);
              }}
            />
          )}
        </div>
      ),
    },
    {
      id: "set-targets",
      titleKey: "onboarding.setTargets.title",
      descriptionKey: "onboarding.setTargets.description",
      preview: (
        <div className={styles.preview}>
          <div
            key={chosenExercise.exercise_id}
            className={exerciseCardStyles.selectedExerciseElement}
          >
            <div className={exerciseCardStyles.selectedExerciseElementTop}>
              <div className={exerciseCardStyles.exerciseElementHeader}>
                <h3>{chosenExercise.exercise_name}</h3>
              </div>
              <div className={exerciseCardStyles.exerciseElementBottom}>
                <p className={exerciseCardStyles.exerciseCategory}>
                  {chosenExercise.category}
                </p>
                <p
                  className={exerciseCardStyles.setTargets}
                  onClick={() => {
                    setShowTargetsModal(true);
                  }}
                >
                  {chosenExercise?.max_reps || chosenExercise?.sets
                    ? `${chosenExercise.sets} ${t("targetsModal.sets").toLowerCase()} × ${chosenExercise.min_reps}-${chosenExercise.max_reps} ${t("workout.reps").toLowerCase()}`
                    : t("common.setTargets")}
                </p>
              </div>
            </div>
          </div>
          {showTargetsModal && (
            <TargetsModal
              onClose={() => {
                setShowTargetsModal(false);
              }}
              onSave={(newTargets) => {
                setChosenExercise((prev) => ({
                  ...prev,
                  sets: newTargets.sets,
                  min_reps: newTargets.min_reps,
                  max_reps: newTargets.max_reps,
                }));
                setShowTargetsModal(false);
              }}
              targets={{
                sets: chosenExercise.sets ?? 0,
                min_reps: chosenExercise.min_reps ?? 0,
                max_reps: chosenExercise.max_reps ?? 0,
              }}
              exerciseName={chosenExercise.exercise_name}
            />
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    async function loadExercises() {
      try {
        const exercisesData = await getExercises();
        if (exercisesData.length) {
          setExercises(exercisesData);
        }
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    }

    loadExercises();
  }, []);

  async function finishOnboarding() {
    const result = await updateProfile({
      ...profile,
      onboarding_completed_on: new Date().toISOString(),
    });
    if (result) {
      setProfile(result);
    }
  }

  return (
    <div className="appShell">
      <div className={styles.content}>
        {steps[stepCount].id !== "start" && (
          <div className={styles.header}>
            <h1>
              {t("onboarding.step")} {stepCount} {t("onboarding.of")}{" "}
              {steps.length - 1}
            </h1>
          </div>
        )}
        <div key={steps[stepCount].id} className={styles.step}>
          <h2 className={styles.heading}>{t(steps[stepCount].titleKey)}</h2>
          <div className={styles.body}>
            <p className={styles.description}>
              {t(steps[stepCount].descriptionKey)}
            </p>
            {steps[stepCount].preview}
          </div>
        </div>
        {steps[stepCount].id !== "start" && (
          <div className={styles.buttons}>
            <div className={styles.moveButtons}>
              {stepCount > 1 && (
                <button
                  className={styles.backBtn}
                  onClick={() => {
                    setStepCount((prev) => prev - 1);
                  }}
                >
                  {t("onboarding.back")}
                </button>
              )}
              {stepCount + 1 === steps.length ? (
                <button className={styles.finishBtn} onClick={finishOnboarding}>
                  {t("onboarding.finish")}
                </button>
              ) : (
                <button
                  className={styles.nextBtn}
                  onClick={() => {
                    setStepCount((prev) => prev + 1);
                  }}
                >
                  {t("onboarding.next")}
                </button>
              )}
            </div>
            <button className={styles.skipBtn} onClick={finishOnboarding}>
              {t("onboarding.skip")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
