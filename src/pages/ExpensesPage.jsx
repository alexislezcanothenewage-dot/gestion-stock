import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  Building,
  Zap,
  Droplet,
  Users,
  Wifi,
  Briefcase,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api';
import { money, ymd } from '../format';
import { useStore } from '../store';

const CATEGORY_PRESETS = [
  { id: 'Alquiler', label: 'Alquiler', icon: Building, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'Luz / Electricidad', label: 'Luz / Electricidad', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'Agua', label: 'Agua', icon: Droplet, color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'Sueldos / Empleados', label: 'Sueldos / Empleados', icon: Users, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'Internet / Telefonía', label: 'Internet / Telefonía', icon: Wifi, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'Impuestos / Tasas', label: 'Impuestos / Tasas', icon: Briefcase, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'Mantenimiento', label: 'Mantenimiento', icon: Wrench, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'Varios', label: 'Varios / Otros', icon: HelpCircle, color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const METHOD_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  check: 'Cheque',
  other: 'Otro',
};

export default function ExpensesPage() {
  const { currency } = useStore();
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario nuevo egreso
  const [formCategory, setFormCategory] = useState('Alquiler');
  const [customCategory, setCustomCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMethod, setFormMethod] = useState('cash');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (categoryFilter) q.set('category', categoryFilter);
      if (search) q.set('q', search);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await api.expenses(queryStr);
      setRows(res.data || []);
      setTotals(res.totals || { total: 0, count: 0 });
    } catch (err) {
      setError(err.message || 'Error al cargar los egresos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const finalCategory = formCategory === 'custom' ? customCategory.trim() : formCategory;
      if (!finalCategory) throw new Error('Indicá la categoría o concepto del egreso');
      if (!formAmount || Number(formAmount) <= 0) throw new Error('El importe debe ser mayor a cero');

      await api.saveExpense({
        category: finalCategory,
        amount: Number(formAmount),
        paid_at: formDate,
        method: formMethod,
        notes: formNotes,
      });

      setModalOpen(false);
      // Reset form
      setFormCategory('Alquiler');
      setCustomCategory('');
      setFormAmount('');
      setFormNotes('');
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este registro de egreso?')) return;
    try {
      await api.deleteExpense(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  }

  function getCategoryBadge(catName) {
    const preset = CATEGORY_PRESETS.find((p) => p.id === catName);
    const color = preset ? preset.color : 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
        {catName}
      </span>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Egresos y Gastos Operativos</h1>
          <p className="text-sm text-slate-500">
            Control de alquiler, luz, agua, empleados y gastos fijos o variables del negocio
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-rose-500 hover:to-orange-500 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Egreso</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas Resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/90 via-white to-orange-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              Total Egresos Registrados
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-200">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight text-rose-950">
            {money(totals.total, currency)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <Receipt className="h-3.5 w-3.5" />
            <span>{totals.count} comprobante(s) de gasto</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 flex flex-col justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Categorías Frecuentes
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter('')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                !categoryFilter
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            {CATEGORY_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setCategoryFilter(categoryFilter === p.id ? '' : p.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  categoryFilter === p.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por notas o concepto..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadData();
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Tabla de Egresos */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría / Concepto</th>
              <th>Notas / Detalle</th>
              <th>Método de Pago</th>
              <th className="text-right">Monto</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap font-medium text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{ymd(row.paid_at)}</span>
                  </div>
                </td>
                <td>{getCategoryBadge(row.category)}</td>
                <td className="text-slate-600">{row.notes || '—'}</td>
                <td className="text-slate-600 text-xs">
                  {METHOD_LABELS[row.method] || row.method}
                </td>
                <td className="text-right whitespace-nowrap font-bold text-rose-700 text-base">
                  − {money(row.amount, currency)}
                </td>
                <td className="text-right">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    title="Eliminar egreso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <div>No hay egresos registrados con los filtros actuales.</div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="mt-3 text-sm font-semibold text-rose-600 hover:underline"
                  >
                    + Registrar el primer egreso
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Egreso */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-rose-600" />
                <span>Registrar Nuevo Egreso / Gasto</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="p-5 space-y-4">
                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {formError}
                  </div>
                )}

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Categoría / Concepto
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2 sm:grid-cols-4">
                    {CATEGORY_PRESETS.map((p) => {
                      const Icon = p.icon;
                      const selected = formCategory === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormCategory(p.id)}
                          className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition text-left ${
                            selected
                              ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${selected ? 'text-rose-600' : 'text-slate-400'}`} />
                          <span className="truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormCategory('custom')}
                      className={`text-xs font-medium underline ${
                        formCategory === 'custom' ? 'text-rose-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      + Otra categoría personalizada
                    </button>
                  </div>
                  {formCategory === 'custom' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Escribí el nombre de la categoría (ej: Publicidad, Honorarios...)"
                      className="mt-2 w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      required
                    />
                  )}
                </div>

                {/* Monto y Fecha */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Importe ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-base font-bold text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500"
                      required
                    />
                  </div>
                </div>

                {/* Medio de pago */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Medio de Pago
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia bancaria</option>
                    <option value="card">Tarjeta de débito / crédito</option>
                    <option value="check">Cheque</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {/* Notas / Detalle */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Detalle o Notas (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ej: Pago alquiler mes de Septiembre, Factura Edesur, etc."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                <button
                  type="button"
                  className="pill-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="pill-btn primary"
                >
                  {saving ? 'Guardando...' : 'Guardar Egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
