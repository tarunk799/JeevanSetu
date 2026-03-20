import { describe, it, expect } from "vitest";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const result = checkRateLimit("test-ip-1", { maxRequests: 5, windowMs: 1000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", () => {
    const config = { maxRequests: 3, windowMs: 60_000 };
    const id = `test-ip-${Date.now()}`;

    checkRateLimit(id, config); // 1
    checkRateLimit(id, config); // 2
    checkRateLimit(id, config); // 3

    const blocked = checkRateLimit(id, config); // 4 — blocked
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks different IPs independently", () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    const id1 = `unique-ip-a-${Date.now()}`;
    const id2 = `unique-ip-b-${Date.now()}`;

    checkRateLimit(id1, config);
    const result = checkRateLimit(id2, config);
    expect(result.allowed).toBe(true);
  });
});

describe("rateLimitHeaders", () => {
  it("returns proper header format", () => {
    const result = { allowed: true, remaining: 5, resetAt: Date.now() + 60000 };
    const headers = rateLimitHeaders(result);
    expect(headers["X-RateLimit-Remaining"]).toBe("5");
    expect(headers["X-RateLimit-Reset"]).toBeTruthy();
  });
});
