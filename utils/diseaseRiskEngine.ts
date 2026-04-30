export type GrowthStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "mature";

export type RiskLevel = "low" | "medium" | "high";

export type WeatherSignal = {
  timestamp: number;
  tempC: number;
  humidity: number;
  rainMm: number;
  windMs: number;
};

export type DiseaseRiskDriver = {
  id: "fungal" | "bacterial" | "heat_stress" | "wind_spread";
  label: string;
  level: RiskLevel;
  score: number;
  reason: string;
};

export type DiseaseRiskAssessment = {
  level: RiskLevel;
  score: number;
  crop: string;
  stage?: GrowthStage;
  summary: string;
  timeline: string;
  badge: string;
  drivers: DiseaseRiskDriver[];
};

type OpenWeatherForecastResponse = {
  list?: Array<{
    dt: number;
    main?: { temp?: number; humidity?: number };
    rain?: { ["3h"]?: number };
    wind?: { speed?: number };
  }>;
};

const OPEN_WEATHER_BASE = "https://api.openweathermap.org/data/2.5/forecast";

export async function fetchWeatherSignals(params: {
  lat: number;
  lon: number;
}): Promise<WeatherSignal[]> {
  const key = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY?.trim() || "5b9be1ed2e4dab460568005514d306d3";
  if (!key) {
    return fallbackSignals();
  }

  try {
    const url =
      `${OPEN_WEATHER_BASE}?lat=${params.lat}&lon=${params.lon}` +
      `&units=metric&appid=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return fallbackSignals();
    }
    const data = (await response.json()) as OpenWeatherForecastResponse;
    const list = data.list ?? [];
    const mapped = list.slice(0, 16).map<WeatherSignal>((item) => ({
      timestamp: (item.dt ?? Math.floor(Date.now() / 1000)) * 1000,
      tempC: item.main?.temp ?? 24,
      humidity: item.main?.humidity ?? 65,
      rainMm: item.rain?.["3h"] ?? 0,
      windMs: item.wind?.speed ?? 2,
    }));

    return mapped.length ? mapped : fallbackSignals();
  } catch {
    return fallbackSignals();
  }
}

export function computeDiseaseRisk(input: {
  crop: string;
  stage?: GrowthStage;
  current: WeatherSignal;
  forecast: WeatherSignal[];
}): DiseaseRiskAssessment {
  const currentEval = evaluateSignals(input.current);
  const peak48h = input.forecast
    .filter((item) => item.timestamp <= input.current.timestamp + 48 * 60 * 60 * 1000)
    .map((item) => evaluateSignals(item).score)
    .reduce((max, value) => Math.max(max, value), currentEval.score);

  const delta = peak48h - currentEval.score;
  const timeline =
    delta >= 15
      ? "Risk increasing in next 24-48h"
      : delta <= -10
        ? "Risk easing in next 24-48h"
        : "Risk stable in next 24-48h";

  const { score, level, drivers } = currentEval;
  const summary = buildSummary(level, drivers);

  return {
    level,
    score,
    crop: input.crop,
    stage: input.stage,
    summary,
    timeline,
    badge: riskBadge(level),
    drivers: drivers.slice(0, 3),
  };
}

function evaluateSignals(signal: WeatherSignal): {
  score: number;
  level: RiskLevel;
  drivers: DiseaseRiskDriver[];
} {
  const drivers: DiseaseRiskDriver[] = [];

  if (signal.humidity > 80 && signal.tempC >= 18 && signal.tempC <= 28) {
    drivers.push({
      id: "fungal",
      label: "Fungal diseases",
      level: "high",
      score: 55,
      reason: "Humidity above 80% with moderate temperatures favors mildew and blight.",
    });
  } else if (signal.humidity > 70 && signal.tempC >= 16 && signal.tempC <= 31) {
    drivers.push({
      id: "fungal",
      label: "Fungal diseases",
      level: "medium",
      score: 32,
      reason: "Moist air and mild temperatures can accelerate fungal spread.",
    });
  }

  if (signal.rainMm > 12 && signal.humidity > 80) {
    drivers.push({
      id: "bacterial",
      label: "Bacterial diseases",
      level: "high",
      score: 42,
      reason: "Heavy rain and high humidity increase splash transmission risk.",
    });
  } else if (signal.rainMm > 5 && signal.humidity > 70) {
    drivers.push({
      id: "bacterial",
      label: "Bacterial diseases",
      level: "medium",
      score: 28,
      reason: "Recent rain and humidity create favorable bacterial infection pressure.",
    });
  }

  if (signal.tempC > 35) {
    drivers.push({
      id: "heat_stress",
      label: "Heat stress",
      level: "high",
      score: 45,
      reason: "Temperature over 35C can stress plants and increase susceptibility.",
    });
  } else if (signal.tempC > 32) {
    drivers.push({
      id: "heat_stress",
      label: "Heat stress",
      level: "medium",
      score: 24,
      reason: "High temperature conditions may require tighter irrigation control.",
    });
  }

  if (signal.windMs > 9 && signal.humidity > 65) {
    drivers.push({
      id: "wind_spread",
      label: "Wind-driven spread",
      level: "medium",
      score: 14,
      reason: "Wind can move spores between nearby plots under humid conditions.",
    });
  }

  const score = Math.min(
    100,
    drivers.reduce((sum, driver) => sum + driver.score, 0)
  );
  const level = score >= 65 ? "high" : score >= 35 ? "medium" : "low";

  return { score, level, drivers };
}

function buildSummary(level: RiskLevel, drivers: DiseaseRiskDriver[]) {
  if (!drivers.length) {
    return "Current conditions are not strongly favorable for major disease pressure. Keep routine scouting every 2-3 days.";
  }

  const primary = drivers[0];
  if (level === "high") {
    return `Conditions are highly favorable for ${primary.label.toLowerCase()} due to ${primary.reason.toLowerCase()}`;
  }
  if (level === "medium") {
    return `Moderate disease pressure detected. ${primary.reason}`;
  }
  return `Low immediate risk. ${primary.reason}`;
}

function riskBadge(level: RiskLevel) {
  if (level === "high") return "RED";
  if (level === "medium") return "YELLOW";
  return "GREEN";
}

function fallbackSignals(): WeatherSignal[] {
  const now = Date.now();
  return Array.from({ length: 8 }, (_, index) => ({
    timestamp: now + index * 6 * 60 * 60 * 1000,
    tempC: 22 + index * 0.8,
    humidity: Math.max(56, 74 - index * 2),
    rainMm: index === 1 ? 6 : index === 2 ? 3 : 0,
    windMs: 2 + (index % 3),
  }));
}
