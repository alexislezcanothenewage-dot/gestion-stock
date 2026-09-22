import { useState } from 'react';
import { CheckCircle2, KeyRound, Lock, ShieldCheck, Store } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../store';

export default function SettingsPage() {
  const { settings, reload } = useStore();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Estados para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);

  const current = form || settings;
  if (!current) return <div className="p-6 text-sm text-[#70757a]">Cargando…</div>;

  async function handlePasswordChange(ev) {
    ev.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword) {
      setPwdError('Completá la contraseña actual y la nueva');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Las contraseñas no coinciden');
      return;
    }

    setPwdBusy(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPwdSuccess('¡Contraseña cambiada con éxito!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 3000);
    } catch (err) {
      setPwdError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <div className="h-full overflow-auto bg-slate-50/50 p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Configuración</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Personaliza los datos de tu comercio y la seguridad de tu cuenta
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Tarjeta 1: Datos del Comercio */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Datos del Comercio</h2>
              <p className="text-xs text-slate-500">Moneda, impuestos y zona horaria</p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (ev) => {
              ev.preventDefault();
              setError('');
              try {
                await api.saveSettings({
                  name: current.name,
                  timezone: current.timezone,
                  currency: current.currency,
                  taxRate: Number(current.tax_rate || 0),
                });
                await reload();
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            {saved && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Datos guardados correctamente</span>
              </div>
            )}

            <label className="field">
              <span>Nombre del comercio</span>
              <input
                value={current.name}
                onChange={(e) => setForm({ ...current, name: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Zona horaria</span>
              <input
                value={current.timezone}
                onChange={(e) => setForm({ ...current, timezone: e.target.value })}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="field">
                <span>Moneda</span>
                <input
                  value={current.currency}
                  onChange={(e) => setForm({ ...current, currency: e.target.value })}
                />
              </label>
              <label className="field">
                <span>IVA / impuesto (%)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={current.tax_rate}
                  onChange={(e) => setForm({ ...current, tax_rate: e.target.value })}
                />
              </label>
            </div>

            <button className="pill-btn primary" type="submit">
              {saved ? 'Guardado ✓' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Tarjeta 2: Cambiar Contraseña */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Seguridad y Contraseña</h2>
              <p className="text-xs text-slate-500">
                Cambia la contraseña por defecto (admin123) por una segura
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handlePasswordChange}>
            {pwdError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{pwdError}</div>
            )}
            {pwdSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <label className="field">
              <span>Contraseña actual</span>
              <input
                type="password"
                placeholder="Ingresá tu contraseña actual (ej: admin123)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                <span>Nueva contraseña</span>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Repetir nueva contraseña</span>
                <input
                  type="password"
                  placeholder="Repetí la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>

            <button
              className="pill-btn primary"
              type="submit"
              disabled={pwdBusy}
            >
              {pwdBusy ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
