import { activityLabelKey } from '../../shared/activity';
import type { ActivityEventWithActor } from '../../shared/types';
import { useI18n } from '../i18n';
import { formatDateTime } from '../lib/format';

interface ActivityItemProps {
  event: ActivityEventWithActor;
  // The order detail page already names the order; the admin page shows it on each row.
  showOrder?: boolean;
}

export function ActivityItem({ event, showOrder = false }: ActivityItemProps) {
  const { t, locale } = useI18n();
  return (
    <li className="activity__item">
      <span className="activity__actor">{event.actorName}</span>{' '}
      <span className="activity__action">{t(activityLabelKey(event.action))}</span>
      {showOrder && (
        <>
          {' '}
          <span className="activity__order">{event.orderName}</span>
        </>
      )}
      <time className="activity__time" dateTime={event.at}>
        {formatDateTime(event.at, locale)}
      </time>
    </li>
  );
}
