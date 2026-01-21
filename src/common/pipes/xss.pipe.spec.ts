import { XssPipe } from './xss.pipe';
import { ArgumentMetadata } from '@nestjs/common';

describe('XssPipe', () => {
  let pipe: XssPipe;
  const mockMetadata: ArgumentMetadata = { type: 'body' };

  beforeEach(() => {
    pipe = new XssPipe();
  });

  describe('transform', () => {
    it('should return non-string, non-object values unchanged', () => {
      expect(pipe.transform(123, mockMetadata)).toBe(123);
      expect(pipe.transform(true, mockMetadata)).toBe(true);
      expect(pipe.transform(null, mockMetadata)).toBe(null);
      expect(pipe.transform(undefined, mockMetadata)).toBe(undefined);
    });

    it('should remove script tags from strings', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = pipe.transform(input, mockMetadata);
      expect(result).toBe('Hello  World');
    });

    it('should remove script tags with content', () => {
      const input = '<script type="text/javascript">document.cookie</script>';
      const result = pipe.transform(input, mockMetadata);
      expect(result).toBe('');
    });

    it('should remove inline event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = pipe.transform(input, mockMetadata);
      expect(result).toBe('<img src="x" >');
    });

    it('should remove onclick handlers', () => {
      const input = '<button onclick="malicious()">Click</button>';
      const result = pipe.transform(input, mockMetadata);
      expect(result).toBe('<button >Click</button>');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = pipe.transform(input, mockMetadata);
      expect(result).toBe('<a href="">Link</a>');
    });

    it('should sanitize string properties in objects', () => {
      const input = {
        name: 'John <script>alert(1)</script>',
        age: 25,
      };
      const result = pipe.transform(input, mockMetadata);
      expect(result).toEqual({
        name: 'John ',
        age: 25,
      });
    });

    it('should recursively sanitize nested objects', () => {
      const input = {
        user: {
          name: '<script>xss</script>Test',
          profile: {
            bio: 'Hello <script>document.cookie</script>',
          },
        },
      };
      const result = pipe.transform(input, mockMetadata);
      expect(result).toEqual({
        user: {
          name: 'Test',
          profile: {
            bio: 'Hello ',
          },
        },
      });
    });

    it('should handle arrays within objects', () => {
      const input = {
        items: ['<script>alert(1)</script>item1', 'item2'],
      };
      const result = pipe.transform(input, mockMetadata);
      expect(result.items[0]).toBe('item1');
      expect(result.items[1]).toBe('item2');
    });

    it('should preserve safe HTML content', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = pipe.transform(input, mockMetadata);
      expect(result).toBe('<p>Hello <strong>World</strong></p>');
    });

    it('should handle case-insensitive script tags', () => {
      const input = '<SCRIPT>alert(1)</SCRIPT>';
      const result = pipe.transform(input, mockMetadata);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = pipe.transform('', mockMetadata);
      expect(result).toBe('');
    });

    it('should handle empty object', () => {
      const result = pipe.transform({}, mockMetadata);
      expect(result).toEqual({});
    });
  });
});
