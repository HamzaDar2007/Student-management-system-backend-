import { SetMetadata } from '@nestjs/common';
import { SKIP_TRANSFORM_KEY } from '../interceptors/transform.interceptor';

/**
 * Decorator to skip response transformation for specific endpoints.
 * Useful for endpoints that need to return raw data like file downloads.
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
