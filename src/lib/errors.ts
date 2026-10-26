import { ApiError } from './api';

export function errorKey(error: unknown): string {
  return error instanceof ApiError ? error.body.error : 'errors.unknown';
}
