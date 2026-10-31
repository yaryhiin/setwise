import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useTranslation } from "react-i18next";
import { BookOpen, Mail, Pencil } from "lucide-react";

import styles from "../styles/modules/OAuthConsent.module.scss";

import LoadingScreen from "../components/LoadingScreen";
import InfoModal from "../components/InfoModal";

import { useAsyncAction } from "../hooks/useAsyncAction";

type AuthorizationDetails = Extract<
  NonNullable<
    Awaited<
      ReturnType<typeof supabase.auth.oauth.getAuthorizationDetails>
    >["data"]
  >,
  { authorization_id: string }
>;

const OAuthConsent = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { run, state } = useAsyncAction();

  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState("");
  const authorizationId = searchParams.get("authorization_id");

  useEffect(() => {
    async function loadAuthorization() {
      if (!authorizationId) {
        setError("Missing authorization ID");
        return;
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        const returnUrl = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
        navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, {
          replace: true,
        });
        return;
      }

      const { data, error } =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

      if (error || !data) {
        setError(error?.message ?? "Invalid authorization request");
        return;
      }

      // Existing consent may allow an immediate redirect.

      if (!("authorization_id" in data)) {
        window.location.assign(data.redirect_url);
        return;
      }
      setDetails(data);
    }

    void loadAuthorization();
  }, [authorizationId, navigate]);

  async function handleAuthorize() {
    if (!authorizationId) return;

    await run("saving", async () => {
      const { data, error } =
        await supabase.auth.oauth.approveAuthorization(authorizationId);

      if (error || !data) {
        setError(error?.message ?? "Authorization failed");
        return;
      }

      window.location.assign(data.redirect_url);
    });
  }

  async function handleDeny() {
    if (!authorizationId) return;

    await run("saving", async () => {
      const { data, error } =
        await supabase.auth.oauth.denyAuthorization(authorizationId);

      if (error || !data) {
        setError(error?.message ?? "Failed to deny authorization");
        return;
      }

      window.location.assign(data.redirect_url);
    });
  }

  if (error) return <p>{error}</p>;
  if (!details) return <LoadingScreen />;

  return (
    <div className={styles.consentContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("oAuth.header")} {details.client.name}?
        </h2>
        <h3 className={styles.desc}>
          {details.client.name} {t("oAuth.desc")}
        </h3>
      </div>
      <hr />
      <div className={styles.body}>
        <div className={styles.scope}>
          <p className={styles.title}>{t("oAuth.scope.title")}</p>
          <p className={styles.text}>
            <Mail />
            {t("oAuth.scope.text")} {details.scope}
          </p>
        </div>
        <div className={styles.capabilities}>
          <p className={styles.title}>{t("oAuth.capabilities.title")}</p>
          <p className={styles.text}>
            <BookOpen /> {t("oAuth.capabilities.text.1")}
          </p>
          <p className={styles.text}>
            <Pencil /> {t("oAuth.capabilities.text.2")}
          </p>
        </div>
      </div>
      <div className={styles.buttons}>
        <button
          className={styles.deny}
          disabled={state.phase !== "idle"}
          onClick={handleDeny}
        >
          {t("oAuth.deny")}
        </button>
        <button
          className={styles.authorize}
          disabled={state.phase !== "idle"}
          onClick={handleAuthorize}
        >
          {t("oAuth.authorize")}
        </button>
      </div>
      <InfoModal state={state} />
    </div>
  );
};

export default OAuthConsent;
