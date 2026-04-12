const MONTHS: Record<string, string> = {
  january: 'January',
  february: 'February',
  march: 'March',
  april: 'April',
  may: 'May',
  june: 'June',
  july: 'July',
  august: 'August',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',
};

export function formatEta(eta?: string) {
  if (!eta) return '';
  const trimmed = eta.trim();
  if (!trimmed) return '';

  let output = trimmed;
  for (const [lower, proper] of Object.entries(MONTHS)) {
    const re = new RegExp(`\\b${lower}\\b`, 'gi');
    output = output.replace(re, proper);
  }

  return output;
}
