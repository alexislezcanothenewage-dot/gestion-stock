import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { attachmentFileUrl } from '../api';

export default function ProductForm({ form, categories, onClose, onSave }) {
  const [state, setState] = useState(form);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    form?.photo_id ? attachmentFileUrl(form.photo_id) : null
  );
  const fileRef = useRef(null);

  function set(key, value) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(ev) {
    const file = ev.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal-card wide"
        onClick={(ev) => ev.stopPropagation()}
        onSubmit={async (ev) => {
          ev.preventDefault();
          setBusy(true);
          setError('');
          try {
            await onSave(
              {
                sku: state.sku,
                name: state.name,
                description: state.description,
                categoryId: state.categoryId || null,
                unit: state.unit,
                barcode: state.barcode,
                costPrice: Number(state.costPrice || 0),
                salePrice: Number(state.salePrice || 0),
                stockQty: Number(state.stockQty || 0),
                minStock: Number(state.minStock || 0),
                active: true,
              },
              photoFile
            );
          } catch (err) {
            setError(err.message);
            setBusy(false);
          }
        }}
      >
        <div className="border-b border-[#dadce0] px-5 py-4 text-lg font-bold text-slate-800">
          {state.id ? 'Editar producto' : 'Nuevo producto'}
        </div>

        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {error}
            </div>
          )}

          {/* Campo de Subida de Foto */}
          <div className="sm:col-span-2 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            {photoPreview ? (
              <div className="relative group shrink-0">
                <img
                  src={photoPreview}
                  alt="Foto"
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700"
                  title="Quitar foto"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="grid h-16 w-16 shrink-0 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400 transition hover:border-[#1a73e8] hover:text-[#1a73e8]"
                title="Elegir foto"
              >
                <Camera size={24} />
              </div>
            )}

            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">Foto del producto</div>
              <div className="text-xs text-slate-500 mb-2">
                Formatos JPG, PNG, WEBP (se mostrará en el catálogo y ranking)
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="pill-btn text-xs h-7 px-3 inline-flex items-center gap-1.5"
                onClick={() => fileRef.current?.click()}
              >
                <Camera size={13} />
                <span>{photoPreview ? 'Cambiar foto' : 'Seleccionar foto'}</span>
              </button>
            </div>
          </div>

          <label className="field">
            <span>SKU</span>
            <input value={state.sku} onChange={(e) => set('sku', e.target.value)} required />
          </label>
          <label className="field">
            <span>Nombre</span>
            <input value={state.name} onChange={(e) => set('name', e.target.value)} required />
          </label>
          <label className="field">
            <span>Categoría</span>
            <select value={state.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Unidad</span>
            <input value={state.unit} onChange={(e) => set('unit', e.target.value)} />
          </label>
          <label className="field">
            <span>Código de barras</span>
            <input value={state.barcode} onChange={(e) => set('barcode', e.target.value)} />
          </label>
          <label className="field">
            <span>Costo</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={state.costPrice}
              onChange={(e) => set('costPrice', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Precio de venta</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={state.salePrice}
              onChange={(e) => set('salePrice', e.target.value)}
            />
          </label>
          {!state.id && (
            <label className="field">
              <span>Stock inicial</span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={state.stockQty}
                onChange={(e) => set('stockQty', e.target.value)}
              />
            </label>
          )}
          <label className="field">
            <span>Stock mínimo</span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={state.minStock}
              onChange={(e) => set('minStock', e.target.value)}
            />
          </label>
          <label className="field sm:col-span-2">
            <span>Descripción</span>
            <textarea
              rows={2}
              value={state.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#dadce0] px-5 py-3">
          <button type="button" className="pill-btn" onClick={onClose}>
            Cerrar
          </button>
          <button type="submit" className="pill-btn primary" disabled={busy}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

export function emptyProduct() {
  return {
    id: null,
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    unit: 'un',
    barcode: '',
    costPrice: '',
    salePrice: '',
    stockQty: '',
    minStock: '',
    photo_id: null,
  };
}

export function toProductForm(row) {
  return {
    id: row.id,
    sku: row.sku || '',
    name: row.name || '',
    description: row.description || '',
    categoryId: row.category_id || '',
    unit: row.unit || 'un',
    barcode: row.barcode || '',
    costPrice: row.cost_price || '',
    salePrice: row.sale_price || '',
    stockQty: row.stock_qty || '',
    minStock: row.min_stock || '',
    photo_id: row.photo_id || null,
  };
}
