import { NextResponse } from "next/server";
import { uploadScreenshotProof } from "@/lib/cloudinary";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি।" }, { status: 400 });
    }

    // Validate image mime type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "অনুগ্রহ করে একটি ছবি (JPEG, PNG) আপলোড করুন।" }, { status: 400 });
    }

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে।" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await uploadScreenshotProof(buffer, file.name);

    return NextResponse.json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "ছবি আপলোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
