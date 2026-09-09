import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import { useTranslation } from "react-i18next";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../supabase";

import styles from "../styles/modules/Profile.module.scss";

import type { ProfileDB, Profile } from "../types/profile";

import ExecuteModal from "../components/ExecuteModal";
import InfoModal from "../components/InfoModal";

import { useAsyncAction } from "../hooks/useAsyncAction";

type ProfilePageProps = {
  toggleTheme: () => void;
  theme: string;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  profile: ProfileDB;
  handleUpdateProfile: (profile: Profile) => void;
};

const ProfilePage = ({
  toggleTheme,
  theme,
  language,
  setLanguage,
  profile,
  handleUpdateProfile,
}: ProfilePageProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { run, state } = useAsyncAction();

  const [profileForm, setProfileForm] = useState<Profile>({
    name: profile.name || "",
    date_of_birth: profile.date_of_birth || "",
    preferred_weight_unit: profile.preferred_weight_unit || "kg",
    preferred_workout_unit: profile.preferred_workout_unit || "kg",
    preferred_measurement_unit: profile.preferred_measurement_unit || "cm",
    first_day_of_week: profile.first_day_of_week || "monday",
    weight_checkin_frequency: profile.weight_checkin_frequency || "off",
    measurements_checkin_frequency:
      profile.measurements_checkin_frequency || "off",
  });

  useEffect(() => {
    setProfileForm({
      name: profile.name ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      preferred_weight_unit: profile.preferred_weight_unit,
      preferred_workout_unit: profile.preferred_workout_unit,
      preferred_measurement_unit: profile.preferred_measurement_unit,
      first_day_of_week: profile.first_day_of_week,
      weight_checkin_frequency: profile.weight_checkin_frequency,
      measurements_checkin_frequency: profile.measurements_checkin_frequency,
    });
  }, [profile]);

  const [showLogOutModal, setShowLogOutModal] = useState(false);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      setShowLogOutModal(false);
      return;
    }

    localStorage.clear();
    setShowLogOutModal(false);
    navigate("/");
  }

  async function handleSave() {
    const success = await run("saving", async () => {
      handleUpdateProfile(profileForm);
    });
    if (success)
      setTimeout(() => {
        navigate("/");
      }, 1000);
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <button className={styles.saveBtn} onClick={handleSave}>
          {t("common.saveChanges")}
        </button>
        <h1 className={styles.title}>{t("profile.title")}</h1>
      </div>
      <div className={styles.sections}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.title}>{t("profile.personal")}</h2>
          <div className={styles.inputContainer}>
            <p className={styles.inputLabel}>{t("profile.name.title")}</p>
            <input
              className={styles.input}
              type="text"
              placeholder={t("profile.name.placeHolder")}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  name: e.target.value.trim(),
                }))
              }
              value={profileForm.name}
            />
          </div>
          <div className={styles.inputContainer}>
            <p className={styles.inputLabel}>{t("profile.birthday")}</p>
            <input
              className={styles.input}
              type="date"
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  date_of_birth: e.target.value.trim(),
                }))
              }
              value={profileForm.date_of_birth}
            />
          </div>
        </div>
        <div className={styles.sectionContainer}>
          <h2 className={styles.title}>{t("profile.preferences.title")}</h2>
          <div className={styles.inputContainer}>
            <p className={styles.inputLabel}>
              {t("profile.preferences.weight")}
            </p>
            <div className="toggle">
              <button
                type="button"
                className={
                  profileForm.preferred_weight_unit === "kg" ? "active" : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_weight_unit: "kg",
                  }))
                }
              >
                {t("units.kg")}
              </button>

              <button
                type="button"
                className={
                  profileForm.preferred_weight_unit === "lb" ? "active" : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_weight_unit: "lb",
                  }))
                }
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
                className={
                  profileForm.preferred_measurement_unit === "cm"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_measurement_unit: "cm",
                  }))
                }
              >
                {t("units.cm")}
              </button>

              <button
                type="button"
                className={
                  profileForm.preferred_measurement_unit === "in"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_measurement_unit: "in",
                  }))
                }
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
                className={
                  profileForm.preferred_workout_unit === "kg" ? "active" : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_workout_unit: "kg",
                  }))
                }
              >
                {t("units.kg")}
              </button>

              <button
                type="button"
                className={
                  profileForm.preferred_workout_unit === "lb" ? "active" : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_workout_unit: "lb",
                  }))
                }
              >
                {t("units.lb")}
              </button>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <p className={styles.inputLabel}>
              {t("profile.preferences.firstDay")}
            </p>
            <select
              className={styles.input}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  first_day_of_week: e.target.value.trim(),
                }))
              }
              value={profileForm.first_day_of_week}
            >
              <option value="monday">{t("days.monday")}</option>
              <option value="tuesday">{t("days.tuesday")}</option>
              <option value="wednesday">{t("days.wednesday")}</option>
              <option value="thursday">{t("days.thursday")}</option>
              <option value="friday">{t("days.friday")}</option>
              <option value="saturday">{t("days.saturday")}</option>
              <option value="sunday">{t("days.sunday")}</option>
            </select>
          </div>
          <div className={styles.inputContainer}>
            <p className={styles.inputLabel}>
              {t("profile.preferences.theme.title")}
            </p>
            <div className="toggle">
              <button
                onClick={toggleTheme}
                className={cn(
                  "button",
                  styles.themeSwitch,
                  theme === "light" && styles.activeTheme,
                )}
                title="Switch to light"
              >
                ☀️ {t("profile.preferences.theme.light")}
              </button>
              <button
                onClick={toggleTheme}
                className={cn(
                  "button",
                  styles.themeSwitch,
                  theme === "dark" && styles.activeTheme,
                )}
                title="Switch to dark"
              >
                🌙 {t("profile.preferences.theme.dark")}
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
        </div>
        <div className={styles.sectionContainer}>
          <h2 className={styles.title}>{t("profile.reminders.title")}</h2>
          <div className={styles.inputContainer}>
            <p className={styles.inputLabel}></p>
            <div className="toggle">
              <button
                type="button"
                className={
                  profileForm.weight_checkin_frequency === "daily"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    weight_checkin_frequency: "daily",
                  }))
                }
              >
                {t("frequency.daily")}
              </button>

              <button
                type="button"
                className={
                  profileForm.weight_checkin_frequency === "weekly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    weight_checkin_frequency: "weekly",
                  }))
                }
              >
                {t("frequency.weekly")}
              </button>
              <button
                type="button"
                className={
                  profileForm.weight_checkin_frequency === "off" ? "active" : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    weight_checkin_frequency: "off",
                  }))
                }
              >
                {t("frequency.off")}
              </button>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <p className={styles.inputLabel}>Measurments</p>
            <div className="toggle">
              <button
                type="button"
                className={
                  profileForm.measurements_checkin_frequency === "biweekly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    measurements_checkin_frequency: "biweekly",
                  }))
                }
              >
                {t("frequency.biweekly")}
              </button>

              <button
                type="button"
                className={
                  profileForm.measurements_checkin_frequency === "monthly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    measurements_checkin_frequency: "monthly",
                  }))
                }
              >
                {t("frequency.monthly")}
              </button>
              <button
                type="button"
                className={
                  profileForm.measurements_checkin_frequency === "off"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setProfileForm((prev) => ({
                    ...prev,
                    measurements_checkin_frequency: "off",
                  }))
                }
              >
                {t("frequency.off")}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.sectionContainer}>
          <h2 className={styles.title}>Account</h2>
          <button
            className={cn("button", styles.logOut)}
            onClick={() => setShowLogOutModal(true)}
          >
            {t("auth.logout")}
          </button>
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
      {showLogOutModal && (
        <ExecuteModal
          text={t("modal.logout")}
          btnText={t("auth.logout")}
          onClose={() => setShowLogOutModal(false)}
          onDelete={handleLogout}
        />
      )}
      <InfoModal state={state} />
    </div>
  );
};

export default ProfilePage;
