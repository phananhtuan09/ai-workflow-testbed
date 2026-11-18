import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderTotalCents } from '../../shared/order-rules';
import type { OrderView, OrderWithOwner } from '../../shared/types';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/StateView';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDate, formatMoney } from '../lib/format';
import { useResource } from '../lib/useResource';

const UNDO_MS = 5000;
const VIEWS: OrderView[] = ['active', 'archived', 'all'];

function withName(text: string, name: string): string {
  return text.replace('{name}', name);
}

interface Notice {
  order: OrderWithOwner;
  undo: boolean;
  message: string;
}

export function OrdersPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [view, setView] = useState<OrderView>('active');
  const load = useCallback(() => api.listOrders(view), [view]);
  const orders = useResource(load);
  const isAdmin = user?.role === 'admin';
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [archiving, setArchiving] = useState<OrderWithOwner | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function show(next: Notice) {
    window.clearTimeout(timer.current);
    setNotice(next);
    if (next.undo) timer.current = window.setTimeout(() => setNotice(null), UNDO_MS);
  }

  async function archive(order: OrderWithOwner) {
    setArchiving(null);
    await api.archiveOrder(order.id);
    orders.reload();
    show({ order, undo: true, message: withName(t('orders.archived'), order.name) });
  }

  async function restore(order: OrderWithOwner) {
    setMenuFor(null);
    window.clearTimeout(timer.current);
    await api.restoreOrder(order.id);
    orders.reload();
    show({ order, undo: false, message: withName(t('orders.restored'), order.name) });
  }

  return (
    <section>
      <div className="page-header">
        <h1>{t('orders.title')}</h1>
        <Link to="/orders/new" className="button button--primary">
          {t('orders.new')}
        </Link>
      </div>
      <div className="toolbar">
        <label htmlFor="orders-view">{t('orders.show')}</label>
        <select id="orders-view" value={view} onChange={(event) => setView(event.target.value as OrderView)}>
          {VIEWS.map((option) => (
            <option key={option} value={option}>
              {t(`orders.show.${option}`)}
            </option>
          ))}
        </select>
      </div>
      {orders.status === 'loading' && <LoadingState />}
      {orders.status === 'error' && <ErrorState error={orders.error} onRetry={orders.reload} />}
      {orders.status === 'success' && orders.data.length === 0 && <EmptyState message={t('orders.empty')} />}
      {orders.status === 'success' && orders.data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('orders.name')}</th>
                {isAdmin && <th>{t('orders.owner')}</th>}
                <th className="table__number">{t('orders.total')}</th>
                <th>{t('orders.status')}</th>
                <th>{t('orders.createdAt')}</th>
                <th>
                  <span className="visually-hidden">{t('orders.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/orders/${order.id}`}>{order.name}</Link>
                  </td>
                  {isAdmin && <td>{order.ownerName}</td>}
                  <td className="table__number">{formatMoney(orderTotalCents(order), locale)}</td>
                  <td>
                    <span className={`badge badge--${order.status}`}>{t(`orders.status.${order.status}`)}</span>
                  </td>
                  <td>{formatDate(order.createdAt, locale)}</td>
                  <td className="row-actions">
                    {(order.status === 'draft' || order.archived) && (
                      <>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={withName(t('orders.actionsFor'), order.name)}
                          aria-haspopup="menu"
                          aria-expanded={menuFor === order.id}
                          onClick={() => setMenuFor(menuFor === order.id ? null : order.id)}
                        >
                          ⋯
                        </button>
                        {menuFor === order.id && (
                          <div role="menu" className="menu">
                            {order.archived ? (
                              <button type="button" role="menuitem" onClick={() => void restore(order)}>
                                {t('orders.restore')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuFor(null);
                                  setArchiving(order);
                                }}
                              >
                                {t('orders.archive')}
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {archiving && (
        <div className="dialog-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby="archive-title" className="dialog">
            <h2 id="archive-title">{withName(t('orders.archiveTitle'), archiving.name)}</h2>
            <p>{t('orders.archiveBody')}</p>
            <div className="actions">
              <Button variant="danger" onClick={() => void archive(archiving)}>
                {t('orders.archiveSubmit')}
              </Button>
              <Button variant="secondary" onClick={() => setArchiving(null)}>
                {t('orders.archiveKeep')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div role="status" className="toast">
          <span>{notice.message}</span>
          {notice.undo && (
            <Button variant="secondary" onClick={() => void restore(notice.order)}>
              {t('orders.undo')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
