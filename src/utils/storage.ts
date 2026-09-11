export function getPersistedJSON<T>(key: string, fallback: T): T {
  const savedData = localStorage.getItem(key);
  if (!savedData) return fallback;

  try {
    return JSON.parse(savedData) as T;
  } catch {
    // remove corrupted/stale JSON — don't let a bad cached value keep failing forever
    localStorage.removeItem(key);
    return fallback;
  }
}

export function getInitialPreferredUnit(): "kg" | "lb" {
  const PREFERRED_UNIT_KEY = "preferredUnit";
  const savedUnit = localStorage.getItem(PREFERRED_UNIT_KEY);

  return savedUnit === "kg" || savedUnit === "lb" ? savedUnit : "kg";
}

export function getInitialRestStart(key: string) {
  const savedRestStart = localStorage.getItem(key);

  if (savedRestStart) {
    try {
      return savedRestStart;
    } catch {
      localStorage.removeItem(key);
    }
  }

  return new Date().toISOString();
}
