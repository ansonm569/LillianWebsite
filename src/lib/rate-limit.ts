// Sliding-window rate limiter held in process memory. On serverless hosts
// each warm instance keeps its own window, so this is best-effort protection
// against bursts (card testing, form spam), not a hard global limit.

const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const cutoff = now - windowMs

  const hits = (buckets.get(key) ?? []).filter(t => t > cutoff)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }

  hits.push(now)
  buckets.set(key, hits)

  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every(t => t <= cutoff)) buckets.delete(k)
    }
  }

  return true
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
