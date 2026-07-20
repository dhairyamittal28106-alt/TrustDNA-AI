const indiaTimeZone = "Asia/Kolkata";

/** Formats a backend ISO timestamp in India Standard Time for TrustDNA UI. */
export function formatIndiaTimestamp(value: string, includeSeconds = false) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    timeZone: indiaTimeZone,
    timeZoneName: "short",
  });
  return formatter.formatToParts(new Date(value)).map((part) => part.type === "timeZoneName" ? "IST" : part.value).join("");
}

/** Formats an investigation timeline event in India Standard Time. */
export function formatIndiaTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: indiaTimeZone,
  }).format(new Date(value));
}
