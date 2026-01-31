import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class XssPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (typeof value === 'string') {
      return this.sanitize(value);
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }
    return value;
  }

  private sanitize(text: string): string {
    // Simple regex-based sanitization for common XSS patterns
    // In a real app, use a library like 'dompurify' or 'sanitize-html'
    return text
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
      .replace(/on\w+="[^"]*"/gim, '')
      .replace(/javascript:[^"]*/gim, '');
  }

  private sanitizeObject(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    if (typeof obj !== 'object' || obj === null) return obj;
    const typedObj = obj;
    for (const key in typedObj) {
      if (typeof typedObj[key] === 'string') {
        typedObj[key] = this.sanitize(typedObj[key]);
      } else if (typeof typedObj[key] === 'object' && typedObj[key] !== null) {
        this.sanitizeObject(typedObj[key] as Record<string, unknown>);
      }
    }
    return typedObj;
  }
}
