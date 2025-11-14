'use client';

export default function TestThemePage() {
  return (
    <div className="min-h-screen p-8">
      {/* Test de Background */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
          Test de Tema
        </h1>
        <p className="text-slate-600 dark:text-white/60 mb-2">
          Este texto debe verse diferente en modo claro y oscuro
        </p>
      </div>

      {/* Test de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Card 1: Estilo Normal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Card Normal
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Background: bg-white / dark:bg-slate-900
          </p>
        </div>

        {/* Card 2: Estilo Glassmorphism */}
        <div className="bg-white/95 dark:bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Card Glassmorphism
          </h2>
          <p className="text-slate-600 dark:text-white/60">
            Background: bg-white/95 / dark:bg-white/5
          </p>
        </div>
      </div>

      {/* Test de Inputs */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Inputs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input con bg-slate-50 */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Input Normal
            </label>
            <input
              type="text"
              placeholder="bg-slate-50 / dark:bg-slate-900/40"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Input con bg específico */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Input Diseño
            </label>
            <input
              type="text"
              placeholder="bg-slate-50 / dark:bg-[#1b1f27]"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1b1f27] border border-slate-300 dark:border-[#3b4354] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#9ca6ba]"
            />
          </div>
        </div>
      </div>

      {/* Test de Botones */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Botones
        </h3>
        <div className="flex gap-4 flex-wrap">
          <button className="px-6 py-3 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white font-bold rounded-lg">
            Primario
          </button>
          <button className="px-6 py-3 bg-white dark:bg-[#282e39] border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white font-medium rounded-lg">
            Secundario
          </button>
        </div>
      </div>

      {/* Información de Debug */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">
          🔍 Debug Info
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>✅ Si ves diferencias de color → Dark mode funciona</li>
          <li>❌ Si todo se ve igual → Hay un problema</li>
          <li>💡 Usa el botón flotante para cambiar de tema</li>
        </ul>
      </div>

      {/* Indicador de tema actual */}
      <div className="mt-8 p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900">
        <p className="text-green-900 dark:text-green-300 font-bold text-center">
          <span className="dark:hidden">☀️ MODO CLARO ACTIVO</span>
          <span className="hidden dark:inline">🌙 MODO OSCURO ACTIVO</span>
        </p>
      </div>
    </div>
  );
}

