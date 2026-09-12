import { prisma } from "./prisma";

export const DEFAULT_SETTINGS: Record<string, string> = {
  video_homepage: "https://www.youtube.com/watch?v=Y7VWtTgX0Rc",
  video_dashboard: "https://www.youtube.com/watch?v=Y7VWtTgX0Rc",
  video_matches: "https://www.youtube.com/watch?v=Y7VWtTgX0Rc",
};

async function fetchItemsFromDb(keys?: string[]): Promise<Array<{ key: string; value: string }>> {
  if ((prisma as any)?.appSetting?.findMany) {
    return await (prisma as any).appSetting.findMany({
      where: keys ? { key: { in: keys } } : undefined,
    });
  }

  // Fallback to raw query if Prisma client wasn't re-generated in running process
  if (typeof (prisma as any)?.$queryRawUnsafe === "function") {
    try {
      if (keys && keys.length > 0) {
        const inClause = keys.map((k) => `'${k.replace(/'/g, "''")}'`).join(", ");
        return await (prisma as any).$queryRawUnsafe(`SELECT key, value FROM "AppSetting" WHERE key IN (${inClause})`);
      }
      return await (prisma as any).$queryRawUnsafe(`SELECT key, value FROM "AppSetting"`);
    } catch (rawErr) {
      console.error("Raw query for AppSetting failed:", rawErr);
    }
  }

  return [];
}

async function saveSettingToDb(key: string, value: string): Promise<void> {
  if ((prisma as any)?.appSetting?.upsert) {
    await (prisma as any).appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return;
  }

  if (typeof (prisma as any)?.$executeRawUnsafe === "function") {
    const escapedKey = key.replace(/'/g, "''");
    const escapedVal = value.replace(/'/g, "''");
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "AppSetting" ("key", "value", "updatedAt", "createdAt") VALUES ('${escapedKey}', '${escapedVal}', NOW(), NOW()) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()`
    );
  }
}

/**
 * Fetch a single setting by key, with default fallback
 */
export async function getSetting(key: string): Promise<string> {
  try {
    const items = await fetchItemsFromDb([key]);
    return items[0]?.value || DEFAULT_SETTINGS[key] || "";
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
    const items = await fetchItemsFromDb(keys);

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
  await saveSettingToDb(key, value);
}

/**
 * Upsert multiple settings
 */
export async function updateSettings(settings: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await saveSettingToDb(key, value);
  }
}
