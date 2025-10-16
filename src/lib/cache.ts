interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>>;

  private constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('app_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as CacheItem<any>);
        });
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const cacheObj: { [key: string]: CacheItem<any> } = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem('app_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // Default TTL: 5 minutes
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.cache.set(key, item);
    this.saveToStorage();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      this.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem('app_cache');
  }

  // Clear expired items
  clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }

  // Check if item exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  NEWS: 60 * 60 * 1000, // 1 hour
  POSTS: 5 * 60 * 1000, // 5 minutes
  PROFILE: 10 * 60 * 1000, // 10 minutes
  STOCKS: 15 * 60 * 1000, // 15 minutes
  CONNECTIONS: 5 * 60 * 1000, // 5 minutes
};

export const cache = CacheManager.getInstance();

// Clear expired cache items every 5 minutes
setInterval(() => {
  cache.clearExpired();
}, 5 * 60 * 1000);
