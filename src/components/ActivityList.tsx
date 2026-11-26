import type { ActivityEventWithActor } from '../../shared/types';
import { useI18n } from '../i18n';
import { ActivityItem } from './ActivityItem';
import { EmptyState } from './StateView';

interface ActivityListProps {
  events: ActivityEventWithActor[];
  showOrder?: boolean;
}

export function ActivityList({ events, showOrder }: ActivityListProps) {
  const { t } = useI18n();
  if (events.length === 0) return <EmptyState message={t('activity.empty')} />;
  return (
    <ol className="activity" aria-label={t('activity.title')}>
      {events.map((event) => (
        <ActivityItem key={event.id} event={event} showOrder={showOrder} />
      ))}
    </ol>
  );
}
