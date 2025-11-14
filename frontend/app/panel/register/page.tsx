'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const CIUDADES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Cúcuta',
  'Bucaramanga',
  'Pereira',
  'Santa Marta',
  'Ibagué',
  'Manizales',
  'Villavicencio',
  'Neiva',
  'Pasto',
  'Armenia'
];

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  descripcion: string;
  website: string;
  acceptTerms: boolean;
}

export default function PanelRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    descripcion: '',
    website: '',
    acceptTerms: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGoogleSignUp = async () => {
    if (step === 1) {
      // Validar datos básicos
      if (!formData.nombre || !formData.email || !formData.telefono || !formData.ciudad) {
        setError('Por favor completa todos los campos obligatorios');
        return;
      }
      
      if (!formData.acceptTerms) {
        setError('Debes aceptar los términos y condiciones');
        return;
      }

      setStep(2);
      return;
    }

    // Step 2: Autenticación y creación
    setError('');
    setLoading(true);

    try {
      console.log('🚀 Iniciando registro con Google...');
      
      // 1. Autenticar con Google
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ Usuario autenticado:', user.uid);

      // 2. Crear comercio en el backend
      console.log('📝 Creando comercio...');
      const comercioResponse = await fetch(`${API_URL}/api/comercios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
          descripcion: formData.descripcion,
          website: formData.website || null,
          pais: 'Colombia',
          tipoPlan: 'free',
          status: 'activo'
        }),
      });

      if (!comercioResponse.ok) {
        const errorData = await comercioResponse.json();
        throw new Error(errorData.error || 'Error al crear el comercio');
      }

      const comercio = await comercioResponse.json();
      console.log('✅ Comercio creado:', comercio.id);

      // 3. Asignar usuario al comercio
      console.log('🔗 Asignando usuario al comercio...');
      const asignacionResponse = await fetch(
        `${API_URL}/api/comercios/${comercio.id}/usuarios`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            nombre: user.displayName || formData.nombre,
            rol: 'admin'
          }),
        }
      );

      if (!asignacionResponse.ok) {
        const errorData = await asignacionResponse.json();
        console.error('⚠️ Error al asignar usuario:', errorData);
        // No es crítico, continuar
      } else {
        console.log('✅ Usuario asignado al comercio');
      }

      // 4. Redirigir al panel
      console.log('🎉 Registro completado, redirigiendo...');
      router.push('/panel/dashboard');
      
    } catch (err: any) {
      console.error('❌ Error en el registro:', err);
      setError(err.message || 'Error al registrar el comercio');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#101622] to-[#1a1f2e] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-[#0d59f2] via-blue-600 to-[#0d59f2] rounded-full size-16 flex items-center justify-center shadow-lg shadow-blue-500/50">
              <span className="text-white font-bold text-2xl">GN</span>
            </div>
            <span className="text-white text-2xl font-bold">Grada Negra</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Registra tu Negocio
          </h1>
          <p className="text-[#9ca6ba] text-sm">
            Empieza a vender boletos para tus eventos de forma profesional
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 1 
                  ? 'bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-[#282e39] text-gray-500'
              }`}>
                1
              </div>
              <span className="ml-3 text-white font-medium text-sm hidden sm:inline">Información</span>
            </div>
            
            <div className={`h-1 w-16 rounded transition-all ${
              step >= 2 ? 'bg-gradient-to-r from-[#0d59f2] to-blue-600' : 'bg-[#282e39]'
            }`}></div>
            
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 2 
                  ? 'bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-[#282e39] text-gray-500'
              }`}>
                2
              </div>
              <span className="ml-3 text-white font-medium text-sm hidden sm:inline">Autenticación</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#1b1f27]/80 backdrop-blur-xl border border-[#3b4354]/50 rounded-2xl shadow-2xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Información del Comercio */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0d59f2]">store</span>
                Información de tu Negocio
              </h2>

              {/* Nombre del Comercio */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Nombre del Comercio/Organizador *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-[#9ca6ba] transition-all"
                  placeholder="Ej: Mi Empresa de Eventos"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este será el nombre que verán tus clientes
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Email de Contacto *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-[#9ca6ba] transition-all"
                  placeholder="contacto@ejemplo.com"
                />
              </div>

              {/* Teléfono y Ciudad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-[#9ca6ba] transition-all"
                    placeholder="3001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Ciudad *
                  </label>
                  <select
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent transition-all"
                  >
                    <option value="">Seleccionar ciudad</option>
                    {CIUDADES.map(ciudad => (
                      <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-[#9ca6ba] transition-all resize-none"
                  placeholder="Cuéntanos brevemente sobre tu negocio..."
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Sitio Web (Opcional)
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#282e39]/50 text-white border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-[#0d59f2] focus:outline-none focus:border-transparent placeholder-[#9ca6ba] transition-all"
                  placeholder="https://ejemplo.com"
                />
              </div>

              {/* Términos y Condiciones */}
              <div className="bg-[#282e39]/30 border border-gray-700/30 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-5 h-5 rounded border-gray-600 text-[#0d59f2] focus:ring-2 focus:ring-[#0d59f2] focus:ring-offset-0 bg-[#282e39] cursor-pointer"
                  />
                  <span className="text-sm text-gray-300">
                    Acepto los{' '}
                    <Link href="#" className="text-[#0d59f2] hover:text-blue-400 font-semibold">
                      Términos y Condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link href="#" className="text-[#0d59f2] hover:text-blue-400 font-semibold">
                      Política de Privacidad
                    </Link>{' '}
                    de Grada Negra
                  </span>
                </label>
              </div>

              {/* Botón Continuar */}
              <button
                onClick={() => {
                  if (!formData.nombre || !formData.email || !formData.telefono || !formData.ciudad) {
                    setError('Por favor completa todos los campos obligatorios');
                    return;
                  }
                  if (!formData.acceptTerms) {
                    setError('Debes aceptar los términos y condiciones');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#0d59f2] to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-[#0d59f2] transition-all shadow-lg shadow-blue-500/30 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                Continuar
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          )}

          {/* Step 2: Autenticación con Google */}
          {step === 2 && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span className="text-sm">Volver</span>
              </button>

              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#0d59f2] to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50">
                  <span className="material-symbols-outlined text-white text-4xl">verified_user</span>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3">
                  Autenticación Segura
                </h2>
                <p className="text-[#9ca6ba] mb-8 max-w-md mx-auto">
                  Para mayor seguridad, usa tu cuenta de Google para acceder a tu panel de administración
                </p>

                {/* Resumen de datos */}
                <div className="bg-[#282e39]/30 border border-gray-700/30 rounded-xl p-4 mb-8 text-left">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2] text-sm">summarize</span>
                    Resumen de tu Negocio
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><span className="text-gray-500">Nombre:</span> {formData.nombre}</p>
                    <p><span className="text-gray-500">Email:</span> {formData.email}</p>
                    <p><span className="text-gray-500">Ciudad:</span> {formData.ciudad}</p>
                    <p><span className="text-gray-500">Plan:</span> <span className="text-green-400 font-semibold">FREE</span> (2 eventos)</p>
                  </div>
                </div>

                {/* Botón de Google Sign In */}
                <button
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="w-full max-w-md mx-auto py-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Creando tu cuenta...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-6">
                  Al continuar con Google, aceptas que usaremos tu cuenta para autenticarte de forma segura
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#9ca6ba]">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/panel/login" className="text-[#0d59f2] hover:text-blue-400 font-semibold transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-[#6b7280]">
            Plan FREE incluye: 2 eventos, 1 usuario, 10% de comisión
          </p>
          <p className="text-xs text-[#6b7280]">
            Actualiza a PRO o ENTERPRISE para más funcionalidades
          </p>
        </div>
      </div>
    </div>
  );
}

