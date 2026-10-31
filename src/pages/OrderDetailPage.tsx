import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { itemSubtotalCents, MAX_QUANTITY, orderTotalCents } from '../../shared/order-rules';
import { Button } from '../components/Button';
import { ErrorState, LoadingState } from '../components/StateView';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorKey } from '../lib/errors';
import { formatDate, formatMoney } from '../lib/format';
import { useResource } from '../lib/useResource';

export function OrderDetailPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const id = Number(useParams().id);
  const order = useResource(useCallback(() => api.getOrder(id), [id]));
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  async function runAction(action: () => Promise<unknown>, after: () => void) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      after();
    } catch (caught) {
      setActionError(errorKey(caught));
    } finally {
      setBusy(false);
    }
  }

  if (order.status === 'loading') return <LoadingState />;
  if (order.status === 'error') return <ErrorState error={order.error} onRetry={order.reload} />;

  const { data } = order;
  const canChangeItems = data.status === 'draft';
  // Largest lines first so the main cost of the order is on top.
  const items = [...data.items].sort((a, b) => itemSubtotalCents(b) - itemSubtotalCents(a));
  return (
    <article className="card">
      <Link to="/orders">{t('orders.back')}</Link>
      <h1 className="order-title">{data.name}</h1>
      <dl className="details">
        <dt>{t('orders.owner')}</dt>
        <dd>{data.ownerName}</dd>
        <dt>{t('orders.price')}</dt>
        <dd>{formatMoney(data.priceCents, locale)}</dd>
        <dt>{t('orders.discount')}</dt>
        <dd>{data.discountPercent}%</dd>
        <dt>{t('orders.total')}</dt>
        <dd data-testid="order-total">{formatMoney(orderTotalCents(data), locale)}</dd>
        <dt>{t('orders.status')}</dt>
        <dd>
          <span className={`badge badge--${data.status}`}>{t(`orders.status.${data.status}`)}</span>
        </dd>
        <dt>{t('orders.createdAt')}</dt>
        <dd>{formatDate(data.createdAt, locale)}</dd>
      </dl>
      <h2 className="section-title">{t('items.title')}</h2>
      <div className="table-wrap">
        <table className="table" data-testid="order-items">
          <thead>
            <tr>
              <th>{t('items.product')}</th>
              <th className="table__number">{t('items.quantity')}</th>
              <th className="table__number">{t('items.unitPrice')}</th>
              <th className="table__number">{t('items.lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td className="table__number">
                  {canChangeItems ? (
                    <span className="stepper">
                      <Button
                        variant="secondary"
                        aria-label={t('items.decrease')}
                        disabled={busy || item.quantity <= 1}
                        onClick={() => runAction(() => api.updateItemQuantity(data.id, item.id, item.quantity - 1), order.reload)}
                      >
                        −
                      </Button>
                      <span data-testid="item-quantity">{item.quantity}</span>
                      <Button
                        variant="secondary"
                        aria-label={t('items.increase')}
                        disabled={busy || item.quantity >= MAX_QUANTITY}
                        onClick={() => runAction(() => api.updateItemQuantity(data.id, item.id, item.quantity + 1), order.reload)}
                      >
                        +
                      </Button>
                    </span>
                  ) : (
                    item.quantity
                  )}
                </td>
                <td className="table__number">{formatMoney(item.unitPriceCents, locale)}</td>
                <td className="table__number">{formatMoney(itemSubtotalCents(item), locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {actionError && (
        <p className="form__error" role="alert">
          {t(actionError)}
        </p>
      )}
      <div className="actions">
        {data.status === 'draft' && (
          <Link to={`/orders/${data.id}/edit`} className="button button--secondary">
            {t('orders.edit')}
          </Link>
        )}
        {isAdmin && data.status === 'draft' && (
          <Button disabled={busy} onClick={() => runAction(() => api.confirmOrder(data.id), order.reload)}>
            {t('orders.confirm')}
          </Button>
        )}
        {isAdmin && (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t('orders.deleteConfirm'))) {
                void runAction(() => api.deleteOrder(data.id), () => navigate('/orders'));
              }
            }}
          >
            {t('orders.delete')}
          </Button>
        )}
      </div>
    </article>
  );
}
