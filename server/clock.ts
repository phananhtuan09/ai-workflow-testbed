import { config } from './config';

export function now(): Date {
  return config.fixedNow ? new Date(config.fixedNow) : new Date();
}
