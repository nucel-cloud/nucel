import type { Context } from 'hono';

interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  maxLimit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page?: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
}

export class PaginationHelper {
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;

  static parsePaginationParams(c: Context): PaginationOptions {
    const query = c.req.query();
    
    const page = query.page ? Math.max(1, parseInt(query.page)) : 1;
    const limit = query.limit 
      ? Math.min(this.MAX_LIMIT, Math.max(1, parseInt(query.limit)))
      : this.DEFAULT_LIMIT;
    const cursor = query.cursor;

    return {
      page,
      limit,
      cursor,
      maxLimit: this.MAX_LIMIT,
    };
  }

  static createPaginatedResponse<T>(
    data: T[],
    options: PaginationOptions & { total?: number },
    baseUrl: string
  ): PaginatedResponse<T> {
    const { page = 1, limit = this.DEFAULT_LIMIT, total, cursor } = options;
    
    const totalPages = total ? Math.ceil(total / limit) : undefined;
    const hasNext = cursor ? data.length === limit : (totalPages ? page < totalPages : data.length === limit);
    const hasPrev = cursor ? !!cursor : page > 1;

    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        page: cursor ? undefined : page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        nextCursor: cursor && hasNext ? this.encodeCursor(data[data.length - 1]) : undefined,
        prevCursor: cursor && hasPrev ? cursor : undefined,
      },
    };

    // Add HATEOAS links
    if (!cursor) {
      const url = new URL(baseUrl);
      response.links = {
        self: `${url.pathname}?page=${page}&limit=${limit}`,
        next: hasNext ? `${url.pathname}?page=${page + 1}&limit=${limit}` : undefined,
        prev: hasPrev ? `${url.pathname}?page=${page - 1}&limit=${limit}` : undefined,
        first: `${url.pathname}?page=1&limit=${limit}`,
        last: totalPages ? `${url.pathname}?page=${totalPages}&limit=${limit}` : undefined,
      };
    }

    return response;
  }

  static encodeCursor(item: any): string {
    // Encode cursor based on item ID or timestamp
    const cursorData = {
      id: item.id || item.installation?.id,
      timestamp: item.created_at || new Date().toISOString(),
    };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  static decodeCursor(cursor: string): { id?: string | number; timestamp?: string } {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      throw new Error('Invalid cursor');
    }
  }

  static async *paginateAsyncIterator<T>(
    iterator: AsyncIterableIterator<T>,
    limit: number
  ): AsyncGenerator<T[], void, unknown> {
    let batch: T[] = [];
    
    for await (const item of iterator) {
      batch.push(item);
      
      if (batch.length >= limit) {
        yield batch;
        batch = [];
      }
    }
    
    if (batch.length > 0) {
      yield batch;
    }
  }

  static applyPagination<T>(
    items: T[],
    options: PaginationOptions
  ): { items: T[]; hasMore: boolean } {
    const { page = 1, limit = this.DEFAULT_LIMIT, cursor } = options;
    
    if (cursor) {
      const cursorData = this.decodeCursor(cursor);
      const startIndex = items.findIndex(
        item => (item as any).id === cursorData.id
      );
      
      if (startIndex === -1) {
        return { items: items.slice(0, limit), hasMore: items.length > limit };
      }
      
      const paginatedItems = items.slice(startIndex + 1, startIndex + 1 + limit);
      return {
        items: paginatedItems,
        hasMore: items.length > startIndex + 1 + limit,
      };
    } else {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return {
        items: items.slice(startIndex, endIndex),
        hasMore: items.length > endIndex,
      };
    }
  }
}

// Cache for paginated results
export class PaginationCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 60 * 1000; // 60 seconds

  generateKey(resource: string, options: PaginationOptions): string {
    return `${resource}:${JSON.stringify(options)}`;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    // Clean up old entries
    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}