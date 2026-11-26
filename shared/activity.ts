import type { ActivityAction, ActivityEvent } from './types';

export const ACTIVITY_ACTIONS: readonly ActivityAction[] = ['created', 'edited', 'confirmed', 'deleted'];

export function activityLabelKey(action: ActivityAction): string {
  return `activity.action.${action}`;
}

// Newest first; events written in the same millisecond keep their write order reversed by id.
export function sortNewestFirst<T extends Pick<ActivityEvent, 'id' | 'at'>>(events: readonly T[]): T[] {
  return [...events].sort((a, b) => b.at.localeCompare(a.at) || b.id - a.id);
}
