import { useEffect } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";

import type { Profile } from "../types/profile";

import { getLatestMeasurementLog } from "../services/measurements";
import { getDaysSince, getTodayDateString } from "../utils/utils";

const MEASUREMENTS_CHECKIN_SKIPPED_DATE_KEY = "measurementsCheckinSkippedDate";

export function useMeasurementsCheckinReminder(
  session: Session | null,
  profile: Profile | null,
  setShowMeasurementsCheckinModal: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    async function checkMeasurementsReminder() {
      const skippedDay = localStorage.getItem(
        MEASUREMENTS_CHECKIN_SKIPPED_DATE_KEY,
      );
      if (skippedDay === getTodayDateString()) {
        return;
      }
      if (!session || !profile) return;
      const latestMeasurementLog = await getLatestMeasurementLog();
      if (!latestMeasurementLog) {
        if (profile?.measurements_checkin_frequency !== "off") {
          setShowMeasurementsCheckinModal(true);
        }
        return;
      }
      const dayDifference = getDaysSince(latestMeasurementLog.measured_at);
      if (
        dayDifference >= 14 &&
        profile?.measurements_checkin_frequency === "biweekly"
      ) {
        setShowMeasurementsCheckinModal(true);
        return;
      }
      if (
        dayDifference >= 28 &&
        profile?.measurements_checkin_frequency === "monthly"
      ) {
        setShowMeasurementsCheckinModal(true);
        return;
      }
    }

    checkMeasurementsReminder();
  }, [session?.user.id, profile?.measurements_checkin_frequency]);
}
