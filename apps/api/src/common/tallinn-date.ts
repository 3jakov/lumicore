/**
 * Tallinn timezone utilities — no external dependencies.
 * Uses the offset-correction technique from TimeTrackingService to handle
 * DST correctly (UTC+2 winter / UTC+3 summer).
 */

const TZ = 'Europe/Tallinn';

/** Returns today's date string in YYYY-MM-DD format (Tallinn timezone). */
export function getTallinToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Convert a YYYY-MM-DD date string to a UTC Date representing either the
 * start (00:00:00) or end (23:59:59) of that calendar day in Tallinn.
 * DST-safe: mirrors the technique used in TimeTrackingService.tallinDayBoundary().
 */
function tallinDayBoundary(dateStr: string, endOfDay: boolean): Date {
  const timeStr = endOfDay ? 'T23:59:59' : 'T00:00:00';
  const estimate = new Date(dateStr + timeStr + 'Z');

  const tallinLocalStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(estimate);

  const tallinAsUtc = new Date(tallinLocalStr.replace(' ', 'T') + 'Z');
  const offsetMs = tallinAsUtc.getTime() - estimate.getTime();
  return new Date(estimate.getTime() - offsetMs);
}

/** Returns the start-of-day UTC Date for a YYYY-MM-DD string in Tallinn timezone. */
export function tallinDayStart(dateStr: string): Date {
  return tallinDayBoundary(dateStr, false);
}

/** Returns the end-of-day UTC Date for a YYYY-MM-DD string in Tallinn timezone. */
export function tallinDayEnd(dateStr: string): Date {
  return tallinDayBoundary(dateStr, true);
}
