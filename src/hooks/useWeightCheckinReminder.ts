import { useEffect } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";

import { getLatestWeightLog } from "../services/weightLogs";
import { getDaysSince, getTodayDateString } from "../utils/utils";
import type { Profile } from "../types/profile";

const WEIGHT_CHECKIN_SKIPPED_DATE_KEY = "weightCheckinSkippedDate";

export function useWeightCheckinReminder(
  session: Session | null,
  profile: Profile | null,
  setShowWeightCheckinModal: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    async function checkWeightReminder() {
      const skippedDay = localStorage.getItem(WEIGHT_CHECKIN_SKIPPED_DATE_KEY);
      if (skippedDay === getTodayDateString()) {
        return;
      }
      if (!session || !profile) return;
      const latestWeightLog = await getLatestWeightLog();
      if (!latestWeightLog) {
        if (profile?.weight_checkin_frequency !== "off") {
          setShowWeightCheckinModal(true);
        }
        return;
      }
      const dayDifference = getDaysSince(latestWeightLog.measured_at);
      if (dayDifference >= 1 && profile?.weight_checkin_frequency === "daily") {
        setShowWeightCheckinModal(true);
        return;
      }
      if (
        dayDifference >= 7 &&
        profile?.weight_checkin_frequency === "weekly"
      ) {
        setShowWeightCheckinModal(true);
        return;
      }
    }

    checkWeightReminder();
  }, [session?.user.id, profile?.weight_checkin_frequency]);
}
