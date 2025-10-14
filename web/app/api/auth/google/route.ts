import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
    const resp = await fetch(`${apiBase}/auth/google/callback`, { redirect: "manual" });
    const location = resp.headers.get("location");
    if (!location) {
      return NextResponse.json({ message: "OAuth redirect not provided by API" }, { status: 502 });
    }
    
    // Create redirect response
    const redirectResponse = NextResponse.redirect(location, { status: 302 });
    
    // Forward any Set-Cookie headers from backend (for session state)
    const cookies = resp.headers.getSetCookie?.() || 
                   (resp.headers as any).raw?.()['set-cookie'] || 
                   [];
    
    for (const cookie of cookies) {
      redirectResponse.headers.append("set-cookie", cookie);
    }
    
    return redirectResponse;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OAuth initiation failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
