export interface InfoCard {
  number: string;
  title: string;
  description: string;
}

export const INFO_CARDS: InfoCard[] = [
  {
    number: "01",
    title: "SENSE",
    description:
      "Collect live environmental signals from distributed sensor nodes.",
  },
  {
    number: "02",
    title: "UNDERSTAND",
    description:
      "Detect anomalies and identify emerging hazard patterns.",
  },
  {
    number: "03",
    title: "CORRELATE",
    description:
      "Estimate how risk is evolving across the monitored environment.",
  },
  {
    number: "04",
    title: "PREDICT & ACT",
    description:
      "Predict how risk may evolve and enable timely, localized response.",
  },
];
