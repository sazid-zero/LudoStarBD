import { prisma } from "./prisma";

export const DEFAULT_SETTINGS: Record<string, string> = {
  video_homepage: "https://www.youtube.com/watch?v=Y7VWtTgX0Rc",
  video_dashboard: "https://www.youtube.com/watch?v=Y7VWtTgX0Rc",
  video_matches: "https://www.youtube.com/watch?v=Y7VWtTgX0Rc",
};

/**
 * Fetch a single setting by key, with default fallback
 */
export async function getSetting(key: string): Promise<string> {
  try {
    const item = await prisma.appSetting.findUnique({
      where: { key },
    });
    return item?.value || DEFAULT_SETTINGS[key] || "";
  } catch (error) {
    console.error(`Failed to get setting "${key}":`, error);
    return DEFAULT_SETTINGS[key] || "";
  }
}

/**
 * Fetch multiple settings or all default settings
 */
export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
  try {
    const items = await prisma.appSetting.findMany({
      where: keys ? { key: { in: keys } } : undefined,
    });

    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const item of items) {
      result[item.key] = item.value;
    }

    if (keys) {
      const filtered: Record<string, string> = {};
      for (const k of keys) {
        filtered[k] = result[k] ?? "";
      }
      return filtered;
    }

    return result;
  } catch (error) {
    console.error("Failed to get settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Upsert a single setting
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * Upsert multiple settings
 */
export async function updateSettings(settings: Record<string, string>): Promise<void> {
  const operations = Object.entries(settings).map(([key, value]) =>
    prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  );

  await prisma.$transaction(operations);
}
