export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "ora";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return m === 1 ? "un minuto fa" : `${m} minuti fa`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return h === 1 ? "un'ora fa" : `${h} ore fa`;
  }
  if (diffSec < 604800) {
    const d = Math.floor(diffSec / 86400);
    return d === 1 ? "ieri" : `${d} giorni fa`;
  }
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
