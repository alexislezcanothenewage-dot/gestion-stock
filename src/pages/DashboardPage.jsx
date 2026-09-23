import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  DollarSign,
  Flame,
  Layers,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { api, attachmentFileUrl } from '../api';
import { money, qty } from '../format';
import { useStore } from '../store';
import StatusBadge from '../components/StatusBadge';
import StockAdjustModal from '../components/StockAdjustModal';

export default function DashboardPage() {
  const { currency } = useStore();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  async function loadData() {
    try {
      setError('');
      const res = await api.dashboard();
      setData(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (!data && !error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-[#70757a]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-[#1a73e8]" />
          <span>Cargando panel de control…</span>
        </div>
      </div>
    );
  }

  const topProducts = data?.topProducts || [];
  const lowStockProducts = data?.lowStockProducts || [];
  const lowStockCount = Number(data?.lowStockCount || 0);
  const maxSoldQty = Math.max(...topProducts.map((p) => Number(p.total_qty || 0)), 1);

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-slate-50/70 to-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Panel Principal</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Resumen comercial, métricas en tiempo real y alertas de inventario
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          title="Actualizar datos"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <>
          {/* Fila de Tarjetas KPI con diseño amplio para que los números de millones se vean completos */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Ventas del mes */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Ventas del mes
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight text-emerald-950">
                {money(data.salesMonth.total, currency)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {data.salesMonth.count} ventas confirmadas
              </div>
            </div>

            {/* Compras del mes */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                  Compras del mes
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500 text-white shadow-sm shadow-blue-200">
                  <PackagePlus className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight text-blue-950">
                {money(data.purchasesMonth.total, currency)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-blue-700">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                {data.purchasesMonth.count} compras a prov.
              </div>
            </div>

            {/* Stock valorizado */}
            <div className="group relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
                  Stock a costo
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-200">
                  <Boxes className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight text-indigo-950">
                {money(data.stock.cost_value, currency)}
              </div>
              <div className="mt-1 text-xs font-medium text-indigo-700">
                Venta: {money(data.stock.sale_value, currency)}
              </div>
            </div>

            {/* Por cobrar */}
            <div className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Por cobrar
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-200">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight text-amber-950">
                {money(data.receivable, currency)}
              </div>
              <div className="mt-1 text-xs font-medium text-amber-700">Saldo de clientes</div>
            </div>

            {/* Por pagar */}
            <div className="group relative overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-800">
                  Por pagar
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500 text-white shadow-sm shadow-purple-200">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight text-purple-950">
                {money(data.payable, currency)}
              </div>
              <div className="mt-1 text-xs font-medium text-purple-700">A pagar a proveedores</div>
            </div>

            {/* Alerta de Stock Crítico */}
            <Link
              to="/productos?lowStock=true"
              className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                lowStockCount > 0
                  ? 'border-rose-300 bg-gradient-to-br from-rose-50 via-white to-red-50 text-rose-950'
                  : 'border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    lowStockCount > 0 ? 'text-rose-800' : 'text-emerald-800'
                  }`}
                >
                  Alertas Stock
                </span>
                <div
                  className={`grid h-8 w-8 place-items-center rounded-xl text-white shadow-sm ${
                    lowStockCount > 0 ? 'bg-rose-500 shadow-rose-200 animate-pulse' : 'bg-emerald-500 shadow-emerald-200'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div
                className={`mt-3 text-2xl font-black tracking-tight ${
                  lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {lowStockCount} {lowStockCount === 1 ? 'producto' : 'productos'}
              </div>
              <div
                className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
                  lowStockCount > 0 ? 'text-rose-600 group-hover:underline' : 'text-emerald-700'
                }`}
              >
                {lowStockCount > 0 ? 'Reponer urgente →' : 'Nivel de stock óptimo ✓'}
              </div>
            </Link>
          </div>

          {/* Dos Columnas Principales: Lo más vendido vs Lo que se está agotando */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* COLUMNA 1: PRODUCTOS MÁS VENDIDOS */}
            <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-sm shadow-orange-200">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Productos Más Vendidos</h2>
                    <p className="text-xs text-slate-500">Ranking por unidades comercializadas</p>
                  </div>
                </div>
                <Link
                  to="/ventas"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a73e8] transition hover:text-[#174ea6]"
                >
                  <span>Ver ventas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {topProducts.length > 0 ? (
                <div className="space-y-3.5">
                  {topProducts.map((prod, index) => {
                    const percent = Math.min(100, Math.round((Number(prod.total_qty) / maxSoldQty) * 100));
                    const isLow = Number(prod.stock_qty) <= 0;

                    // Medallas o insignias según el puesto
                    let rankBadge = (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                    );
                    if (index === 0) {
                      rankBadge = (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-xs font-black text-white shadow-sm ring-2 ring-amber-200">
                          1
                        </span>
                      );
                    } else if (index === 1) {
                      rankBadge = (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-xs font-black text-white shadow-sm ring-2 ring-slate-200">
                          2
                        </span>
                      );
                    } else if (index === 2) {
                      rankBadge = (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-xs font-black text-white shadow-sm ring-2 ring-amber-300">
                          3
                        </span>
                      );
                    }

                    return (
                      <div
                        key={prod.id}
                        className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          {rankBadge}

                          {prod.photo_id ? (
                            <img
                              src={attachmentFileUrl(prod.photo_id)}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-dashed border-slate-200 bg-white text-xs font-semibold text-slate-400">
                              <Boxes className="h-4 w-4" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                to={`/productos/${prod.id}`}
                                className="truncate font-semibold text-slate-800 transition hover:text-[#1a73e8]"
                              >
                                {prod.name}
                              </Link>
                              <span className="shrink-0 text-xs font-bold text-emerald-700">
                                {money(prod.total_revenue, currency)}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                              <span>SKU: {prod.sku}</span>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                                  <ShoppingCart className="h-3 w-3" />
                                  {qty(prod.total_qty)} {prod.unit || 'un'}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span
                                  className={`font-medium ${
                                    isLow ? 'font-bold text-rose-600' : 'text-slate-600'
                                  }`}
                                >
                                  Stock: {qty(prod.stock_qty)}
                                </span>
                              </div>
                            </div>

                            {/* Barra de progreso de volumen */}
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <div className="text-slate-400">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8 stroke-1" />
                    <p className="text-sm font-medium text-slate-600">Aún no hay ventas registradas</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Los productos con mayor salida aparecerán aquí automáticamente.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA 2: PRODUCTOS QUE SE ESTÁN AGOTANDO */}
            <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-sm shadow-rose-200">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Productos por Agotarse</h2>
                    <p className="text-xs text-slate-500">
                      Stock crítico o inferior al mínimo configurado
                    </p>
                  </div>
                </div>
                <Link
                  to="/productos?lowStock=true"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  <span>Ver todos ({lowStockCount})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {lowStockProducts.length > 0 ? (
                <div className="space-y-3.5">
                  {lowStockProducts.map((prod) => {
                    const isZero = Number(prod.stock_qty) <= 0;
                    const minVal = Number(prod.min_stock || 0);

                    return (
                      <div
                        key={prod.id}
                        className={`group relative rounded-xl border p-3 transition ${
                          isZero
                            ? 'border-rose-200 bg-gradient-to-r from-rose-50/70 via-white to-rose-50/20 hover:border-rose-300'
                            : 'border-amber-200 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/20 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {prod.photo_id ? (
                            <img
                              src={attachmentFileUrl(prod.photo_id)}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div
                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-xs font-semibold ${
                                isZero
                                  ? 'border-rose-200 bg-rose-100 text-rose-700'
                                  : 'border-amber-200 bg-amber-100 text-amber-700'
                              }`}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                to={`/productos/${prod.id}`}
                                className="truncate font-semibold text-slate-800 transition hover:text-[#1a73e8]"
                              >
                                {prod.name}
                              </Link>
                              {isZero ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping"></span>
                                  Agotado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                  Bajo stock
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-xs">
                              <span className="text-slate-500">
                                SKU: {prod.sku} {prod.category_name && `· ${prod.category_name}`}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">
                                  Actual:{' '}
                                  <span className={isZero ? 'text-rose-600' : 'text-amber-700'}>
                                    {qty(prod.stock_qty)} {prod.unit}
                                  </span>
                                </span>
                                {minVal > 0 && (
                                  <span className="text-slate-500">
                                    (Mín: {qty(minVal)} {prod.unit})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Botón directo para ajustar stock */}
                          <button
                            onClick={() => setAdjustingProduct(prod)}
                            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#1a73e8] hover:bg-blue-50 hover:text-[#1a73e8]"
                            title="Ajustar stock inmediatamente"
                          >
                            + Ajustar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-8 text-center">
                  <div className="text-emerald-700">
                    <CheckCircle2 className="mx-auto mb-2 h-9 w-9 text-emerald-500" />
                    <p className="text-sm font-bold">¡Inventario en niveles óptimos!</p>
                    <p className="mt-1 text-xs text-emerald-600/80">
                      No hay productos por debajo del stock mínimo ni agotados actualmente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección de Últimas Ventas */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Últimas Ventas</h2>
                <p className="text-xs text-slate-500">Transacciones emitidas recientemente</p>
              </div>
              <Link
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a73e8] transition hover:text-[#174ea6]"
                to="/ventas"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="data-table">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="font-semibold text-slate-600">N° Comprobante</th>
                    <th className="font-semibold text-slate-600">Cliente</th>
                    <th className="font-semibold text-slate-600">Fecha</th>
                    <th className="font-semibold text-slate-600">Total</th>
                    <th className="font-semibold text-slate-600">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50/60">
                      <td>
                        <Link
                          className="font-medium text-[#1a73e8] hover:underline"
                          to={`/ventas/${row.id}`}
                        >
                          {row.number}
                        </Link>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                            {(row.customer_name || 'C')[0]}
                          </div>
                          <span className="font-medium text-slate-800">
                            {row.customer_name || 'Consumidor final'}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs text-slate-500">
                        {row.issued_at ? new Date(row.issued_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="font-bold text-slate-900">{money(row.total, currency)}</td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                  {!data.recentSales.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Todavía no hay ventas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Modal para ajuste rápido de stock desde el Dashboard */}
      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSave={async (body) => {
            await api.adjustStock(adjustingProduct.id, body);
            setAdjustingProduct(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}
