import 'reflect-metadata';
import { SkipTransform } from './skip-transform.decorator';
import { SKIP_TRANSFORM_KEY } from '../interceptors/transform.interceptor';

describe('SkipTransform Decorator', () => {
  it('should be defined', () => {
    expect(SkipTransform).toBeDefined();
  });

  it('should export from transform interceptor the correct key', () => {
    expect(SKIP_TRANSFORM_KEY).toBe('skipTransform');
  });

  describe('Method Decorator', () => {
    it('should set skipTransform metadata to true on a method', () => {
      class TestController {
        @SkipTransform()
        rawResponseMethod() {}
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.rawResponseMethod,
      );

      expect(metadata).toBe(true);
    });

    it('should not set metadata on methods without the decorator', () => {
      class TestController {
        @SkipTransform()
        rawResponseMethod() {}

        normalMethod() {}
      }

      const rawMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.rawResponseMethod,
      );
      const normalMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.normalMethod,
      );

      expect(rawMetadata).toBe(true);
      expect(normalMetadata).toBeUndefined();
    });

    it('should work on multiple methods independently', () => {
      class TestController {
        @SkipTransform()
        downloadMethod() {}

        @SkipTransform()
        streamMethod() {}

        transformedMethod() {}
      }

      const downloadMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.downloadMethod,
      );
      const streamMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.streamMethod,
      );
      const transformedMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.transformedMethod,
      );

      expect(downloadMetadata).toBe(true);
      expect(streamMetadata).toBe(true);
      expect(transformedMetadata).toBeUndefined();
    });
  });

  describe('Use Cases', () => {
    it('should be usable for file download endpoints', () => {
      class FileController {
        @SkipTransform()
        downloadFile(fileId: string) {
          // This method returns raw file data
          return { buffer: Buffer.from('file content'), filename: 'test.txt' };
        }
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        FileController.prototype.downloadFile,
      );

      expect(metadata).toBe(true);
    });

    it('should be usable for health check endpoints', () => {
      class HealthController {
        @SkipTransform()
        check() {
          return { status: 'ok', timestamp: new Date().toISOString() };
        }
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        HealthController.prototype.check,
      );

      expect(metadata).toBe(true);
    });

    it('should be usable for stream endpoints', () => {
      class StreamController {
        @SkipTransform()
        streamData() {
          // Returns raw stream data
          return 'streaming data...';
        }
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        StreamController.prototype.streamData,
      );

      expect(metadata).toBe(true);
    });

    it('should be usable for proxy endpoints', () => {
      class ProxyController {
        @SkipTransform()
        proxyRequest() {
          // Returns raw proxied response
          return { proxied: true };
        }
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        ProxyController.prototype.proxyRequest,
      );

      expect(metadata).toBe(true);
    });
  });

  describe('Combining with Other Decorators', () => {
    it('should work with other method decorators', () => {
      // Mock other decorators for testing combination
      const OtherDecorator = () => (target: any, key: string) => {
        Reflect.defineMetadata('other', true, target[key]);
      };

      class TestController {
        @SkipTransform()
        @OtherDecorator()
        combinedMethod() {}
      }

      const skipMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.combinedMethod,
      );
      const otherMetadata = Reflect.getMetadata(
        'other',
        TestController.prototype.combinedMethod,
      );

      expect(skipMetadata).toBe(true);
      expect(otherMetadata).toBe(true);
    });
  });

  describe('Controller Context', () => {
    it('should work within a typical NestJS controller structure', () => {
      // Simulating NestJS-like controller structure
      class Controller {
        static prefix = '/api';
      }

      class UploadsController extends Controller {
        @SkipTransform()
        download() {
          return { type: 'file' };
        }

        list() {
          return { type: 'list' };
        }
      }

      const downloadMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        UploadsController.prototype.download,
      );
      const listMetadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        UploadsController.prototype.list,
      );

      expect(downloadMetadata).toBe(true);
      expect(listMetadata).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should be idempotent when applied multiple times', () => {
      // Note: Applying same decorator multiple times is unusual but should not break
      class TestController {
        @SkipTransform()
        method() {}
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.method,
      );

      expect(metadata).toBe(true);
    });

    it('should work with async methods', () => {
      class TestController {
        @SkipTransform()
        async asyncMethod() {
          return Promise.resolve({ data: 'async data' });
        }
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.asyncMethod,
      );

      expect(metadata).toBe(true);
    });

    it('should work with generator methods', () => {
      class TestController {
        @SkipTransform()
        *generatorMethod() {
          yield 1;
          yield 2;
        }
      }

      const metadata = Reflect.getMetadata(
        SKIP_TRANSFORM_KEY,
        TestController.prototype.generatorMethod,
      );

      expect(metadata).toBe(true);
    });
  });
});
