'use client';

import { useReportWebVitals } from 'next/web-vitals';

const logVitals = (metric: { name: string; value: number; rating: string; delta: number }) => {
  // Dev-only logging — remove or gate behind env var after baselines are recorded
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)}ms | delta: ${metric.delta.toFixed(2)} | rating: ${metric.rating}`);
  }
};

export function WebVitalsLogger() {
  useReportWebVitals(logVitals);
  return null;
}
