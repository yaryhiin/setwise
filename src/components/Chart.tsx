import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import styles from "../styles/modules/Chart.module.scss";

import type { ChartBriefInfo, ChartData } from "../types/chart";

import { formatTime } from "../services/utils";
import { ArrowRight } from "lucide-react";

const days = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function parseDate(value: string): Date {
  // "YYYY-MM-DD" strings get parsed in local time (new Date() alone
  // would treat them as UTC and can shift the date by a day)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function getCalendarDayTimestamp(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDifferenceInDays(firstDate: Date, secondDate: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return (
    (getCalendarDayTimestamp(secondDate) - getCalendarDayTimestamp(firstDate)) /
    millisecondsPerDay
  );
}

type ChartProps = {
  chartData: ChartData[];
  yPadding: number;
  label: string;
  unit: string;
  firstDayOfTheWeek: string;
  entriesLink?: string;
};

type Range = "1w" | "1m" | "3m" | "all";

const Chart = ({
  chartData,
  yPadding,
  label,
  unit,
  firstDayOfTheWeek,
  entriesLink,
}: ChartProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [range, setRange] = useState<Range>("all");
  const [filteredData, setFilteredData] = useState<ChartData[]>();
  const [briefData, setBriefData] = useState<ChartBriefInfo>();
  const [newLabel, setNewLabel] = useState(label);
  const [chartWidth, setChartWidth] = useState(350);

  useEffect(() => {
    if (chartData.length === 0) {
      setFilteredData([]);
      setBriefData({
        current: 0,
        change: 0,
        entries: 0,
      });
      return;
    }
    let formatted: ChartData[] = [];

    // Amount of data can be become very large on chart, so
    // if user selected "all" or "3m" range, we show average of each week,
    // based on first day of the week selected in profile
    if (label.includes(t("label.bw")) && (range === "all" || range === "3m")) {
      setNewLabel(t("label.avgWeight"));
      const firstDayOfTheWeekIndex = days.indexOf(
        firstDayOfTheWeek.toLowerCase(),
      );
      let count = 0;
      let total = 0;
      let i = 0;
      let firstDate = new Date(chartData[0].date);

      // Counting first week manually to avoid skipping the first week average
      // if it doesn't start on the first day of the week
      do {
        total += chartData[i].value;
        i++;
        count++;
      } while (
        i < chartData.length &&
        getDifferenceInDays(firstDate, new Date(chartData[i].date)) < 7 &&
        new Date(chartData[i].date).getDay() !== firstDayOfTheWeekIndex
      );
      formatted.push({
        date: firstDate.toISOString(),
        value: Math.round((total / count) * 100) / 100,
      });

      if (i < chartData.length) {
        count = 0;
        total = 0;
        firstDate = new Date(chartData[i].date);
        for (i; i < chartData.length; i++) {
          // If it's the last entry, we need to push the average of the last week
          if (i === chartData.length - 1) {
            count++;
            total += chartData[i].value;
            formatted.push({
              date: firstDate.toISOString(),
              value: Math.round((total / count) * 100) / 100,
            });
            break;
          }

          // If the date is already a next week, we push the average of previous and start counting the new week
          if (getDifferenceInDays(firstDate, new Date(chartData[i].date)) > 6) {
            formatted.push({
              date: firstDate.toISOString(),
              value: Math.round((total / count) * 100) / 100,
            });
            count = 1;
            total = chartData[i].value;
            firstDate = new Date(chartData[i].date);
            continue;
          }
          count++;
          total += chartData[i].value;
        }
      }
    } else {
      if (range === "all") {
        setNewLabel(label);
        formatted = chartData;
      } else {
        setNewLabel(label);
        const today = new Date();

        const days =
          range === "1w" ? 7 : range === "1m" ? 30 : range === "3m" ? 90 : 0;

        const cutOffDate = new Date();
        cutOffDate.setDate(today.getDate() - days);

        formatted = chartData.filter((entry) => {
          const entryDate = parseDate(entry.date);
          return entryDate >= cutOffDate;
        });
      }
    }
    setFilteredData(formatted);
    setChartWidth(Math.max(formatted.length * 30, 320));

    if (formatted.length === 0) {
      setBriefData({
        current: 0,
        change: 0,
        entries: 0,
      });
      return;
    }

    const entries = formatted.length;

    const firstEntry = formatted[0];
    const currentEntry = formatted[formatted.length - 1];

    const current = currentEntry.value ?? 0;

    const change =
      currentEntry && firstEntry
        ? Math.round((currentEntry.value - firstEntry.value) * 100) / 100
        : 0;

    setBriefData({ current, change, entries });
  }, [range, chartData]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chart}>
        <ResponsiveContainer width={chartWidth} height={260}>
          <LineChart data={filteredData}>
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                return new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              minTickGap={25}
            />
            <YAxis
              domain={[`dataMin - ${yPadding}`, `dataMax + ${yPadding}`]}
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text)",
              }}
              labelStyle={{
                color: "var(--text)",
              }}
              labelFormatter={(date) =>
                new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }
              formatter={(value) => [
                `${unit === "seconds" ? formatTime(Number(value), "rest") : value}${unit !== "seconds" ? t(`units.${unit}`) : ""}`,
                newLabel,
              ]}
            />
            <Line type="monotone" dataKey="value" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.rangeButtons}>
        <button
          className={`${styles.rangeBtn} ${range === "1w" && styles.active}`}
          onClick={() => setRange("1w")}
        >
          {t("frequency.1w")}
        </button>
        <button
          className={`${styles.rangeBtn} ${range === "1m" && styles.active}`}
          onClick={() => setRange("1m")}
        >
          {t("frequency.1m")}
        </button>
        <button
          className={`${styles.rangeBtn} ${range === "3m" && styles.active}`}
          onClick={() => {
            setRange("3m");
          }}
        >
          {t("frequency.3m")}
        </button>
        <button
          className={`${styles.rangeBtn} ${range === "all" && styles.active}`}
          onClick={() => setRange("all")}
        >
          {t("frequency.all")}
        </button>
      </div>
      <div className={styles.briefInfo}>
        <div>
          <p>{t("chart.current")}</p>
          <p>
            {briefData?.current}
            {t(`units.${unit}`)}
          </p>
        </div>
        <div>
          <p>{t("chart.change")}</p>
          <p>
            {briefData && briefData.change >= 0 && "+"}
            {briefData?.change}
            {t(`units.${unit}`)}
          </p>
        </div>
        <div>
          <p
            className={entriesLink ? styles.entriesLink : ""}
            onClick={() => {
              if (entriesLink) navigate(entriesLink);
            }}
          >
            {t("chart.entries")}{" "}
            {entriesLink && (
              <ArrowRight
                onClick={() => {
                  if (entriesLink) navigate(entriesLink);
                }}
                size={15}
              />
            )}
          </p>
          <p
            onClick={() => {
              if (entriesLink) navigate(entriesLink);
            }}
          >
            {briefData?.entries}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chart;
