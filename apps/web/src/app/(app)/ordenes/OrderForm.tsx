'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type {
  Customer,
  OrderItem,
  OrderItemType,
  WorkOrder,
} from '@car-check/shared';
import type { OrderFormState } from './actions';

type OrderFormAction = (
  state: OrderFormState,
  formData: FormData,
) => Promise<OrderFormState>;

type ItemRow = {
  key: number;
  type: OrderItemType;
  description: string;
  quantity: string;
  unitPrice: string;
};

const labelClass =
  'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600';
const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none';

const currency = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

function emptyRow(key: number): ItemRow {
  return {
    key,
    type: 'SERVICIO',
    description: '',
    quantity: '1',
    unitPrice: '0',
  };
}

function rowsFromItems(items: OrderItem[]): ItemRow[] {
  return items.map((item, i) => ({
    key: i,
    type: item.type,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
  }));
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando…' : label}
    </button>
  );
}

export function OrderForm({
  action,
  customers,
  order,
  submitLabel,
  cancelHref,
}: {
  action: OrderFormAction;
  customers?: Customer[];
  order?: WorkOrder & { items: OrderItem[] };
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<OrderFormState, FormData>(
    action,
    {},
  );
  const fieldErrors = state.fieldErrors ?? {};
  const isEdit = Boolean(order);

  const [nextKey, setNextKey] = useState(order ? order.items.length : 1);
  const [rows, setRows] = useState<ItemRow[]>(
    order && order.items.length > 0
      ? rowsFromItems(order.items)
      : [emptyRow(0)],
  );

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.key !== key) : prev,
    );
  }

  const total = rows.reduce((sum, r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {!isEdit && (
        <section className="space-y-5">
          <div>
            <label htmlFor="customerId" className={labelClass}>
              Cliente
            </label>
            <select
              id="customerId"
              name="customerId"
              defaultValue=""
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.customerId)}
            >
              <option value="" disabled>
                Seleccioná un cliente…
              </option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ''}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.customerId} />
            {customers && customers.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No hay clientes registrados. Creá uno antes de abrir una orden.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="vin" className={labelClass}>
              VIN del vehículo
            </label>
            <input
              id="vin"
              name="vin"
              type="text"
              autoComplete="off"
              maxLength={17}
              placeholder="1HGCM82633A004352"
              className={`${inputClass} font-mono uppercase placeholder:font-sans placeholder:normal-case`}
              aria-invalid={Boolean(fieldErrors.vin)}
            />
            <p className="mt-1 text-xs text-gray-400">
              Si el VIN no existe, se registra el vehículo automáticamente.
            </p>
            <FieldError message={fieldErrors.vin} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="plate" className={labelClass}>
                Placa
              </label>
              <input
                id="plate"
                name="plate"
                type="text"
                placeholder="ABC-123"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="make" className={labelClass}>
                Marca
              </label>
              <input
                id="make"
                name="make"
                type="text"
                placeholder="Honda"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="model" className={labelClass}>
                Modelo
              </label>
              <input
                id="model"
                name="model"
                type="text"
                placeholder="Civic"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="year" className={labelClass}>
                Año
              </label>
              <input
                id="year"
                name="year"
                type="number"
                inputMode="numeric"
                placeholder="2020"
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.year)}
              />
              <FieldError message={fieldErrors.year} />
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="mileage" className={labelClass}>
            Kilometraje
          </label>
          <input
            id="mileage"
            name="mileage"
            type="number"
            inputMode="numeric"
            placeholder="62000"
            defaultValue={order?.mileage ?? ''}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.mileage)}
          />
          <FieldError message={fieldErrors.mileage} />
        </div>
        <div>
          <label htmlFor="serviceDate" className={labelClass}>
            Fecha de servicio
          </label>
          <input
            id="serviceDate"
            name="serviceDate"
            type="date"
            defaultValue={
              order?.serviceDate ? order.serviceDate.slice(0, 10) : ''
            }
            className={inputClass}
          />
        </div>
      </section>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Observaciones de la orden…"
          defaultValue={order?.notes ?? ''}
          className={inputClass}
        />
      </div>

      {/* Editor de ítems */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Ítems (servicios y repuestos)
          </h2>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            + Agregar ítem
          </button>
        </div>

        <FieldError message={fieldErrors.items} />

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-1 items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[8rem_1fr_5rem_7rem_auto]"
            >
              <div>
                <label className={labelClass}>Tipo</label>
                <select
                  name="itemType"
                  value={row.type}
                  onChange={(e) =>
                    updateRow(row.key, {
                      type: e.target.value as OrderItemType,
                    })
                  }
                  className={inputClass}
                >
                  <option value="SERVICIO">Servicio</option>
                  <option value="REPUESTO">Repuesto</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Descripción</label>
                <input
                  name="itemDescription"
                  type="text"
                  value={row.description}
                  onChange={(e) =>
                    updateRow(row.key, { description: e.target.value })
                  }
                  placeholder="Cambio de aceite 5W-30"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cant.</label>
                <input
                  name="itemQuantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row.key, { quantity: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>P. unit.</label>
                <input
                  name="itemUnitPrice"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={row.unitPrice}
                  onChange={(e) =>
                    updateRow(row.key, { unitPrice: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1}
                aria-label="Quitar ítem"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1 text-sm">
          <span className="text-gray-500">Total estimado:&nbsp;</span>
          <span className="font-semibold text-gray-900">
            {currency.format(total)}
          </span>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href={cancelHref}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
