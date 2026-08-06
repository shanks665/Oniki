/** Calendar dates in Asia/Tokyo for GA4 report alignment. */

export function getTokyoCalendarDate(date = new Date()): {
  /** YYYY-MM-DD */
  ymd: string;
  /** YYYYMMDD (GA4 `date` dimension) */
  ymdCompact: string;
  /** YYYYMM (GA4 `yearMonth` dimension) */
  ymCompact: string;
  /** First day of month YYYY-MM-DD */
  firstOfMonth: string;
} {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return {
    ymd,
    ymdCompact: ymd.replace(/-/g, ""),
    ymCompact: ymd.slice(0, 7).replace("-", ""),
    firstOfMonth: `${ymd.slice(0, 7)}-01`,
  };
}
