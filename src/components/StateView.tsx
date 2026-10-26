import { useI18n } from '../i18n';
import { errorKey } from '../lib/errors';
import { Button } from './Button';

export function LoadingState() {
  const { t } = useI18n();
  return (
    <p className="state" role="status">
      {t('state.loading')}
    </p>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="state state--error" role="alert">
      <p>{t(errorKey(error))}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('state.retry')}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="state state--empty">{message}</p>;
}
