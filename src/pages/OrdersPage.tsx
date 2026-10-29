import { Link } from 'react-router-dom';
import { orderTotalCents } from '../../shared/order-rules';
import { EmptyState, ErrorState, LoadingState } from '../components/StateView';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDate, formatMoney } from '../lib/format';
import { useResource } from '../lib/useResource';

export function OrdersPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const orders = useResource(api.listOrders);
  const isAdmin = user?.role === 'admin';

  return (
    <section>
      <div className="page-header">
        <h1>{t('orders.title')}</h1>
        <Link to="/orders/new" className="button button--primary">
          {t('orders.new')}
        </Link>
      </div>
      {orders.status === 'success' && orders.data.length > 0 && (
        <p className="page-count">
          {t(orders.data.length === 1 ? 'orders.countOne' : 'orders.countMany').replace('{count}', String(orders.data.length))}
        </p>
      )}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
