import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
    const resp = await fetch(`${apiBase}/auth/google`, { redirect: "manual" });
    const location = resp.headers.get("location");
    if (!location) {
      return NextResponse.json({ message: "OAuth redirect not provided by API" }, { status: 502 });
    }
    // Redirect the browser directly to Google's consent page
    return NextResponse.redirect(location, { status: 302 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OAuth initiation failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
