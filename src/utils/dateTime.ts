/**
 * Centralized Date & Time Engine for Pakistan Business Operations (Asia/Karachi, UTC+5)
 * Strict enforcement of business day boundaries, time extraction, and date presets.
 */

export const BUSINESS_TIMEZONE = 'Asia/Karachi';

/**
 * Returns the current date in Asia/Karachi timezone formatted as YYYY-MM-DD.
 */
export function getKarachiToday(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date()); // Outputs YYYY-MM-DD
}

/**
 * Returns the current time in Asia/Karachi timezone formatted as HH:mm.
 */
export function getKarachiNowTime(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date());
}

/**
 * Returns the full current timestamp in Asia/Karachi timezone (ISO-like string).
 */
export function getKarachiTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Helper to offset a YYYY-MM-DD date string by N days.
 */
export function offsetDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Construct date in UTC to avoid browser-local timezone offset shifts
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dt = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

/**
 * Computes exact start and end dates (YYYY-MM-DD) for standard financial presets in Asia/Karachi.
 */
export function getKarachiDatePreset(preset: string): { fromDate: string; toDate: string } {
  const today = getKarachiToday();
  const [yearNum, monthNum, dayNum] = today.split('-').map(Number);

  switch (preset) {
    case 'TODAY':
      return { fromDate: today, toDate: today };

    case 'YESTERDAY': {
      const yesterday = offsetDays(today, -1);
      return { fromDate: yesterday, toDate: yesterday };
    }

    case 'THIS_WEEK': {
      // Assuming week starts on Monday
      const d = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
      const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = offsetDays(today, diffToMonday);
      const sunday = offsetDays(monday, 6);
      return { fromDate: monday, toDate: sunday };
    }

    case 'LAST_WEEK': {
      const thisWeekMonday = getKarachiDatePreset('THIS_WEEK').fromDate;
      const lastWeekMonday = offsetDays(thisWeekMonday, -7);
      const lastWeekSunday = offsetDays(lastWeekMonday, 6);
      return { fromDate: lastWeekMonday, toDate: lastWeekSunday };
    }

    case 'THIS_MONTH': {
      const mStr = String(monthNum).padStart(2, '0');
      const startOfMonth = `${yearNum}-${mStr}-01`;
      // Last day of month: day 0 of next month
      const lastDayDate = new Date(Date.UTC(yearNum, monthNum, 0));
      const endOfMonth = `${yearNum}-${mStr}-${String(lastDayDate.getUTCDate()).padStart(2, '0')}`;
      return { fromDate: startOfMonth, toDate: endOfMonth };
    }

    case 'LAST_MONTH': {
      let prevYear = yearNum;
      let prevMonth = monthNum - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      const mStr = String(prevMonth).padStart(2, '0');
      const startOfMonth = `${prevYear}-${mStr}-01`;
      const lastDayDate = new Date(Date.UTC(prevYear, prevMonth, 0));
      const endOfMonth = `${prevYear}-${mStr}-${String(lastDayDate.getUTCDate()).padStart(2, '0')}`;
      return { fromDate: startOfMonth, toDate: endOfMonth };
    }

    case 'LAST_7_DAYS': {
      const from = offsetDays(today, -6);
      return { fromDate: from, toDate: today };
    }

    case 'LAST_30_DAYS': {
      const from = offsetDays(today, -29);
      return { fromDate: from, toDate: today };
    }

    case 'THIS_QUARTER': {
      const q = Math.floor((monthNum - 1) / 3);
      const startMonth = q * 3 + 1;
      const endMonth = startMonth + 2;
      const startStr = `${yearNum}-${String(startMonth).padStart(2, '0')}-01`;
      const lastDayDate = new Date(Date.UTC(yearNum, endMonth, 0));
      const endStr = `${yearNum}-${String(endMonth).padStart(2, '0')}-${String(lastDayDate.getUTCDate()).padStart(2, '0')}`;
      return { fromDate: startStr, toDate: endStr };
    }

    case 'THIS_YEAR': {
      return { fromDate: `${yearNum}-01-01`, toDate: `${yearNum}-12-31` };
    }

    case 'ALL':
    default:
      return { fromDate: '', toDate: '' };
  }
}

/**
 * Formats date and time nicely for UI display in Pakistan business format.
 */
export function formatKarachiDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
