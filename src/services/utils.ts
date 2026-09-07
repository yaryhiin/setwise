import i18n from "../i18n";
import type {
  PreferredMeasurementUnit,
  PreferredWeightUnit,
} from "../types/profile";

const locales = {
  en: "en-CA",
  uk: "uk-UA",
  ru: "ru-RU",
  es: "es-ES",
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(
    locales[i18n.language as keyof typeof locales] ?? "en-CA",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

export const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function formatTime(totalSeconds: number, type: string): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (type === "rest") {
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  } else if (type === "workout") {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  } else {
    return "";
  }
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function createLocalId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getDaysSince(dateString: string): number {
  const measuredDate = new Date(dateString);

  if (Number.isNaN(measuredDate.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  const today = new Date();

  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const measuredUtc = Date.UTC(
    measuredDate.getFullYear(),
    measuredDate.getMonth(),
    measuredDate.getDate(),
  );

  return Math.round((todayUtc - measuredUtc) / (1000 * 60 * 60 * 24));
}

export function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatValueBasedOnUnit(
  value: number,
  unit: PreferredMeasurementUnit | PreferredWeightUnit,
): number {
  switch (unit) {
    case "kg":
    case "cm":
      return value;
    case "lb":
      return Math.round(value * 2.20462262 * 10) / 10;
    case "in":
      return Math.round((value / 2.54) * 10) / 10;
  }
}
