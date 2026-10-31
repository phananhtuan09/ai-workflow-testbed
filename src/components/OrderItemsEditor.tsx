import { MAX_ITEM_NAME_LENGTH, MAX_ITEMS, MAX_QUANTITY } from '../../shared/order-rules';
import { useI18n } from '../i18n';
import { Button } from './Button';
import { TextField } from './TextField';

export interface ItemValues {
  key: number;
  name: string;
  quantity: string;
  unitPrice: string;
}

interface OrderItemsEditorProps {
  items: ItemValues[];
  errors: Record<string, string>;
  onChange: (items: ItemValues[]) => void;
}

let nextKey = 1;

export function newItem(values: Partial<ItemValues> = {}): ItemValues {
  return { key: nextKey++, name: '', quantity: '1', unitPrice: '', ...values };
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

function lineCents(item: ItemValues): number {
  return parseInt(item.quantity, 10) * Math.round(Number(item.unitPrice) * 100);
}

export function OrderItemsEditor({ items, errors, onChange }: OrderItemsEditorProps) {
  const { t } = useI18n();

  function update(key: number, field: keyof Omit<ItemValues, 'key'>, value: string) {
    onChange(items.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  }

  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice === '' ? 0 : lineCents(item)), 0);

  return (
    <fieldset className="items-editor">
      <legend>{t('items.title')}</legend>
      {items.map((item, index) => {
        const error = (field: string) => {
          const key = errors[`items.${index}.${field}`];
          return key && t(key);
        };
        return (
          <div className="items-editor__row" key={item.key} data-testid="item-row">
            <TextField
              label={t('items.product')}
              value={item.name}
              maxLength={MAX_ITEM_NAME_LENGTH}
              onChange={(event) => update(item.key, 'name', event.target.value)}
              error={error('name')}
            />
            <TextField
              label={t('items.quantity')}
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={item.quantity}
              onChange={(event) => update(item.key, 'quantity', event.target.value)}
              error={error('quantity')}
            />
            <TextField
              label={t('items.unitPrice')}
              inputMode="decimal"
              value={item.unitPrice}
              onChange={(event) => update(item.key, 'unitPrice', event.target.value)}
              error={error('unitPriceCents')}
            />
            <span className="items-editor__line" data-testid="item-line-total">
              {item.unitPrice === '' ? '—' : formatCents(lineCents(item))}
            </span>
            <Button
              variant="secondary"
              disabled={items.length === 1}
              onClick={() => onChange(items.filter((candidate) => candidate.key !== item.key))}
            >
              {t('items.remove')}
            </Button>
          </div>
        );
      })}
      {errors.items && (
        <p className="field__error" role="alert">
          {t(errors.items)}
        </p>
      )}
      <div className="items-editor__footer">
        <Button variant="secondary" disabled={items.length >= MAX_ITEMS} onClick={() => onChange([...items, newItem()])}>
          {t('items.add')}
        </Button>
        <span className="items-editor__total" data-testid="items-subtotal">
          {t('items.subtotal')}: {formatCents(subtotal)}
        </span>
      </div>
    </fieldset>
  );
}
