import { normalizeKSTDateString } from './dateUtils';

const padTwoDigits = (value) => String(value).padStart(2, '0');

export const weekInfoToDateKey = (weekInfo) => {
  if (!weekInfo || typeof weekInfo !== 'object') return null;
  const { year, month, day } = weekInfo;
  if (
    typeof year !== 'number' ||
    typeof month !== 'number' ||
    typeof day !== 'number'
  ) {
    return null;
  }
  return `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`;
};

export const normalizeDateKey = (value) => normalizeKSTDateString(value);

export const filterReportsByWeek = (reports = [], weekInfo) => {
  const targetKey = weekInfoToDateKey(weekInfo);
  if (!targetKey) {
    return Array.isArray(reports) ? reports : [];
  }

  return (reports || []).filter((report) => {
    const reportKey = normalizeDateKey(report?.report_date);
    return reportKey === targetKey;
  });
};
