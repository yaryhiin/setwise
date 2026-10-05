export type PreferredWeightUnit = "kg" | "lb";
export type PreferredMeasurementUnit = "cm" | "in";

export type CheckinFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "off";

export type ProfileDB = {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: string;
  preferred_weight_unit: PreferredWeightUnit;
  preferred_workout_unit: PreferredWeightUnit;
  preferred_measurement_unit: PreferredMeasurementUnit;
  first_day_of_week: string;
  weight_checkin_frequency: CheckinFrequency;
  measurements_checkin_frequency: CheckinFrequency;
  created_at: string;
  updated_at: string | null;
};

export type Profile = {
  name: string;
  date_of_birth: string | null;
  preferred_weight_unit: PreferredWeightUnit;
  preferred_workout_unit: PreferredWeightUnit;
  preferred_measurement_unit: PreferredMeasurementUnit;
  first_day_of_week: string;
  weight_checkin_frequency: CheckinFrequency;
  measurements_checkin_frequency: CheckinFrequency;
};
