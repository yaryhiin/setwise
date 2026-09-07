import cn from "classnames";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Dispatch, SetStateAction } from "react";

import { UserRound } from "lucide-react";

import styles from "../styles/modules/Header.module.scss";

type HeaderProps = {
  session: boolean;
  toggleTheme: () => void;
  theme: string;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
};

const Header = ({
  toggleTheme,
  theme,
  session,
  language,
  setLanguage,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  return (
    <header className={cn("header", styles.header)}>
      {session ? (
        <div className={styles.sessionBox}>
          <button
            className={styles.profileLogo}
            onClick={() => navigate("/profile")}
          >
            <UserRound size={20} />
          </button>
          <h2 className={styles.appName}>
            <span className={styles.mainLetter}>S</span>
            <span className={styles.restLetters}>etwise</span>
          </h2>
          <div></div>
        </div>
      ) : (
        <div className={styles.sessionBox}>
          <div className={styles.themeBox}>
            <button
              onClick={toggleTheme}
              className={cn("button", styles.themeSwitch)}
              aria-pressed={theme === "dark"}
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark"
                ? `🌙 ${t("profile.preferences.theme.dark")}`
                : `☀️ ${t("profile.preferences.theme.light")}`}
            </button>
          </div>

          <h2 className={styles.appName}>
            <span className={styles.mainLetter}>S</span>
            <span className={styles.restLetters}>etwise</span>
          </h2>
          <div className={styles.langaugeSelect}>
            <select
              value={language}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                setLanguage(e.target.value);
              }}
              className={styles.input}
              aria-label={t("language.title")}
            >
              <option value="en">{t("language.en")}</option>
              <option value="uk">{t("language.uk")}</option>
              <option value="es">{t("language.es")}</option>
              <option value="ru">{t("language.ru")}</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
