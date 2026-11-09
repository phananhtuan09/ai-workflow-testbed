import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MAX_DISCOUNT_PERCENT, MAX_NAME_LENGTH, validateOrderInput, type OrderFieldErrors } from '../../shared/order-rules';
import type { OrderInput } from '../../shared/types';
import { Button } from '../components/Button';
import { newItem, OrderItemsEditor, type ItemValues } from '../components/OrderItemsEditor';
import { ErrorState, LoadingState } from '../components/StateView';
import { TextField } from '../components/TextField';
import { useI18n } from '../i18n';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorKey } from '../lib/errors';
import { parseMoneyToCents } from '../lib/format';
import { useResource } from '../lib/useResource';

interface FormValues {
  name: string;
  discount: string;
  items: ItemValues[];
}

function emptyValues(): FormValues {
  return { name: '', discount: '0', items: [newItem()] };
}

function toInput(values: FormValues): OrderInput {
  return {
    name: values.name,
    discountPercent: Number(values.discount),
    items: values.items.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      unitPriceCents: parseMoneyToCents(item.unitPrice),
    })),
  };
}

export function OrderFormPage() {
  const params = useParams();
  const orderId = params.id ? Number(params.id) : undefined;
  const loadOrder = useCallback(() => (orderId ? api.getOrder(orderId) : Promise.resolve(null)), [orderId]);
  const existing = useResource(loadOrder);

  if (existing.status === 'loading') return <LoadingState />;
  if (existing.status === 'error') return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const initial: FormValues = existing.data
    ? {
        name: existing.data.name,
        discount: String(existing.data.discountPercent),
        items: existing.data.items.map((item) =>
          newItem({
            name: item.name,
            quantity: String(item.quantity),
            unitPrice: (item.unitPriceCents / 100).toFixed(2),
          }),
        ),
      }
    : emptyValues();

  return <OrderForm key={orderId ?? 'new'} orderId={orderId} initial={initial} />;
}

function OrderForm({ orderId, initial }: { orderId?: number; initial: FormValues }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<OrderFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  function update(field: 'name' | 'discount', value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = toInput(values);
    const errors = validateOrderInput(input);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const saved = orderId ? await api.updateOrder(orderId, input) : await api.createOrder(input);
      navigate(`/orders/${saved.id}`);
    } catch (caught) {
      if (caught instanceof ApiError && caught.body.fields) setFieldErrors(caught.body.fields);
      setFormError(errorKey(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h1>{t(orderId ? 'form.editTitle' : 'form.newTitle')}</h1>
      <TextField
        label={t('orders.name')}
        value={values.name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(event) => update('name', event.target.value)}
        error={fieldErrors.name && t(fieldErrors.name)}
      />
      <TextField
        label={t('orders.discount')}
        type="number"
        min={0}
        max={MAX_DISCOUNT_PERCENT}
        value={values.discount}
        disabled={!isAdmin}
        hint={isAdmin ? undefined : t('orders.discountAdminHint')}
        onChange={(event) => update('discount', event.target.value)}
        error={fieldErrors.discountPercent && t(fieldErrors.discountPercent)}
      />
      <OrderItemsEditor
        items={values.items}
        errors={fieldErrors}
        onChange={(items) => setValues((current) => ({ ...current, items }))}
      />
      {formError && (
        <p className="form__error" role="alert">
          {t(formError)}
        </p>
      )}
      <div className="actions">
        <Button type="submit" disabled={saving}>
          {saving ? t('form.saving') : t('form.save')}
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  );
}
