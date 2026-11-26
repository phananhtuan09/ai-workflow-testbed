import { useEffect, useState } from 'react';
import type { SpendingSummary } from '../../shared/types';
import { useI18n } from '../i18n';

export function SummaryCard() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<SpendingSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/orders/summary', { credentials: 'same-origin' })
      .then((response) => response.json())
      .then((data: SpendingSummary) => {
        if (active) setSummary(data);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!summary) return <p className="summary-card">{t('state.loading')}</p>;

  return (
    <dl className="summary-card" aria-label={t('summary.title')}>
      <div>
        <dt>{t('summary.totalSpent')}</dt>
        <dd>${(summary.totalSpentCents / 100).toFixed(2)}</dd>
      </div>
      <div>
        <dt>{t('summary.orderCount')}</dt>
        <dd>{summary.orderCount}</dd>
      </div>
      <div>
        <dt>Average discount</dt>
        <dd>{summary.averageDiscountPercent}%</dd>
      </div>
    </dl>
  );
}
