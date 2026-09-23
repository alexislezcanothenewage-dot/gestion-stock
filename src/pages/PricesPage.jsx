import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Filter, Layers, Percent, Search, Square } from 'lucide-react';
import { api } from '../api';
import { money } from '../format';
import { useStore } from '../store';

export default function PricesPage() {
  const { currency } = useStore();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [history, setHistory] = useState([]);

  // Configuración del ajuste
  const [scope, setScope] = useState('category'); // 'all', 'category', 'manual'
  const [mode, setMode] = useState('percent');
  const [value, setValue] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [notes, setNotes] = useState('');

  // Previsualización y selección
  const [preview, setPreview] = useState([]);
  const [selectedInPreview, setSelectedInPreview] = useState(new Set());
  const [previewSearch, setPreviewSearch] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [cats, prods, adj] = await Promise.all([
      api.categories(),
      api.products('?active=true'),
      api.priceAdjustments(),
    ]);
    setCategories(cats.data || []);
    setAllProducts(prods.data || []);
    setHistory(adj.data || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function runPreview() {
    setError('');
    setBusy(true);
    try {
      const payload = {
        mode,
        value: Number(value),
        categoryId: scope === 'category' ? categoryId || null : null,
      };

      if (scope === 'manual') {
        const ids = Array.from(selectedProductIds);
        if (!ids.length) {
          throw new Error('Seleccioná al menos un producto para previsualizar');
        }
        payload.productIds = ids;
      }

      const res = await api.previewPrices(payload);
      const items = res.data || [];
      setPreview(items);
      // Por defecto todos los de la previsualización quedan seleccionados
      setSelectedInPreview(new Set(items.map((i) => i.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Filtrado de la tabla de previsualización por buscador
  const filteredPreview = useMemo(() => {
    if (!previewSearch.trim()) return preview;
    const term = previewSearch.toLowerCase();
    return preview.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.sku && item.sku.toLowerCase().includes(term))
    );
  }, [preview, previewSearch]);

  const allFilteredSelected =
    filteredPreview.length > 0 &&
    filteredPreview.every((item) => selectedInPreview.has(item.id));

  function toggleSelectAllFiltered() {
    const next = new Set(selectedInPreview);
    if (allFilteredSelected) {
      filteredPreview.forEach((i) => next.delete(i.id));
    } else {
      filteredPreview.forEach((i) => next.add(i.id));
    }
    setSelectedInPreview(next);
  }

  function toggleProductInPreview(id) {
    const next = new Set(selectedInPreview);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedInPreview(next);
  }

  // En selección manual antes de previsualizar
  function toggleManualProduct(id) {
    const next = new Set(selectedProductIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProductIds(next);
  }

  async function handleApply() {
    const targetIds = Array.from(selectedInPreview);
    if (!targetIds.length) {
      alert('Tenés que tener al menos un producto seleccionado');
      return;
    }

    if (
      !confirm(
        `¿Confirmás aplicar el nuevo precio a los ${targetIds.length} producto(s) seleccionado(s)?`
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      await api.applyPrices({
        mode,
        value: Number(value),
        productIds: targetIds,
        notes: notes || (scope === 'manual' ? 'Ajuste manual seleccionado' : undefined),
      });
      setPreview([]);
      setSelectedInPreview(new Set());
      await load();
      alert(`¡Precios actualizados con éxito en ${targetIds.length} productos!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Ajuste y Modificación de Precios
        </h1>
        <p className="text-sm text-slate-500">
          Cambiá el precio de venta de un producto solo, varios seleccionados o toda una categoría
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tarjeta de configuración */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Alcance */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              ¿A qué productos aplica?
            </label>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setPreview([]);
              }}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="category">Por categoría específica</option>
              <option value="manual">Seleccionar producto(s) manualmente</option>
              <option value="all">Todos los productos activos</option>
            </select>
          </div>

          {/* Categoría (solo si scope === category) */}
          {scope === 'category' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPreview([]);
                }}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Seleccioná una categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Modo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Tipo de ajuste
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="percent">Porcentaje (%)</option>
              <option value="amount">Monto fijo ($)</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              {mode === 'percent' ? 'Porcentaje (+10% / -5%)' : 'Monto (+ o −)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Notas */}
          <div className={scope === 'category' ? 'lg:col-span-4' : 'lg:col-span-1'}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Motivo o Notas (opcional)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Aumento proveedores, Lista nueva mayo..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Selector manual de productos si scope === manual */}
        {scope === 'manual' && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Seleccioná el producto o productos ({selectedProductIds.size} elegidos):
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductIds(new Set(allProducts.map((p) => p.id)))}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Marcar todos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedProductIds(new Set())}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Desmarcar todos
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 grid gap-1.5 sm:grid-cols-2 md:grid-cols-3">
              {allProducts.map((p) => {
                const checked = selectedProductIds.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs cursor-pointer transition ${
                      checked
                        ? 'border-blue-300 bg-blue-50/70 font-semibold text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleManualProduct(p.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0 flex-1 truncate">
                      <div className="truncate font-medium">{p.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.sku} • {money(p.sale_price, currency)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="pill-btn primary inline-flex items-center gap-2"
            disabled={busy || (scope === 'category' && !categoryId)}
            onClick={runPreview}
          >
            <Search className="h-4 w-4" />
            <span>Previsualizar Cambios</span>
          </button>

          {preview.length > 0 && (
            <button
              className="pill-btn inline-flex items-center gap-2 !bg-emerald-600 !text-white hover:!bg-emerald-700 shadow-sm"
              disabled={busy || selectedInPreview.size === 0}
              onClick={handleApply}
            >
              <Percent className="h-4 w-4" />
              <span>
                Aplicar nuevo precio a {selectedInPreview.size} producto(s) seleccionado(s)
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Previsualización con Checkboxes individuales */}
      {preview.length > 0 && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Previsualización de Precios ({selectedInPreview.size} de {preview.length} seleccionados)
              </h2>
              <p className="text-xs text-slate-500">
                Podés marcar o desmarcar productos individualmente con las casillas de verificación
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filtrar por nombre o SKU..."
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="pill-btn text-xs py-1 px-3"
              >
                {allFilteredSelected ? 'Desmarcar lista' : 'Marcar lista'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="rounded text-blue-600"
                      title="Marcar / desmarcar todos"
                    />
                  </th>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th className="text-right">Precio Actual</th>
                  <th className="text-right">Nuevo Precio</th>
                  <th className="text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredPreview.map((row) => {
                  const isChecked = selectedInPreview.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`cursor-pointer transition ${isChecked ? 'bg-blue-50/30' : 'opacity-60 bg-slate-50/40'}`}
                      onClick={() => toggleProductInPreview(row.id)}
                    >
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProductInPreview(row.id)}
                          className="rounded text-blue-600"
                        />
                      </td>
                      <td className="font-mono text-xs text-slate-500">{row.sku}</td>
                      <td className="font-medium text-slate-800">{row.name}</td>
                      <td className="text-right text-slate-600">{money(row.old_price, currency)}</td>
                      <td className="text-right font-bold text-blue-700 text-sm">
                        {money(row.new_price, currency)}
                      </td>
                      <td
                        className={`text-right font-semibold text-xs ${
                          row.delta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {row.delta >= 0 ? '+' : ''}
                        {money(row.delta, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial de ajustes */}
      <h2 className="mb-3 text-lg font-bold text-slate-800">Historial de Ajustes Realizados</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ajuste</th>
              <th>Alcance / Categoría</th>
              <th>Cant. Productos</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap text-slate-600">
                  {String(row.created_at).slice(0, 16).replace('T', ' ')}
                </td>
                <td className="font-semibold text-slate-800">
                  {row.mode === 'percent'
                    ? `${Number(row.value) > 0 ? '+' : ''}${row.value}%`
                    : money(row.value, currency)}
                </td>
                <td>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {row.category_name || 'Personalizado / Todos'}
                  </span>
                </td>
                <td className="font-bold text-blue-700">{row.product_count}</td>
                <td className="text-slate-500">{row.notes || '—'}</td>
              </tr>
            ))}
            {!history.length && (
              <tr>
                <td className="py-8 text-center text-slate-400" colSpan={5}>
                  Todavía no hay ajustes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
