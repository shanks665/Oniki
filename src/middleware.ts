import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter (per Vercel instance)
// ---------------------------------------------------------------------------
const WINDOW_MS = 60_000;
const DEFAULT_MAX = 60;
const STRICT_MAX = 10;

const STRICT_PATHS = [
  "/api/stripe/checkout",
  "/api/stripe/portal",
  "/api/admin/create-store",
];

interface RateEntry {
  timestamps: number[];
}

const rateMap = new Map<string, RateEntry>();

function cleanupIfNeeded() {
  if (rateMap.size > 10_000) {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, entry] of rateMap) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) rateMap.delete(key);
    }
  }
}

function isRateLimited(key: string, max: number): { limited: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  let entry = rateMap.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    rateMap.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= max) {
    return { limited: true, remaining: 0 };
  }

  entry.timestamps.push(now);
  return { limited: false, remaining: max - entry.timestamps.length };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block /api/seed in production
  if (pathname === "/api/seed" && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  // Skip rate-limiting for Stripe webhook (called by Stripe servers)
  // and cron (called by Vercel scheduler)
  const skipRateLimit =
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/cron/daily" ||
    pathname === "/api/cron/reset-status" ||
    pathname === "/api/cron/sync-subscriptions";

  if (!skipRateLimit) {
    const ip = getClientIp(request);
    const max = STRICT_PATHS.includes(pathname) ? STRICT_MAX : DEFAULT_MAX;
    const rateKey = `${ip}:${pathname}`;
    const { limited, remaining } = isRateLimited(rateKey, max);

    cleanupIfNeeded();

    if (limited) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const response = proceedWithAuth(request, pathname);
    response.headers.set("X-RateLimit-Limit", String(max));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  return proceedWithAuth(request, pathname);
}

function proceedWithAuth(request: NextRequest, pathname: string): NextResponse {
  // Admin API routes require Authorization header
  if (pathname.startsWith("/api/admin/")) {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Store API routes (except /api/store/me which handles its own auth)
  if (
    pathname.startsWith("/api/store/") &&
    pathname !== "/api/store/me"
  ) {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Stripe checkout/portal require Authorization
  if (
    pathname === "/api/stripe/checkout" ||
    pathname === "/api/stripe/portal"
  ) {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
