import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSettings, updateSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({
      success: false,
      settings: DEFAULT_SETTINGS,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত এক্সেস। শুধুমাত্র এডমিন সেটিংস পরিবর্তন করতে পারবেন।" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "অবৈধ ডাটা ফরম্যাট।" },
        { status: 400 }
      );
    }

    // Only allow updating known safe keys or string values
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string") {
        sanitized[key] = value.trim();
      }
    }

    await updateSettings(sanitized);

    const updated = await getSettings();
    return NextResponse.json({
      success: true,
      message: "সেটিংস সফলভাবে সংরক্ষিত হয়েছে!",
      settings: updated,
    });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: "সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
