export type ChartData = {
  date: string;
  value: number;
};

export type ChartBriefInfo = {
  current: number;
  change: number;
  entries: number;
};


export type FilterCriteria = 
  "best-set-volume" | "total-volume" | "est-1-rm" | "average-rest-time";
