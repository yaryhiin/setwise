import { useState } from "react";

type ActionState =
  | { phase: "idle" }
  | { phase: "loading"; type: string }
  | { phase: "success" }
  | { phase: "error" };

export function useAsyncAction() {
  const [state, setState] = useState<ActionState>({
    phase: "idle",
  });

  async function run(type: string, action: () => Promise<void>) {
    setState({ phase: "loading", type });
    try {
      await action();
      setState({ phase: "success" });
      setTimeout(() => {
        setState({ phase: "idle" });
      }, 1000);
      return true;
    } catch (error) {
      console.error("Error adding exercise:", error);
      setState({ phase: "error" });
      setTimeout(() => {
        setState({ phase: "idle" });
      }, 3000);
      return false;
    }
  }

  return { run, state };
}
