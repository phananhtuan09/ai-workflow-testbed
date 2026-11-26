import { describe, expect, it } from 'vitest';
import { ACTIVITY_ACTIONS, activityLabelKey, sortNewestFirst } from './activity';

describe('activityLabelKey', () => {
  it('maps every action to its message key', () => {
    expect(ACTIVITY_ACTIONS.map(activityLabelKey)).toEqual([
      'activity.action.created',
      'activity.action.edited',
      'activity.action.confirmed',
      'activity.action.deleted',
    ]);
  });
});

describe('sortNewestFirst', () => {
  it('orders by time, newest first', () => {
    const events = [
      { id: 1, at: '2026-01-05T09:00:00.000Z' },
      { id: 2, at: '2026-01-07T09:00:00.000Z' },
      { id: 3, at: '2026-01-06T09:00:00.000Z' },
    ];
    expect(sortNewestFirst(events).map((event) => event.id)).toEqual([2, 3, 1]);
  });

  it('puts the later write first when two events share a timestamp', () => {
    const at = '2026-01-05T09:00:00.000Z';
    expect(sortNewestFirst([{ id: 4, at }, { id: 5, at }]).map((event) => event.id)).toEqual([5, 4]);
  });

  it('does not change the input array', () => {
    const events = [
      { id: 1, at: '2026-01-05T09:00:00.000Z' },
      { id: 2, at: '2026-01-06T09:00:00.000Z' },
    ];
    sortNewestFirst(events);
    expect(events.map((event) => event.id)).toEqual([1, 2]);
  });
});
