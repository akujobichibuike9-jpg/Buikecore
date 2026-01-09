export type TutorLogItem = {
  id: string;
  ts: number; // timestamp
  question: string;
  answer?: string;
  noteCount: number; // how many stickies were selected
};

const LOG_KEY = "buikecore_tutor_log";
const MAX_ITEMS = 100; // keep last 100

export function readTutorLog(): TutorLogItem[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TutorLogItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addTutorLog(item: TutorLogItem) {
  const list = readTutorLog();
  list.unshift(item);
  localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

export function updateTutorLog(id: string, patch: Partial<TutorLogItem>) {
  const list = readTutorLog();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  localStorage.setItem(LOG_KEY, JSON.stringify(list));
}

export function clearTutorLog() {
  localStorage.removeItem(LOG_KEY);
}
