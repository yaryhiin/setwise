import { CircleCheck, CircleX, LoaderCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "../styles/modules/InfoModal.module.scss";

type ActionState =
  | { phase: "idle" }
  | { phase: "loading"; type: string }
  | { phase: "success" }
  | { phase: "error" };

type InfoModalProps = {
  state: ActionState;
};

const InfoModal = ({ state }: InfoModalProps) => {
  const { t } = useTranslation();
  type InfoModalType = keyof typeof INFO_MODAL_MESSAGES;
  const displayType = state.phase === "loading" ? state.type : state.phase;

  const INFO_MODAL_MESSAGES = {
    saving: {
      icon: LoaderCircle,
      title: t("infoModal.save.title"),
      text: t("infoModal.save.text"),
      loading: true,
    },

    deleting: {
      icon: LoaderCircle,
      title: t("infoModal.delete.title"),
      text: t("infoModal.delete.text"),
      loading: true,
    },

    success: {
      icon: CircleCheck,
      title: t("infoModal.success.title"),
      text: t("infoModal.success.text"),
      loading: false,
    },

    error: {
      icon: CircleX,
      title: t("infoModal.error.title"),
      text: t("infoModal.error.text"),
      loading: false,
    },
  };

  const message = INFO_MODAL_MESSAGES[displayType as InfoModalType] || {
    icon: Info,
    title: t("infoModal.info.title"),
    text: t("infoModal.info.text"),
    loading: false,
  };

  const Icon = message.icon;

  if (state.phase === "idle") return null;

  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <h2 className={styles.icon}>
          {
            <Icon
              size={32}
              strokeWidth={2}
              className={message.loading ? styles.infoModal__spinner : ""}
            />
          }
        </h2>
        <div className={styles.message}>
          <h3 className={styles.title}>{message.title}</h3>
          <p className={styles.text}>{message.text}</p>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
