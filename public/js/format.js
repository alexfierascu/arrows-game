// Formatting of numbers, clocks and dates.

export const num = n => Number(n).toLocaleString();

/** Seconds as m:ss, rounded up. */
export function clock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** Milliseconds as "2d 3h", "3h 12m" or "12m". */
export function duration(ms) {
  const m = Math.max(0, Math.floor(ms / 6e4)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60);
  return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m % 60 + 'm' : m % 60 + 'm';
}

/** Local date as YYYY-MM-DD. */
export const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const today = () => ymd(new Date());
