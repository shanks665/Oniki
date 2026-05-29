import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

const SALT = process.env.RATE_LIMIT_SALT ?? "bar-guide-kumamoto-rl";

/** Hash an IP address with a fixed salt so raw IPs are never stored. */
function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + SALT)
    .digest("hex")
    .slice(0, 40);
}

/** Extract the real client IP from common proxy headers. */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Persistent (Firestore-backed) rate limit for the anonymous review POST endpoint.
 * Allows at most `maxRequests` within `windowMs` per IP.
 *
 * Fail-open: if Firestore is unreachable, the request is allowed so a DB hiccup
 * never breaks the user experience.
 */
export async function checkReviewPostRateLimit(
  ip: string,
  maxRequests = 4,
  windowMs = 60 * 60 * 1000, // 1 hour
): Promise<{ allowed: boolean }> {
  const db = getAdminDb();
  const ipHash = hashIp(ip);
  const ref = db.collection("_rateLimits").doc(`review_post_${ipHash}`);
  const now = Date.now();

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const timestamps: number[] = (snap.data()?.timestamps as number[]) ?? [];

      // Prune entries outside the current window
      const recent = timestamps.filter((t) => now - t < windowMs);

      if (recent.length >= maxRequests) {
        return { allowed: false };
      }

      recent.push(now);
      tx.set(ref, { timestamps: recent, updatedAt: new Date() });
      return { allowed: true };
    });

    return result;
  } catch (err) {
    console.error("checkReviewPostRateLimit error (fail-open):", err);
    return { allowed: true };
  }
}

/**
 * Idempotency guard for the review-report endpoint.
 * A given IP can only report a given review once (permanent dedup).
 *
 * Atomically creates the lock document AND increments reportCount in one
 * Firestore transaction, so the caller does not need a separate write.
 *
 * Returns:
 *  { allowed: true }  – first report; reportCount has been incremented
 *  { allowed: false } – duplicate; nothing was written
 */
export async function deduplicateReport(
  ip: string,
  reviewId: string,
): Promise<{ allowed: boolean }> {
  const db = getAdminDb();
  const ipHash = hashIp(ip);
  const lockRef = db.collection("_reportLogs").doc(`${reviewId}_${ipHash}`);
  const reviewRef = db.collection("reviews").doc(reviewId);

  try {
    const result = await db.runTransaction(async (tx) => {
      const lockSnap = await tx.get(lockRef);
      if (lockSnap.exists) {
        return { allowed: false };
      }

      // Reserve the lock and increment reportCount atomically
      tx.set(lockRef, { reviewId, createdAt: new Date() });
      tx.update(reviewRef, { reportCount: FieldValue.increment(1) });

      return { allowed: true };
    });

    return result;
  } catch (err) {
    console.error("deduplicateReport error (fail-open):", err);
    return { allowed: true };
  }
}
