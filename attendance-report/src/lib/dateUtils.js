const MS_PER_MINUTE = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MINUTES = 9 * 60;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const parseDateInput = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(ISO_DATE_PATTERN);
    if (match) {
      const normalized = `${match[1]}-${match[2]}-${match[3]}`;
      const parsed = new Date(`${normalized}T00:00:00+09:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (value == null) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ensureDate = (value) => parseDateInput(value) ?? new Date();

const shiftToKST = (date) => new Date(date.getTime() + KST_OFFSET_MINUTES * MS_PER_MINUTE);

const formatShiftedDate = (shiftedDate) => shiftedDate.toISOString().slice(0, 10);

export const formatDateToKSTString = (value = new Date()) => {
  const baseDate = ensureDate(value);
  const shifted = shiftToKST(baseDate);
  return formatShiftedDate(shifted);
};

export const normalizeKSTDateString = (value) => {
  if (typeof value === 'string') {
    const match = value.trim().match(ISO_DATE_PATTERN);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const parsed = parseDateInput(value);
  if (!parsed) {
    return null;
  }

  return formatDateToKSTString(parsed);
};

export const getKSTDateParts = (value) => {
  const normalized = normalizeKSTDateString(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  return { year, month, day };
};

const getUTCFromKSTDateString = (value) => {
  const parts = getKSTDateParts(value);
  if (!parts) return null;
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day);
  return new Date(utcMs - KST_OFFSET_MINUTES * MS_PER_MINUTE);
};

export const createDateFromKSTString = (value) => {
  const normalized = normalizeKSTDateString(value);
  if (!normalized) return null;
  return new Date(`${normalized}T00:00:00+09:00`);
};

export const getSundayOfWeekKST = (value = new Date()) => {
  const baseDate = ensureDate(value);
  const shifted = shiftToKST(baseDate);
  const day = shifted.getUTCDay();
  shifted.setUTCDate(shifted.getUTCDate() - day);
  return formatShiftedDate(shifted);
};

export const getWeekRangeKST = (value = new Date()) => {
  const baseDate = ensureDate(value);
  const shifted = shiftToKST(baseDate);
  const start = new Date(shifted);
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - day);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    start: formatShiftedDate(start),
    end: formatShiftedDate(end),
    sunday: formatShiftedDate(start),
  };
};

export const addDaysToKSTDate = (value, days = 0) => {
  const baseDate = ensureDate(value);
  const shifted = shiftToKST(baseDate);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return formatShiftedDate(shifted);
};

export const isNowWithinKSTWeek = (sundayDateString) => {
  const start = getUTCFromKSTDateString(sundayDateString);
  if (!start) return false;
  const end = new Date(start.getTime() + 7 * DAY_MS);
  const now = new Date();
  return now >= start && now < end;
};

export const formatKSTDateHuman = (value, { includeYear = true } = {}) => {
  const parts = getKSTDateParts(value);
  if (!parts) return '';
  if (includeYear) {
    return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
  }
  return `${parts.month}월 ${parts.day}일`;
};
