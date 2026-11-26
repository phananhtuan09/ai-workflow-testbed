import type { Response } from 'express';
import type { ApiErrorBody } from '../shared/types';

// One place for API error bodies, so every route answers `{ error, fields? }` the same way.
export function sendError(res: Response, status: number, error: string, fields?: ApiErrorBody['fields']): void {
  res.status(status).json(fields ? { error, fields } : { error });
}
