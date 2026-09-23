import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Camera } from 'lucide-react';
import { api, attachmentFileUrl } from '../api';
import ConfirmDangerModal from '../components/ConfirmDangerModal';
import ProductForm, { emptyProduct, toProductForm } from '../components/ProductForm';
import StockAdjustModal from '../components/StockAdjustModal';
import { money, qty } from '../format';
import { useStore } from '../store';

function ProductPhotoCell({ row, onUploaded }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadAttachment('product', row.id, file);
      await onUploaded();
    } catch (err) {
      alert(err.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="relative group shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {row.photo_id ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-xl border border-slate-200 transition hover:border-[#1a73e8]"
          title="Hacé clic para cambiar la foto"
        >
          <img
            src={attachmentFileUrl(row.photo_id)}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 hidden place-items-center bg-black/40 text-white group-hover:grid">
            <Camera className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="grid h-12 w-12 place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-400 transition hover:border-[#1a73e8] hover:bg-blue-50/70 hover:text-[#1a73e8]"
          title="Hacé clic para subir una foto directamente"
        >
          {uploading ? (
            <span className="text-[10px]">...</span>
          ) : (
            <div className="flex flex-col items-center">
              <Camera className="h-3.5 w-3.5" />
              <span className="text-[9px] mt-0.5">+ Foto</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const { currency } = useStore();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState(params.get('q') || '');
  const [categoryId, setCategoryId] = useState(params.get('categoryId') || '');
  const [lowStock, setLowStock] = useState(params.get('lowStock') === 'true');
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const isLow = params.get('lowStock') === 'true';
    if (isLow !== lowStock) setLowStock(isLow);
  }, [params]);

  const query = useMemo(() => {
    const search = new URLSearchParams();
    if (q.trim()) search.set('q', q.trim());
    if (categoryId) search.set('categoryId', categoryId);
    if (lowStock) search.set('lowStock', 'true');
    return `?${search.toString()}`;
  }, [q, categoryId, lowStock]);

  async function load() {
    const [products, cats] = await Promise.all([api.products(query), api.categories()]);
    setRows(products.data);
    setCategories(cats.data);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (q.trim()) next.set('q', q.trim());
        else next.delete('q');
        if (categoryId) next.set('categoryId', categoryId);
        else next.delete('categoryId');
        if (lowStock) next.set('lowStock', 'true');
        else next.delete('lowStock');
        return next;
      }, { replace: true });
      load().catch((err) => setError(err.message));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl">Productos</h1>
        <input
          className="h-9 w-full min-w-0 rounded-full border border-[#dadce0] px-4 text-sm outline-none focus:border-[#1a73e8] sm:w-auto sm:min-w-[220px]"
          placeholder="Buscar SKU, nombre o código…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-9 rounded-full border border-[#dadce0] px-3 text-sm"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <div className="flex items-center rounded-full border border-[#dadce0] bg-slate-50 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setLowStock(false)}
            className={`rounded-full px-3 py-1.5 transition ${
              !lowStock
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setLowStock(true)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
              lowStock
                ? 'bg-rose-500 text-white shadow-sm font-semibold'
                : 'text-rose-600 hover:text-rose-700'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Por agotarse</span>
          </button>
        </div>
        <button className="pill-btn primary" onClick={() => setEditing(emptyProduct())}>
          Nuevo producto
        </button>
      </div>
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={async (ev) => {
          ev.preventDefault();
          if (!newCategory.trim()) return;
          await api.saveCategory({ name: newCategory.trim() });
          setNewCategory('');
          await load();
        }}
      >
        <input
          className="h-9 rounded-full border border-[#dadce0] px-4 text-sm"
          placeholder="Nueva categoría"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button className="pill-btn" type="submit">
          Agregar categoría
        </button>
      </form>
      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-[#dadce0]">
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>Precio</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <ProductPhotoCell row={row} onUploaded={load} />
                    <div>
                      <Link className="font-medium text-[#1a73e8]" to={`/productos/${row.id}`}>
                        {row.name}
                      </Link>
                      <div className="text-xs text-[#70757a]">{row.sku}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {(() => {
                    const currentStock = Number(row.stock_qty || 0);
                    const minStock = Number(row.min_stock || 0);
                    const isZero = currentStock <= 0;
                    const isLow = minStock > 0 && currentStock <= minStock;

                    if (isZero) {
                      return (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping"></span>
                            0 {row.unit} (Agotado)
                          </span>
                          {minStock > 0 && (
                            <span className="text-[11px] text-slate-400">Mín: {qty(minStock)}</span>
                          )}
                        </div>
                      );
                    }

                    if (isLow) {
                      return (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                            ⚠️ {qty(currentStock)} {row.unit}
                          </span>
                          <span className="text-[11px] font-medium text-amber-700">Mín: {qty(minStock)} {row.unit}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          {qty(currentStock)} {row.unit}
                        </span>
                        {minStock > 0 && (
                          <span className="text-[11px] text-slate-400">Mín: {qty(minStock)}</span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>{money(row.cost_price, currency)}</td>
                <td>{money(row.sale_price, currency)}</td>
                <td className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button className="pill-btn" onClick={() => setAdjusting(row)}>
                      Stock
                    </button>
                    <button className="pill-btn" onClick={() => setEditing(toProductForm(row))}>
                      Editar
                    </button>
                    <button className="pill-btn danger" onClick={() => setRemoving(row)}>
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="py-8 text-center text-[#70757a]" colSpan={6}>
                  No hay productos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {adjusting && (
        <StockAdjustModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSave={async (body) => {
            await api.adjustStock(adjusting.id, body);
            setAdjusting(null);
            await load();
          }}
        />
      )}
      {removing && (
        <ConfirmDangerModal
          title={`Borrar ${removing.name}`}
          message={`Se va a borrar el producto ${removing.name} (${removing.sku}) y su historial de stock. Si está en ventas o compras, primero hay que borrar esos comprobantes.`}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await api.deleteProduct(removing.id);
            setRemoving(null);
            await load();
          }}
        />
      )}
      {editing && (
        <ProductForm
          form={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={async (body, photoFile) => {
            let prodId = editing.id;
            if (editing.id) {
              await api.saveProduct(editing.id, body);
            } else {
              const res = await api.saveProduct(null, body);
              prodId = res.data?.id;
            }
            if (photoFile && prodId) {
              await api.uploadAttachment('product', prodId, photoFile);
            }
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
