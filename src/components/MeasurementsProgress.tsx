import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

import { useTranslation } from "react-i18next";

import styles from "../styles/modules/ProgressComponents.module.scss";

import Chart from "./Chart";
import {
  getMeasurementTypes,
  getMeasurementsHistory,
} from "../services/measurements";
import { formatValueBasedOnUnit } from "../utils/utils";

import type {
  MeasurementTypeDB,
  MeasurementLogDB,
} from "../types/measurements";
import type { ChartData } from "../types/chart";

type MeasurementsProgressProps = {
  unit: "cm" | "in";
  firstDayOfTheWeek: string;
};

const MeasurementsProgress = ({
  unit,
  firstDayOfTheWeek,
}: MeasurementsProgressProps) => {
  const { t } = useTranslation();

  const [measurementsData, setMeasurementsData] = useState<MeasurementLogDB[]>(
    [],
  );
  const [measurementTypes, setMeasurementTypes] =
    useState<MeasurementTypeDB[]>();

  const [chosenType, setChosenType] = useState<MeasurementTypeDB>();
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getData() {
      setLoading(true);
      try {
        const types = await getMeasurementTypes();
        const logs = await getMeasurementsHistory();
        if (!types || !logs) {
          return;
        }
        setMeasurementTypes(types);
        setMeasurementsData(logs);
        setChosenType(types[0]);
      } catch (error) {
        console.error("Error fetching measurements data:", error);
      } finally {
        setLoading(false);
      }
    }

    getData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const chosenData = measurementsData.filter(
      (data) => data.measurement_type_id === chosenType?.id,
    );

    const formattedData = chosenData.map((data) => ({
      date: data.measured_at,
      value: formatValueBasedOnUnit(data.value_cm, unit),
    }));

    setFilteredData(formattedData);
  }, [chosenType]);

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("measurementsProgress.title")}</h2>
        <div className={styles.selectGroup}>
          <label>{t("measurementsProgress.description")}</label>
          {measurementTypes && measurementTypes.length > 0 ? (
            <select
              value={chosenType?.id}
              onChange={(e) => {
                const selectedType = measurementTypes.find(
                  (type) => type.id === e.target.value,
                );

                setChosenType(selectedType);
              }}
            >
              {measurementTypes?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          ) : (
            <p>{t("measurementsProgress.emptyState")}</p>
          )}
        </div>
      </div>
      <Chart
        chartData={filteredData}
        yPadding={2}
        label={chosenType?.name ?? t("measurementsProgress.nameFallBack")}
        unit={unit}
        firstDayOfTheWeek={firstDayOfTheWeek}
        entriesLink="/progress/measurements"
      />
    </div>
  );
};

export default MeasurementsProgress;
