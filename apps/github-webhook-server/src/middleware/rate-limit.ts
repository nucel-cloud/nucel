import type { Context, Next } from 'hono';
import { RateLimitError } from './error-handler.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  hits: number;
  resetTime: number;
}

class MemoryStore {
  private store = new Map<string, RateLimitStore>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  increment(key: string, windowMs: number): RateLimitStore {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      const newRecord: RateLimitStore = {
        hits: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, newRecord);
      return newRecord;
    }

    record.hits++;
    return record;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const defaultKeyGenerator = (c: Context): string => {
  // Use IP address as default key
  const ip = c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             'unknown';
  return `${ip}:${c.req.path}`;
};

const stores = new Map<string, MemoryStore>();

export function rateLimiter(options: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
}) {
  const {
    windowMs,
    max,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = true,
  } = options;

  // Create a unique store for this limiter
  const storeId = `${windowMs}:${max}`;
  if (!stores.has(storeId)) {
    stores.set(storeId, new MemoryStore());
  }
  const store = stores.get(storeId)!;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const record = store.increment(key, windowMs);

    // Set rate limit headers
    const remaining = Math.max(0, max - record.hits);
    const resetTime = new Date(record.resetTime).toISOString();
    
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', resetTime);

    // Check if limit exceeded
    if (record.hits > max) {
      const retryAfter = Math.ceil((record.resetTime - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));
      
      throw new RateLimitError(retryAfter);
    }

    try {
      await next();
      
      // Optionally don't count successful requests
      if (skipSuccessfulRequests && c.res.status < 400) {
        record.hits = Math.max(0, record.hits - 1);
      }
    } catch (error) {
      // Optionally don't count failed requests
      if (skipFailedRequests) {
        record.hits = Math.max(0, record.hits - 1);
      }
      throw error;
    }
  };
}

// Different rate limits for different endpoints
export const rateLimits = {
  // Strict limit for webhooks
  webhooks: rateLimiter({
    windowMs: 60 * 1000,
    max: 100,
  }),
  
  // Standard API limit
  api: rateLimiter({
    windowMs: 60 * 1000,
    max: 60,
  }),
  
  // Relaxed limit for read operations
  read: rateLimiter({
    windowMs: 60 * 1000,
    max: 100,
  }),
  
  // Strict limit for write operations
  write: rateLimiter({
    windowMs: 60 * 1000,
    max: 20,
  }),
  
  // Very strict limit for deployment operations
  deployment: rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
  }),
};