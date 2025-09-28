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

export const normalizeDateKey = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    if (value.length >= 10) {
      return value.slice(0, 10);
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
};

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
