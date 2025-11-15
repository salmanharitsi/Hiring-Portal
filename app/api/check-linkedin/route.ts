import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validasi format URL
    const regex =
      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9._%-]+\/?$/i;
    if (!regex.test(url)) {
      return NextResponse.json(
        { exists: false, error: "Invalid LinkedIn URL format" },
        { status: 400 }
      );
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Fetch LinkedIn URL
    const response = await fetch(normalizedUrl, {
      method: "HEAD",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Cek apakah di-redirect ke 404
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get("location");
      if (location && location.includes("/404")) {
        return NextResponse.json({ exists: false });
      }
    }

    // Status 200-299 = valid
    // Status 404 = tidak ditemukan
    // Status 999 = LinkedIn rate limit (anggap valid untuk sekarang)
    const exists =
      (response.status >= 200 && response.status < 300) ||
      response.status === 999;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Error checking LinkedIn:", error);
    return NextResponse.json(
      { exists: false, error: "Failed to check LinkedIn profile" },
      { status: 500 }
    );
  }
}