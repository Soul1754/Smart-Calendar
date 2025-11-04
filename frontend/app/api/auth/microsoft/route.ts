import { NextResponse } from "next/server";

/**
 * Initiates Microsoft OAuth by requesting an authorization URL from the backend and redirecting the client while forwarding any Set-Cookie headers.
 *
 * If the backend does not provide a Location header, responds with a 502 JSON error. On unexpected failures, responds with a 500 JSON error containing an error message.
 *
 * @returns A NextResponse that is a 302 redirect to the backend-provided OAuth URL with any backend Set-Cookie headers forwarded, or a JSON error response with HTTP status 502 or 500.
 */
export async function GET() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
    const resp = await fetch(`${apiBase}/auth/microsoft`, { redirect: "manual" });
    const location = resp.headers.get("location");
    if (!location) {
      return NextResponse.json({ message: "OAuth redirect not provided by API" }, { status: 502 });
    }
    
    // Create redirect response
    const redirectResponse = NextResponse.redirect(location, { status: 302 });
    
    // Forward any Set-Cookie headers from backend (for session state)
    const cookies = resp.headers.getSetCookie?.() ||
                   (resp.headers as { raw?: () => Record<string, string[]> }).raw?.()['set-cookie'] ||
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