export type ReadingProgress = {
  page: number;
  /** Scroll offset in px within the saved page container */
  offset: number;
  /** 0-100 overall completion */
  percent: number;
  numPages: number;
  updatedAt: number;
};

const PREFIX = "khm:reading-progress:";

const key = (slug: string) => `${PREFIX}${slug}`;

export function loadReadingProgress(slug: string): ReadingProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReadingProgress>;
    if (typeof parsed?.page !== "number" || parsed.page < 1) return null;
    return {
      page: parsed.page,
      offset: typeof parsed.offset === "number" ? parsed.offset : 0,
      percent: typeof parsed.percent === "number" ? parsed.percent : 0,
      numPages: typeof parsed.numPages === "number" ? parsed.numPages : 0,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveReadingProgress(
  slug: string,
  value: Omit<ReadingProgress, "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      key(slug),
      JSON.stringify({ ...value, updatedAt: Date.now() }),
    );
  } catch {
    /* storage unavailable / full — reading still works */
  }
}

export function clearReadingProgress(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(slug));
  } catch {
    /* noop */
  }
}
