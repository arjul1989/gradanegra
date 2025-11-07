'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface CustomPlanModalProps {
  comercio: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function CustomPlanModal({ comercio, isOpen, onClose, onSave }: CustomPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [tipoPlan, setTipoPlan] = useState(comercio?.tipoPlan || 'basic');
  const [limiteEventosEnabled, setLimiteEventosEnabled] = useState(!!comercio?.limiteEventosCustom);
  const [limiteEventos, setLimiteEventos] = useState(comercio?.limiteEventosCustom || comercio?.limiteEventos || 10);
  
  const [limiteDestacadosEnabled, setLimiteDestacadosEnabled] = useState(!!comercio?.limiteDestacadosCustom);
  const [limiteDestacados, setLimiteDestacados] = useState(comercio?.limiteDestacadosCustom || 0);
  
  const [limiteUsuariosEnabled, setLimiteUsuariosEnabled] = useState(!!comercio?.limiteUsuariosCustom);
  const [limiteUsuarios, setLimiteUsuarios] = useState(comercio?.limiteUsuariosCustom || 1);
  
  const [comisionEnabled, setComisionEnabled] = useState(!!comercio?.comisionCustom);
  const [comision, setComision] = useState(comercio?.comisionCustom || comercio?.comision || 10);
  
  const [motivo, setMotivo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivo.trim()) {
      setError('El motivo es obligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data: any = {
        tipoPlan,
        motivo: motivo.trim(),
      };

      // Solo enviar custom si está habilitado
      if (limiteEventosEnabled) {
        data.limiteEventosCustom = limiteEventos === -1 ? -1 : parseInt(limiteEventos.toString());
      } else {
        data.limiteEventosCustom = null; // Remover custom
      }

      if (limiteDestacadosEnabled) {
        data.limiteDestacadosCustom = limiteDestacados === -1 ? -1 : parseInt(limiteDestacados.toString());
      } else {
        data.limiteDestacadosCustom = null;
      }

      if (limiteUsuariosEnabled) {
        data.limiteUsuariosCustom = limiteUsuarios === -1 ? -1 : parseInt(limiteUsuarios.toString());
      } else {
        data.limiteUsuariosCustom = null;
      }

      if (comisionEnabled) {
        data.comisionCustom = parseFloat(comision.toString());
      } else {
        data.comisionCustom = null;
      }

      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Configurar Plan Personalizado</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Plan Base */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Plan Base
            </label>
            <select
              value={tipoPlan}
              onChange={(e) => setTipoPlan(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Limite Eventos */}
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">
                Límite de Eventos
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={limiteEventosEnabled}
                  onChange={(e) => setLimiteEventosEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {limiteEventosEnabled && (
              <input
                type="number"
                value={limiteEventos}
                onChange={(e) => setLimiteEventos(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Número de eventos (-1 para ilimitado)"
              />
            )}
            {!limiteEventosEnabled && (
              <p className="text-sm text-slate-400">Se usará el límite del plan base</p>
            )}
          </div>

          {/* Limite Destacados */}
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">
                Límite de Eventos Destacados
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={limiteDestacadosEnabled}
                  onChange={(e) => setLimiteDestacadosEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {limiteDestacadosEnabled && (
              <input
                type="number"
                value={limiteDestacados}
                onChange={(e) => setLimiteDestacados(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Número de destacados (-1 para ilimitado)"
              />
            )}
            {!limiteDestacadosEnabled && (
              <p className="text-sm text-slate-400">Se usará el límite del plan base</p>
            )}
          </div>

          {/* Limite Usuarios */}
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">
                Límite de Usuarios
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={limiteUsuariosEnabled}
                  onChange={(e) => setLimiteUsuariosEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {limiteUsuariosEnabled && (
              <input
                type="number"
                value={limiteUsuarios}
                onChange={(e) => setLimiteUsuarios(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Número de usuarios (-1 para ilimitado)"
              />
            )}
            {!limiteUsuariosEnabled && (
              <p className="text-sm text-slate-400">Se usará el límite del plan base</p>
            )}
          </div>

          {/* Comision */}
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">
                Comisión Personalizada (%)
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={comisionEnabled}
                  onChange={(e) => setComisionEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {comisionEnabled && (
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  value={comision}
                  onChange={(e) => setComision(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Porcentaje de comisión (0-15%)"
                />
                <p className="text-xs text-slate-400 mt-1">Rango permitido: 0% - 15%</p>
              </div>
            )}
            {!comisionEnabled && (
              <p className="text-sm text-slate-400">Se usará la comisión del plan base</p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Motivo del Cambio *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: Acuerdo comercial especial - Cliente VIP - Contrato anual"
            />
            <p className="text-xs text-slate-400 mt-1">Este motivo quedará registrado en el log de auditoría</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
