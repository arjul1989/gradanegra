"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  cedula?: string;
  fechaNacimiento?: string;
  genero?: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
  ciudad?: string;
  pais?: string;
  notificacionesEmail?: boolean;
  notificacionesSMS?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

function PerfilContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'preferencias' | 'seguridad'>('personal');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    cedula: '',
    fechaNacimiento: '',
    genero: '' as UserProfile['genero'],
    ciudad: '',
    pais: 'Colombia',
    notificacionesEmail: true,
    notificacionesSMS: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      console.log('🔐 Frontend - User UID:', user?.uid);
      console.log('🔐 Frontend - Token obtained:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      console.log('🔐 Frontend - API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/users/${user?.uid}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user?.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar el perfil');

      const data = await response.json();
      console.log('📊 Profile data received:', data);
      console.log('📅 createdAt:', data.createdAt);
      console.log('📅 updatedAt:', data.updatedAt);
      
      setProfile(data);
      setFormData({
        displayName: data.displayName || '',
        phoneNumber: data.phoneNumber || '',
        cedula: data.cedula || '',
        fechaNacimiento: data.fechaNacimiento || '',
        genero: data.genero || '',
        ciudad: data.ciudad || '',
        pais: data.pais || 'Colombia',
        notificacionesEmail: data.notificacionesEmail ?? true,
        notificacionesSMS: data.notificacionesSMS ?? false,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = await user?.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user?.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar los cambios');

      // Recargar el perfil completo para obtener todos los campos actualizados
      await fetchProfile();
      
      setSuccess('Cambios guardados exitosamente');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper para formatear fechas de Firestore
  const formatDate = (dateField: any): string => {
    if (!dateField) return 'N/A';
    
    try {
      // Si es un objeto Timestamp de Firestore con _seconds
      if (dateField._seconds) {
        const date = new Date(dateField._seconds * 1000);
        return date.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Si es un string ISO
      if (typeof dateField === 'string') {
        const date = new Date(dateField);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      // Si es un objeto Date
      if (dateField instanceof Date) {
        return dateField.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Si tiene seconds (otro formato posible)
      if (dateField.seconds) {
        const date = new Date(dateField.seconds * 1000);
        return date.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      console.error('Error formateando fecha:', e);
    }
    
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-[#1a1d29]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-[#0d59f2] border-t-transparent"></div>
            <p className="text-white">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center bg-[#1a1d29]">
      <Navbar />
      
      <div className="flex w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="mb-8 w-full p-4">
          <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0"
                style={{
                  backgroundImage: profile?.photoURL 
                    ? `url("${profile.photoURL}")`
                    : `url("https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || profile?.email || 'User')}&size=128&background=gradient&color=fff")`
                }}
              />
              <div className="flex flex-col justify-center">
                <p className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
                  {profile?.displayName?.split(' ')[0] || 'Usuario'}
                </p>
                <p className="text-gray-400 text-base font-normal">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/20 border border-red-500/50 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-900/20 border border-green-500/50 p-4">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="w-full pb-3">
          <div className="flex border-b border-gray-700 gap-4 sm:gap-8 px-4">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-colors ${
                activeTab === 'personal'
                  ? 'border-[#0d59f2] text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <p className="text-sm font-bold">Información Personal</p>
            </button>
            <button
              onClick={() => setActiveTab('preferencias')}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-colors ${
                activeTab === 'preferencias'
                  ? 'border-[#0d59f2] text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <p className="text-sm font-bold">Preferencias</p>
            </button>
            <button
              onClick={() => setActiveTab('seguridad')}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-colors ${
                activeTab === 'seguridad'
                  ? 'border-[#0d59f2] text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <p className="text-sm font-bold">Seguridad</p>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full flex-1 pt-8">
          <div className="p-4">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <>
                <div className="flex flex-wrap justify-between gap-3 pb-6">
                  <p className="text-white text-3xl font-bold tracking-tight">
                    Información Personal
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
                  {/* Full Name */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      Nombre Completo
                    </label>
                    <input
                      className="form-input w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2]/50 border border-gray-600 bg-[#252836] focus:border-[#0d59f2] h-12 placeholder:text-gray-500 px-4 text-base font-normal transition-colors"
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                    />
                  </div>

                  {/* Email (readonly) */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <input
                        className="form-input w-full rounded-lg text-gray-400 focus:outline-0 border border-gray-600 bg-[#1f222e] h-12 px-4 pr-12 text-base font-normal cursor-not-allowed"
                        type="email"
                        value={profile?.email || ''}
                        readOnly
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        lock
                      </span>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      Número de Teléfono
                    </label>
                    <input
                      className="form-input w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2]/50 border border-gray-600 bg-[#252836] focus:border-[#0d59f2] h-12 placeholder:text-gray-500 px-4 text-base font-normal transition-colors"
                      type="tel"
                      placeholder="Ej: +1 234 567 890"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    />
                  </div>

                  {/* ID Number */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      Número de Identificación
                    </label>
                    <input
                      className="form-input w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2]/50 border border-gray-600 bg-[#252836] focus:border-[#0d59f2] h-12 placeholder:text-gray-500 px-4 text-base font-normal transition-colors"
                      type="text"
                      placeholder="Ej: 12345678A"
                      value={formData.cedula}
                      onChange={(e) => handleInputChange('cedula', e.target.value)}
                    />
                  </div>

                  {/* Birth Date */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      className="form-input w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2]/50 border border-gray-600 bg-[#252836] focus:border-[#0d59f2] h-12 placeholder:text-gray-500 px-4 text-base font-normal transition-colors"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                    />
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      Género
                    </label>
                    <select
                      className="form-select w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2]/50 border border-gray-600 bg-[#252836] focus:border-[#0d59f2] h-12 px-4 text-base font-normal transition-colors"
                      value={formData.genero}
                      onChange={(e) => handleInputChange('genero', e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                    </select>
                  </div>

                  {/* City */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      Ciudad
                    </label>
                    <input
                      className="form-input w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2]/50 border border-gray-600 bg-[#252836] focus:border-[#0d59f2] h-12 placeholder:text-gray-500 px-4 text-base font-normal transition-colors"
                      type="text"
                      placeholder="Ej: Bogotá"
                      value={formData.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    />
                  </div>

                  {/* Country */}
                  <div className="flex flex-col">
                    <label className="text-white text-base font-medium pb-2">
                      País
                    </label>
                    <select
                      className="form-select w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#0d59f2]/50 border border-gray-600 bg-[#252836] focus:border-[#0d59f2] h-12 px-4 text-base font-normal transition-colors"
                      value={formData.pais}
                      onChange={(e) => handleInputChange('pais', e.target.value)}
                    >
                      <option value="Colombia">Colombia</option>
                      <option value="Argentina">Argentina</option>
                      <option value="México">México</option>
                      <option value="España">España</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferencias' && (
              <>
                <div className="flex flex-wrap justify-between gap-3 pb-6">
                  <p className="text-white text-3xl font-bold tracking-tight">
                    Preferencias
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-600 bg-[#252836] p-4">
                    <div className="flex-1">
                      <p className="text-white text-base font-medium">
                        Notificaciones por Email
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Recibe recordatorios y actualizaciones de tus eventos por correo electrónico
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.notificacionesEmail}
                        onChange={(e) => handleInputChange('notificacionesEmail', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0d59f2]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d59f2]"></div>
                    </label>
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-600 bg-[#252836] p-4">
                    <div className="flex-1">
                      <p className="text-white text-base font-medium">
                        Notificaciones por SMS
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Recibe mensajes de texto con recordatorios de eventos (próximamente)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.notificacionesSMS}
                        onChange={(e) => handleInputChange('notificacionesSMS', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0d59f2]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d59f2]"></div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'seguridad' && (
              <>
                <div className="flex flex-wrap justify-between gap-3 pb-6">
                  <p className="text-white text-3xl font-bold tracking-tight">
                    Seguridad
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Account Info */}
                  <div className="rounded-lg border border-gray-600 bg-[#252836] p-4">
                    <p className="text-white text-base font-medium mb-2">
                      Información de la Cuenta
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cuenta creada:</span>
                        <span className="text-white">
                          {formatDate(profile?.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Última actualización:</span>
                        <span className="text-white">
                          {formatDate(profile?.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-4">
                    <p className="text-red-400 text-base font-medium mb-2">
                      Eliminar Cuenta
                    </p>
                    <p className="text-red-300 text-sm mb-4">
                      Una vez eliminada, no podrás recuperar tu cuenta. Asegúrate de no tener boletos activos para eventos futuros.
                    </p>
                    <button
                      className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 h-10 text-sm font-semibold transition-colors"
                      onClick={() => {
                        if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                          // Implement delete account logic
                          alert('Función de eliminación de cuenta próximamente disponible');
                        }
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      Eliminar mi cuenta
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="mt-12 flex flex-col items-center gap-4 border-t border-gray-700 pt-6 sm:flex-row sm:justify-end">
              <button
                onClick={fetchProfile}
                className="flex w-full cursor-pointer items-center justify-center rounded-lg h-11 px-6 bg-transparent text-gray-300 text-sm font-bold border border-gray-600 hover:bg-gray-700 transition-colors sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full cursor-pointer items-center justify-center rounded-lg h-11 px-6 bg-[#0d59f2] text-white text-sm font-bold hover:bg-[#0d59f2]/90 transition-colors sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Perfil() {
  return (
    <ProtectedRoute>
      <PerfilContent />
    </ProtectedRoute>
  );
}
