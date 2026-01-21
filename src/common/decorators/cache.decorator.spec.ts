import 'reflect-metadata';
import {
  CacheKey,
  CacheTTL,
  NoCache,
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from './cache.decorator';

describe('Cache Decorators', () => {
  describe('CacheKey', () => {
    it('should be defined', () => {
      expect(CacheKey).toBeDefined();
    });

    it('should set cache key metadata on a method', () => {
      const testKey = 'test-cache-key';
      const decorator = CacheKey(testKey);

      class TestClass {
        @CacheKey(testKey)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toBe(testKey);
    });

    it('should set different cache keys for different methods', () => {
      const key1 = 'cache-key-1';
      const key2 = 'cache-key-2';

      class TestClass {
        @CacheKey(key1)
        method1() {}

        @CacheKey(key2)
        method2() {}
      }

      const metadata1 = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        TestClass.prototype.method1,
      );
      const metadata2 = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        TestClass.prototype.method2,
      );

      expect(metadata1).toBe(key1);
      expect(metadata2).toBe(key2);
    });

    it('should handle empty string cache key', () => {
      class TestClass {
        @CacheKey('')
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toBe('');
    });

    it('should handle cache key with special characters', () => {
      const specialKey = 'users:list:page=1&limit=10';

      class TestClass {
        @CacheKey(specialKey)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toBe(specialKey);
    });
  });

  describe('CacheTTL', () => {
    it('should be defined', () => {
      expect(CacheTTL).toBeDefined();
    });

    it('should set cache TTL metadata on a method', () => {
      const ttl = 300;

      class TestClass {
        @CacheTTL(ttl)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CACHE_TTL_METADATA,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toBe(ttl);
    });

    it('should set different TTLs for different methods', () => {
      const ttl1 = 60;
      const ttl2 = 3600;

      class TestClass {
        @CacheTTL(ttl1)
        method1() {}

        @CacheTTL(ttl2)
        method2() {}
      }

      const metadata1 = Reflect.getMetadata(
        CACHE_TTL_METADATA,
        TestClass.prototype.method1,
      );
      const metadata2 = Reflect.getMetadata(
        CACHE_TTL_METADATA,
        TestClass.prototype.method2,
      );

      expect(metadata1).toBe(ttl1);
      expect(metadata2).toBe(ttl2);
    });

    it('should handle zero TTL', () => {
      class TestClass {
        @CacheTTL(0)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CACHE_TTL_METADATA,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toBe(0);
    });

    it('should handle large TTL values', () => {
      const largeTTL = 86400 * 365; // 1 year in seconds

      class TestClass {
        @CacheTTL(largeTTL)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CACHE_TTL_METADATA,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toBe(largeTTL);
    });
  });

  describe('NoCache', () => {
    it('should be defined', () => {
      expect(NoCache).toBeDefined();
    });

    it('should set no_cache metadata to true on a method', () => {
      class TestClass {
        @NoCache()
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        'no_cache',
        TestClass.prototype.testMethod,
      );

      expect(metadata).toBe(true);
    });

    it('should not affect methods without the decorator', () => {
      class TestClass {
        @NoCache()
        noCacheMethod() {}

        cachedMethod() {}
      }

      const noCacheMetadata = Reflect.getMetadata(
        'no_cache',
        TestClass.prototype.noCacheMethod,
      );
      const cachedMetadata = Reflect.getMetadata(
        'no_cache',
        TestClass.prototype.cachedMethod,
      );

      expect(noCacheMetadata).toBe(true);
      expect(cachedMetadata).toBeUndefined();
    });
  });

  describe('Combining decorators', () => {
    it('should allow combining CacheKey and CacheTTL on the same method', () => {
      const key = 'combined-key';
      const ttl = 600;

      class TestClass {
        @CacheKey(key)
        @CacheTTL(ttl)
        testMethod() {}
      }

      const keyMetadata = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        TestClass.prototype.testMethod,
      );
      const ttlMetadata = Reflect.getMetadata(
        CACHE_TTL_METADATA,
        TestClass.prototype.testMethod,
      );

      expect(keyMetadata).toBe(key);
      expect(ttlMetadata).toBe(ttl);
    });

    it('should handle NoCache with CacheKey (NoCache should take precedence in implementation)', () => {
      class TestClass {
        @NoCache()
        @CacheKey('should-be-ignored')
        testMethod() {}
      }

      const noCacheMetadata = Reflect.getMetadata(
        'no_cache',
        TestClass.prototype.testMethod,
      );
      const keyMetadata = Reflect.getMetadata(
        CACHE_KEY_METADATA,
        TestClass.prototype.testMethod,
      );

      // Both metadata should be set, implementation decides priority
      expect(noCacheMetadata).toBe(true);
      expect(keyMetadata).toBe('should-be-ignored');
    });
  });

  describe('Metadata constants', () => {
    it('should export correct CACHE_KEY_METADATA constant', () => {
      expect(CACHE_KEY_METADATA).toBe('cache_key');
    });

    it('should export correct CACHE_TTL_METADATA constant', () => {
      expect(CACHE_TTL_METADATA).toBe('cache_ttl');
    });
  });
});
