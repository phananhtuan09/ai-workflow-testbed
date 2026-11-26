import { useCallback, useState } from 'react';
import { ActivityList } from '../components/ActivityList';
import { ErrorState, LoadingState } from '../components/StateView';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { useResource } from '../lib/useResource';

export function ActivityPage() {
  const { t } = useI18n();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const users = useResource(api.listUsers);
  const events = useResource(useCallback(() => api.listActivity(userId), [userId]));

  return (
    <section>
      <div className="page-header">
        <h1>{t('activity.title')}</h1>
        <label className="filter">
          <span>{t('activity.filterUser')}</span>
          <select
            value={userId ?? ''}
            onChange={(event) => setUserId(event.target.value === '' ? undefined : Number(event.target.value))}
            disabled={users.status !== 'success'}
          >
            <option value="">{t('activity.allUsers')}</option>
            {users.status === 'success' &&
              users.data.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
          </select>
        </label>
      </div>
      {events.status === 'loading' && <LoadingState />}
      {events.status === 'error' && <ErrorState error={events.error} onRetry={events.reload} />}
      {events.status === 'success' && <ActivityList events={events.data} showOrder />}
    </section>
  );
}
