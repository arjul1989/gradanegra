"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { generateTicketPDF } from "@/lib/pdfGenerator";

interface Boleto {
  id: string;
  numeroBoleto: string;
  precio: number;
  status: 'vendido' | 'usado' | 'cancelado';
  qrCode?: string;
  eventoNombre: string;
  eventoImagen: string;
  eventoCiudad: string;
  eventoUbicacion: string;
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  tierNombre: string;
  tierDescripcion: string;
  googleWalletUrl?: string;
  appleWalletUrl?: string;
  compraId: string;
}

interface Compra {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  metodoPago: string;
  total: number;
  fechaCompra: any;
}

function MisBoletosContent() {
  const { user } = useAuth();
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [filteredBoletos, setFilteredBoletos] = useState<Boleto[]>([]);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'todos' | 'proximos' | 'pasados' | 'usado' | 'cancelado'>('proximos');
  const [ciudadFilter, setCiudadFilter] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBoletos();
      fetchCiudades();
    }
  }, [user]);

  useEffect(() => {
    filterBoletos();
  }, [boletos, statusFilter, ciudadFilter, searchQuery]);

  const fetchBoletos = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      
      const params = new URLSearchParams();
      if (statusFilter !== 'todos') params.append('status', statusFilter);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boletos/user/${user?.uid}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar boletos');

      const data = await response.json();
      setBoletos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCiudades = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boletos/user/${user?.uid}/ciudades`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCiudades(data);
      }
    } catch (err) {
      console.error('Error al cargar ciudades:', err);
    }
  };

  const filterBoletos = () => {
    let filtered = [...boletos];

    // Filter by ciudad
    if (ciudadFilter !== 'todas') {
      filtered = filtered.filter(b => b.eventoCiudad === ciudadFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.eventoNombre.toLowerCase().includes(query) ||
        b.eventoCiudad.toLowerCase().includes(query) ||
        b.numeroBoleto.toLowerCase().includes(query)
      );
    }

    setFilteredBoletos(filtered);
  };

  const handleVerQR = async (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setShowModal(true);

    // Fetch boleto detail with compra info
    try {
      const token = await user?.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boletos/${boleto.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedCompra(data.compra);
        
        // Generate QR if not exists
        if (!data.qrCode) {
          await generateQR(boleto.id);
        }
      }
    } catch (err) {
      console.error('Error al cargar detalle:', err);
    }
  };

  const generateQR = async (boletoId: string) => {
    try {
      setGeneratingQR(true);
      const token = await user?.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boletos/${boletoId}/generar-qr`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update boleto with new QR
        setBoletos(prev => prev.map(b => 
          b.id === boletoId ? { ...b, qrCode: data.qrCode } : b
        ));
        if (selectedBoleto?.id === boletoId) {
          setSelectedBoleto(prev => prev ? { ...prev, qrCode: data.qrCode } : null);
        }
      }
    } catch (err) {
      console.error('Error al generar QR:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleReenviar = async (boletoId: string) => {
    if (!user?.email) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boletos/${boletoId}/reenviar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email: user.email }),
        }
      );

      if (response.ok) {
        alert('✅ Boleto reenviado a tu correo');
      } else {
        throw new Error('Error al reenviar boleto');
      }
    } catch (err) {
      alert('❌ Error al reenviar boleto');
    }
  };

  const handleDownloadPDF = (boleto: Boleto) => {
    generateTicketPDF({
      numeroBoleto: boleto.numeroBoleto,
      eventoNombre: boleto.eventoNombre,
      fechaEvento: boleto.fechaEvento,
      horaInicio: boleto.horaInicio,
      horaFin: boleto.horaFin,
      eventoUbicacion: boleto.eventoUbicacion,
      eventoCiudad: boleto.eventoCiudad,
      tierNombre: boleto.tierNombre,
      tierDescripcion: boleto.tierDescripcion,
      precio: boleto.precio,
      qrCode: boleto.qrCode,
      compradorNombre: user?.displayName || undefined,
    });
  };

  const getStatusBadge = (boleto: Boleto) => {
    const now = new Date();
    const fechaEvento = new Date(boleto.fechaEvento);
    
    if (boleto.status === 'usado') {
      return { text: 'Usado', color: 'bg-blue-500/80' };
    }
    if (boleto.status === 'cancelado') {
      return { text: 'Cancelado', color: 'bg-red-500/80' };
    }
    if (fechaEvento < now) {
      return { text: 'Expirado', color: 'bg-gray-500/80' };
    }
    
    const hoursUntil = (fechaEvento.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil < 24) {
      return { text: 'Próximo', color: 'bg-yellow-500/80' };
    }
    
    return { text: 'Válido', color: 'bg-green-500/80' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-background-dark">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-slate-900 dark:text-white">Cargando boletos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-background-dark">
      <Navbar />

      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-7xl flex-col gap-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight">
              Mis Boletos
            </h1>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Status Filter */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setStatusFilter('proximos')}
                className={`flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all ${
                  statusFilter === 'proximos'
                    ? 'bg-primary text-white'
                    : 'bg-white/10 dark:bg-white/10 text-slate-900 dark:text-slate-300 hover:bg-white/20'
                }`}
              >
                Próximos
              </button>
              <button
                onClick={() => setStatusFilter('pasados')}
                className={`flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all ${
                  statusFilter === 'pasados'
                    ? 'bg-primary text-white'
                    : 'bg-white/10 dark:bg-white/10 text-slate-900 dark:text-slate-300 hover:bg-white/20'
                }`}
              >
                Pasados
              </button>
              <button
                onClick={() => setStatusFilter('usado')}
                className={`flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all ${
                  statusFilter === 'usado'
                    ? 'bg-primary text-white'
                    : 'bg-white/10 dark:bg-white/10 text-slate-900 dark:text-slate-300 hover:bg-white/20'
                }`}
              >
                Usados
              </button>
              <button
                onClick={() => setStatusFilter('cancelado')}
                className={`flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all ${
                  statusFilter === 'cancelado'
                    ? 'bg-primary text-white'
                    : 'bg-white/10 dark:bg-white/10 text-slate-900 dark:text-slate-300 hover:bg-white/20'
                }`}
              >
                Cancelados
              </button>
            </div>

            {/* Search and Ciudad Filter */}
            <div className="flex gap-3">
              {/* Ciudad Select */}
              <select
                value={ciudadFilter}
                onChange={(e) => setCiudadFilter(e.target.value)}
                className="h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="todas">Todas las ciudades</option>
                {ciudades.map(ciudad => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>

              {/* Search */}
              <div className="relative min-w-[200px] md:w-80">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar evento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-12 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Boletos Grid */}
          {filteredBoletos.length === 0 ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">
                confirmation_number
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                No tienes boletos en esta categoría
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                ¡Explora nuestros eventos para encontrar tu próxima experiencia!
              </p>
              <a href="/" className="mt-6">
                <button className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-all">
                  Buscar Eventos
                </button>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBoletos.map((boleto) => {
                const badge = getStatusBadge(boleto);
                const isDisabled = boleto.status === 'usado' || boleto.status === 'cancelado';

                return (
                  <div
                    key={boleto.id}
                    className={`flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${
                      !isDisabled && 'hover:scale-[1.02]'
                    } ${isDisabled && 'opacity-60'}`}
                  >
                    {/* Image */}
                    <div className="relative w-full aspect-video">
                      <Image
                        src={boleto.eventoImagen || '/placeholder-event.jpg'}
                        alt={boleto.eventoNombre}
                        fill
                        className="object-cover"
                      />
                      <div className={`absolute top-3 right-3 ${badge.color} backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {badge.text}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col gap-4 flex-grow">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold line-clamp-2">
                          {boleto.eventoNombre}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          {formatDate(boleto.fechaEvento)}, {boleto.horaInicio} - {boleto.eventoUbicacion}, {boleto.eventoCiudad}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          {boleto.tierNombre}
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-mono">
                          #{boleto.numeroBoleto}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <button
                          onClick={() => handleVerQR(boleto)}
                          disabled={isDisabled}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-lg h-10 px-3 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-base">qr_code_2</span>
                          <span>Ver QR</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(boleto)}
                          disabled={isDisabled}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-lg h-10 px-3 bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-300 dark:hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => handleReenviar(boleto.id)}
                          disabled={isDisabled}
                          className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reenviar por email"
                        >
                          <span className="material-symbols-outlined text-base">email</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalle */}
      {showModal && selectedBoleto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Detalle del Boleto
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* QR Code Section */}
              <div className="flex flex-col items-center gap-4 p-6 bg-slate-100 dark:bg-slate-900 rounded-xl">
                {selectedBoleto.qrCode ? (
                  <>
                    <div className="bg-white p-4 rounded-xl">
                      <Image
                        src={selectedBoleto.qrCode}
                        alt="QR Code"
                        width={300}
                        height={300}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-slate-900 dark:text-white text-sm font-medium text-center">
                      Presenta este código en la entrada
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-mono">
                      {selectedBoleto.numeroBoleto}
                    </p>
                  </>
                ) : (
                  <button
                    onClick={() => generateQR(selectedBoleto.id)}
                    disabled={generatingQR}
                    className="flex items-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {generatingQR ? 'Generando...' : 'Generar QR Code'}
                  </button>
                )}
              </div>

              {/* Event Info */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedBoleto.eventoNombre}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    <span>{formatDate(selectedBoleto.fechaEvento)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    <span>{selectedBoleto.horaInicio} - {selectedBoleto.horaFin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span>{selectedBoleto.eventoUbicacion}, {selectedBoleto.eventoCiudad}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-white">Detalles del Boleto</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Tier</p>
                    <p className="text-slate-900 dark:text-white font-medium">{selectedBoleto.tierNombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Precio</p>
                    <p className="text-slate-900 dark:text-white font-medium">
                      ${selectedBoleto.precio.toLocaleString('es-CO')} COP
                    </p>
                  </div>
                  {selectedCompra && (
                    <>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Método de pago</p>
                        <p className="text-slate-900 dark:text-white font-medium capitalize">
                          {selectedCompra.metodoPago}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Fecha de compra</p>
                        <p className="text-slate-900 dark:text-white font-medium">
                          {new Date(selectedCompra.fechaCompra._seconds * 1000).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => selectedBoleto && handleDownloadPDF(selectedBoleto)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg h-12 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined">download</span>
                  Descargar PDF
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => alert('Google Wallet próximamente')}
                    className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Google Wallet
                  </button>
                  <button
                    onClick={() => alert('Apple Wallet próximamente')}
                    className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Apple Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MisBoletos() {
  return (
    <ProtectedRoute>
      <MisBoletosContent />
    </ProtectedRoute>
  );
}
