import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.toSnakeCase(data)));
  }

  private toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.toSnakeCase(v));
    }
    if (obj !== null && typeof obj === 'object') {
      // Avoid converting classes/entities (which have a non-Object constructor)
      if (obj.constructor !== Object) {
        return obj;
      }

      const typedObj = obj as Record<string, any>;
      return Object.keys(typedObj).reduce(
        (result: Record<string, any>, key: string) => {
          const snakeKey = key.replace(
            /[A-Z]/g,
            (letter) => `_${letter.toLowerCase()}`,
          );
          result[snakeKey] = this.toSnakeCase(typedObj[key]);
          return result;
        },
        {},
      );
    }
    return obj;
  }
}
