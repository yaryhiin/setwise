import { supabase } from "../supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import cn from "classnames";

import styles from "../styles/modules/FormLayout.module.scss";

import type { AuthErrors } from "../types/errors";

import MessageModal from "../components/MessageModal";

const MODAL_TITLE = "Account created";
const MODAL_TEXT =
  "Check your email for a confirmation link. \n If you already have an account, try logging in instead.";

const SignUp = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({
    confirmPassword: false,
    password: false,
    email: false,
  });
  const [authError, setAuthError] = useState({ email: "", password: "" });

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const newErrors: AuthErrors = {
      confirmPassword: false,
      password: false,
      email: false,
    };
    if (confirmPassword !== password && confirmPassword) {
      newErrors.confirmPassword = true;
    } else {
      newErrors.confirmPassword = false;
    }
    setErrors((prev) => ({
      ...prev,
      confirmPassword: newErrors.confirmPassword,
    }));
    setAuthError((prev) => ({
      ...prev,
      password: newErrors.confirmPassword ? "Passwords do not match" : "",
    }));
  }, [confirmPassword, password]);

  async function handleSignUp(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    const newErrors: AuthErrors = {
      confirmPassword: false,
      password: false,
      email: false,
    };
    if (password !== confirmPassword || !confirmPassword)
      newErrors.confirmPassword = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = true;
      setAuthError((prev) => ({ ...prev, email: "Invalid email" }));
    }
    if (!password) newErrors.password = true;
    if (password.length < 6) {
      setAuthError((prev) => ({ ...prev, password: t("auth.error") }));
      newErrors.password = true;
      newErrors.confirmPassword = true;
    }

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrors({ password: true, email: true, confirmPassword: true });
      return;
    }
    console.log("User signed up successfully:", data);

    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setShowModal(true);
  }

  function onBack(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    setEmail("");
    setPassword("");
    setConfirmPassword("");

    navigate("/");
  }

  return (
    <>
      <div className="container">
        <div className={styles.formContainer}>
          <h1 className={styles.heading}>{t("auth.signup")}</h1>
          <div className={styles.inputBox}>
            <div className={styles.inputContainer}>
              <label htmlFor="email" className={styles.inputText}>
                {t("auth.email")}
              </label>
              <input
                id="email"
                className={cn(styles.input, errors.email && "error")}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    email: false,
                    password: false,
                  }));
                  setAuthError({ email: "", password: "" });
                }}
              />
              {authError.email && (
                <p className="errorMessage">{authError.email}</p>
              )}
            </div>
            <div className={styles.inputContainer}>
              <label htmlFor="password" className={styles.inputText}>
                {t("auth.password")}
              </label>
              <input
                id="password"
                className={cn(styles.input, errors.password && "error")}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    email: false,
                    password: false,
                  }));
                  setAuthError({ email: "", password: "" });
                }}
              />
              {authError.password && (
                <p className="errorMessage">{authError.password}</p>
              )}
            </div>
            <div className={cn(styles.inputContainer, styles.fullWidth)}>
              <label htmlFor="confPassword" className={styles.inputText}>
                {t("auth.confirmPass")}
              </label>
              <input
                id="confPassword"
                className={cn(styles.input, errors.confirmPassword && "error")}
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    email: false,
                    password: false,
                  }));
                  setAuthError({ email: "", password: "" });
                }}
              />
              {authError.password && (
                <p className="errorMessage">{authError.password}</p>
              )}
            </div>
            {showModal && (
              <MessageModal
                title={MODAL_TITLE}
                text={MODAL_TEXT}
                onClose={() => {
                  setShowModal(false);
                  navigate("/login");
                }}
              />
            )}
          </div>
          <div className={styles.buttonContainer}>
            <button className="button" onClick={onBack}>
              {t("common.back")}
            </button>
            <button
              className={cn(styles.saveBtn, "button")}
              onClick={handleSignUp}
            >
              {t("auth.signup")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
