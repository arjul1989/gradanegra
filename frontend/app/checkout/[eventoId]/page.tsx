"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Script from "next/script";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface TierType {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  capacidad: number;
  vendidos: number;
  disponible: boolean;
}

interface EventoData {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  imagenUrl?: string;
  fecha: any;
  fechaInicio?: any;
  lugar: string;
  ubicacion?: string;
  ciudad?: string;
  precioBase: number;
  comercioId?: string;
  tiers?: TierType[];
}

interface TicketSeleccionado {
  tierId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface PaymentMethodMeta {
  id: string;
  name: string;
  paymentType: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
  thumbnail?: string;
  financialInstitutions?: Array<{ id: string; description: string }>;
}

interface PaymentInstructionsState {
  type: 'pse' | 'efecty';
  redirectUrl?: string | null;
  ticketUrl?: string | null;
  barcode?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  referenceId?: string | null;
  expirationDate?: string | null;
}

function CheckoutContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const eventoId = params.eventoId as string;

  const [evento, setEvento] = useState<EventoData | null>(null);
  const [ticketsSeleccionados, setTicketsSeleccionados] = useState<TicketSeleccionado[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [compraId, setCompraId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pse' | 'efecty'>('card');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodMeta[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [pseBanks, setPseBanks] = useState<Array<{ id: string; description: string }>>([]);
  const [selectedPseBank, setSelectedPseBank] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstructionsState | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Datos del comprador (vacíos para producción)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    documento: "",
    tipoDocumento: "CC"
  });

  // Card data (vacío para producción)
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    identificationType: "CC",
    identificationNumber: ""
  });

  // Obtener Public Key de MP
  useEffect(() => {
    async function loadMPConfig() {
      try {
        const response = await fetch(`${API_URL}/api/payments/config`);
        const data = await response.json();
        
        if (data.success && data.publicKey) {
          setPublicKey(data.publicKey);
        }
      } catch (err) {
        console.error('Error al cargar configuración de MP:', err);
      }
    }
    
    loadMPConfig();
  }, []);

  // Obtener métodos de pago disponibles
  useEffect(() => {
    async function loadPaymentMethods() {
      setLoadingPaymentMethods(true);
      try {
        const response = await fetch(`${API_URL}/api/payments/methods`);
        const data = await response.json();

        if (data.success && Array.isArray(data.methods)) {
          setAvailablePaymentMethods(data.methods as PaymentMethodMeta[]);

          const pseMethod = (data.methods as PaymentMethodMeta[]).find(
            (method) => method.id === 'pse'
          );

          if (pseMethod?.financialInstitutions?.length) {
            setPseBanks(pseMethod.financialInstitutions);
            setSelectedPseBank(pseMethod.financialInstitutions[0].id);
          }
        }
      } catch (err) {
        console.error('Error al cargar métodos de pago:', err);
      } finally {
        setLoadingPaymentMethods(false);
      }
    }

    loadPaymentMethods();
  }, []);

  useEffect(() => {
    setPaymentInstructions(null);
    setError('');
    setSuccess('');
  }, [paymentMethod]);

  // Cargar perfil del usuario
  useEffect(() => {
    async function loadUserProfile() {
      if (!user?.uid) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/users/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const profile = await response.json();
        
        setFormData(prev => ({
          ...prev,
          nombre: profile.displayName || prev.nombre,
          email: profile.email || prev.email,
          telefono: profile.phoneNumber || profile.telefono || prev.telefono,
        }));
      } catch (err) {
        console.error('Error al cargar perfil:', err);
      }
    }

    loadUserProfile();
  }, [user]);

  // Cargar datos del evento y procesar tickets seleccionados
  useEffect(() => {
    async function loadEvento() {
      try {
        const response = await fetch(`${API_URL}/api/eventos/${eventoId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          const eventoData = data.data;
          setEvento(eventoData);

          // Procesar query params
          const tickets: TicketSeleccionado[] = [];
          let totalAmount = 0;

          searchParams.forEach((value, key) => {
            const cantidad = parseInt(value);
            
            if (cantidad > 0) {
              let tier = eventoData.tiers?.find((t: TierType) => t.id === key);
              
              if (!tier) {
                const keyLower = key.toLowerCase();
                tier = eventoData.tiers?.find((t: TierType) => 
                  t.nombre?.toLowerCase().includes(keyLower) || 
                  t.id?.toLowerCase().includes(keyLower)
                );
              }

              if (tier && tier.precio) {
                const subtotal = tier.precio * cantidad;
                tickets.push({
                  tierId: tier.id,
                  nombre: tier.nombre,
                  cantidad: cantidad,
                  precioUnitario: tier.precio,
                  subtotal: subtotal
                });
                totalAmount += subtotal;
              } else {
                let precioDefault = eventoData.precioBase || 50000;
                
                const subtotal = precioDefault * cantidad;
                tickets.push({
                  tierId: key,
                  nombre: key.charAt(0).toUpperCase() + key.slice(1),
                  cantidad: cantidad,
                  precioUnitario: precioDefault,
                  subtotal: subtotal
                });
                totalAmount += subtotal;
              }
            }
          });

          if (tickets.length === 0) {
            tickets.push({
              tierId: 'general',
              nombre: 'General',
              cantidad: 1,
              precioUnitario: eventoData.precioBase || 0,
              subtotal: eventoData.precioBase || 0
            });
            totalAmount = eventoData.precioBase || 0;
          }

          setTicketsSeleccionados(tickets);
          setTotal(totalAmount);
        } else {
          setError("Evento no encontrado");
        }
      } catch (err) {
        console.error('Error al cargar evento:', err);
        setError("Error al cargar el evento");
      } finally {
        setLoading(false);
      }
    }
    
    if (eventoId) {
      loadEvento();
    }
    
    if (eventoId) {
      loadEvento();
    }
  }, [eventoId, searchParams]);

  // Detectar intento de abandono de la página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (ticketsSeleccionados.length > 0) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres abandonar? Tus entradas se perderán.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [ticketsSeleccionados]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.email || !formData.telefono) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (paymentMethod === 'card') {
      if (
        !cardData.cardNumber ||
        !cardData.cardholderName ||
        !cardData.securityCode ||
        !cardData.expirationMonth ||
        !cardData.expirationYear ||
        !cardData.identificationNumber
      ) {
        setError("Por favor completa todos los datos de la tarjeta");
        return;
      }
    }

    if (paymentMethod === 'pse' && !selectedPseBank) {
      setError("Por favor selecciona el banco para PSE");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");
      setPaymentInstructions(null);

      let cardTokenId: string | null = null;

      if (paymentMethod === 'card') {
        if (!mpLoaded || !publicKey) {
          throw new Error("Mercado Pago SDK no está cargado");
        }

        // @ts-ignore
        const mp = new window.MercadoPago(publicKey);

        const tokenData = {
          cardNumber: cardData.cardNumber.replace(/\s/g, ''),
          cardholderName: cardData.cardholderName,
          cardExpirationMonth: cardData.expirationMonth,
          cardExpirationYear: cardData.expirationYear,
          securityCode: cardData.securityCode,
          identificationType: cardData.identificationType,
          identificationNumber: cardData.identificationNumber
        };

        const cardToken = await mp.createCardToken(tokenData);

        if (!cardToken || !cardToken.id) {
          throw new Error("Error al generar el token de la tarjeta");
        }

        cardTokenId = cardToken.id;
      }

      const cantidadTotal = ticketsSeleccionados.reduce((sum, t) => sum + t.cantidad, 0);
      const compraResponse = await fetch(`${API_URL}/api/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventoId: eventoId,
          cantidad: cantidadTotal,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          userId: user?.uid || null,
          tickets: ticketsSeleccionados
        })
      });

      const compraData = await compraResponse.json();

      if (!compraData.success || !compraData.data?.id) {
        throw new Error(compraData.message || "Error al crear la compra");
      }

      const newCompraId = compraData.data.id;
      setCompraId(newCompraId);

      const paymentData: Record<string, any> = {
        compraId: newCompraId,
        eventoId: eventoId,
        transaction_amount: total,
        description: `Tickets para ${evento?.nombre}`,
        payer: {
          email: formData.email,
          first_name: formData.nombre.split(' ')[0],
          last_name: formData.nombre.split(' ').slice(1).join(' ') || formData.nombre,
          identification: {
            type: formData.tipoDocumento,
            number: formData.documento
          }
        },
        paymentMethod: paymentMethod
      };

      if (paymentMethod === 'card') {
        paymentData.token = cardTokenId;
        paymentData.installments = 1;
      }

      if (paymentMethod === 'pse') {
        paymentData.financialInstitution = selectedPseBank;
      }

      const paymentResponse = await fetch(`${API_URL}/api/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || "Error al procesar el pago");
      }

      if (paymentMethod === 'card') {
        if (paymentResult.status === 'approved') {
          setSuccess("¡Pago procesado exitosamente!");
          setTimeout(() => {
            router.push(`/pago/exito?compraId=${newCompraId}`);
          }, 2000);
        } else if (paymentResult.status === 'rejected') {
          throw new Error(`Pago rechazado: ${paymentResult.message || paymentResult.statusDetail}`);
        } else {
          setError("El pago está en proceso de verificación. Te notificaremos cuando se complete.");
        }
      }

      if (paymentMethod === 'pse') {
        if (paymentResult.redirectUrl) {
          setSuccess("Te redirigiremos al banco para completar el pago.");
          window.location.href = paymentResult.redirectUrl;
          return;
        }

        setPaymentInstructions({
          type: 'pse',
          redirectUrl: paymentResult.redirectUrl || paymentResult.instructions?.externalResourceUrl || null,
          referenceId: paymentResult.instructions?.referenceId || null
        });

        setSuccess("Hemos generado la orden PSE. Revisa los detalles para continuar.");
      }

      if (paymentMethod === 'efecty') {
        setPaymentInstructions({
          type: 'efecty',
          ticketUrl: paymentResult.ticketUrl || paymentResult.instructions?.ticketUrl || null,
          barcode: paymentResult.instructions?.barcode || null,
          qrCode: paymentResult.instructions?.qrCode || null,
          qrCodeBase64: paymentResult.instructions?.qrCodeBase64 || null,
          referenceId: paymentResult.instructions?.reference || null,
          expirationDate: paymentResult.instructions?.expirationDate || null
        });

        setSuccess("Generamos tu comprobante de pago en Efecty. Te redirigimos al comprobante...");
        
        // Redirigir automáticamente al comprobante
        setTimeout(() => {
          router.push(`/pago/efecty-comprobante/${newCompraId}`);
        }, 2000);
      }

    } catch (err: any) {
      setError(err.message || "Error al procesar el pago");
      console.error('Error en checkout:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !evento) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Cargando evento...</div>
      </div>
    );
  }

  if (error && !evento) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const imagen = evento?.imagenUrl || evento?.imagen;
  const paymentOptions: Array<{
    id: 'card' | 'pse' | 'efecty';
    title: string;
    description: string;
    icon: string;
    disabled: boolean;
  }> = [
    {
      id: 'card',
      title: 'Tarjeta de crédito o débito',
      description: 'Visa, Mastercard y tarjetas locales soportadas por Mercado Pago.',
      icon: 'credit_card',
      disabled: false
    },
    {
      id: 'pse',
      title: 'Transferencia bancaria (PSE)',
      description: 'Te redirigiremos al banco para completar el pago desde tu cuenta.',
      icon: 'account_balance',
      disabled: !loadingPaymentMethods && pseBanks.length === 0
    },
    {
      id: 'efecty',
      title: 'Pago en efectivo (Efecty)',
      description: 'Genera un comprobante para pagar en cualquier punto Efecty.',
      icon: 'store',
      disabled: false
    }
  ];

  const submitLabel =
    paymentMethod === 'card'
      ? processing
        ? 'Procesando...'
        : `Pagar ${total.toLocaleString('es-CO')} COP`
      : paymentMethod === 'pse'
      ? processing
        ? 'Generando orden PSE...'
        : 'Continuar con PSE'
      : processing
      ? 'Generando comprobante...'
      : 'Generar comprobante Efecty';

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="lazyOnload"
        onLoad={() => {
          setMpLoaded(true);
        }}
        onError={(e) => {
          setError('No se pudo cargar el sistema de pagos. Por favor recarga la página.');
        }}
      />
      
      <div className="min-h-screen bg-slate-950 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb/Navegación */}
          <div className="mb-6">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Volver al inicio
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Columna izquierda - Información del evento y tickets */}
            <div className="space-y-6">
              {/* Información del evento */}
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-4">Resumen del Evento</h2>
                
                {imagen && (
                  <img
                    src={imagen}
                    alt={evento?.nombre}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                
                <h3 className="text-xl font-semibold text-white mb-2">{evento?.nombre}</h3>
                <p className="text-slate-400 text-sm mb-4">{evento?.descripcion}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-slate-300">
                    <span className="material-symbols-outlined text-primary mr-2">calendar_today</span>
                    <span>{evento?.fecha ? new Date(evento.fecha._seconds ? evento.fecha._seconds * 1000 : evento.fecha).toLocaleDateString('es-CO') : 'Fecha por confirmar'}</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="material-symbols-outlined text-primary mr-2">location_on</span>
                    <span>{evento?.lugar || evento?.ubicacion}, {evento?.ciudad}</span>
                  </div>
                </div>
              </div>

              {/* Entradas seleccionadas */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Entradas Seleccionadas</h2>
                
                <div className="space-y-3">
                  {ticketsSeleccionados.map((ticket, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded">
                            {ticket.nombre}
                          </span>
                          <span className="text-slate-400 text-sm">x{ticket.cantidad}</span>
                        </div>
                        <p className="text-slate-300 text-sm mt-1">
                          ${ticket.precioUnitario.toLocaleString('es-CO')} c/u
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">
                          ${ticket.subtotal.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">Total</span>
                    <span className="text-3xl font-bold text-primary">
                      ${total.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Formulario de pago */}
            <div className="space-y-6">
              <form onSubmit={handlePayment} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-6">Información de Pago</h2>

                {/* Información del comprador */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Datos del Comprador</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                          Tipo de Documento *
                        </label>
                        <select
                          value={formData.tipoDocumento}
                          onChange={(e) => {
                            setFormData({ ...formData, tipoDocumento: e.target.value });
                            setCardData((prev) => ({ ...prev, identificationType: e.target.value }));
                          }}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="CC">Cédula de ciudadanía</option>
                          <option value="CE">Cédula de extranjería</option>
                          <option value="NIT">NIT</option>
                          <option value="PP">Pasaporte</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                          Número de Documento *
                        </label>
                        <input
                          type="text"
                          value={formData.documento}
                          onChange={(e) => {
                            setFormData({ ...formData, documento: e.target.value });
                            setCardData((prev) => ({ ...prev, identificationNumber: e.target.value }));
                          }}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Selecciona un método de pago</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {paymentOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        disabled={option.disabled}
                        onClick={() => setPaymentMethod(option.id)}
                        className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-all ${
                          paymentMethod === option.id
                            ? 'border-primary bg-primary/10 text-white'
                            : 'border-slate-700 bg-slate-800 text-white/80 hover:border-primary/40'
                        } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span className="material-symbols-outlined mt-1 text-xl text-primary">
                          {option.icon}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              {option.title}
                            </p>
                            {paymentMethod === option.id && (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                Seleccionado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'pse' && (
                    <div className="mt-4 space-y-3">
                      <label className="block text-slate-300 text-sm font-medium">
                        Selecciona tu banco
                      </label>
                      {loadingPaymentMethods ? (
                        <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white/60">
                          Cargando bancos disponibles...
                        </div>
                      ) : pseBanks.length > 0 ? (
                        <select
                          value={selectedPseBank}
                          onChange={(e) => setSelectedPseBank(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {pseBanks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.description}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                          No pudimos cargar la lista de bancos. Intenta nuevamente en unos minutos.
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'efecty' && (
                    <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white/70">
                      Generaremos un comprobante con un código de referencia y código de barras.
                      Tendrás un tiempo limitado para acercarte a cualquier punto Efecty y realizar el pago.
                    </div>
                  )}
                </div>

                {/* Información de la tarjeta */}
                {paymentMethod === 'card' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Datos de la Tarjeta</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                          Número de Tarjeta *
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardData.cardNumber}
                          onChange={(e) => setCardData({...cardData, cardNumber: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          maxLength={19}
                          required={paymentMethod === 'card'}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                          Nombre en la Tarjeta *
                        </label>
                        <input
                          type="text"
                          placeholder="JUAN PEREZ"
                          value={cardData.cardholderName}
                          onChange={(e) => setCardData({...cardData, cardholderName: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          required={paymentMethod === 'card'}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-300 text-sm font-medium mb-2">
                            Mes *
                          </label>
                          <input
                            type="text"
                            placeholder="MM"
                            value={cardData.expirationMonth}
                            onChange={(e) => setCardData({...cardData, expirationMonth: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            maxLength={2}
                            required={paymentMethod === 'card'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-slate-300 text-sm font-medium mb-2">
                            Año *
                          </label>
                          <input
                            type="text"
                            placeholder="AA"
                            value={cardData.expirationYear}
                            onChange={(e) => setCardData({...cardData, expirationYear: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            maxLength={2}
                            required={paymentMethod === 'card'}
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 text-sm font-medium mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            value={cardData.securityCode}
                            onChange={(e) => setCardData({...cardData, securityCode: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            maxLength={4}
                            required={paymentMethod === 'card'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                          Número de Documento *
                        </label>
                        <input
                          type="text"
                          placeholder="123456789"
                          value={cardData.identificationNumber}
                          onChange={(e) => setCardData({...cardData, identificationNumber: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          required={paymentMethod === 'card'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                    processing ? "bg-primary/50" : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  }`}
                  disabled={processing || (paymentMethod === 'card' && (!mpLoaded || !publicKey))}
                >
                  {paymentMethod === 'card' && (!mpLoaded || !publicKey)
                    ? "Cargando sistema de pagos..."
                    : submitLabel}
                </button>

                {/* Alerts - Movidos al final, debajo del botón */}
                {error && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                <p className="text-slate-400 text-xs text-center mt-4">
                  Pago seguro procesado por Mercado Pago
                </p>

                {paymentInstructions && (
                  <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3">
                    {paymentInstructions.type === 'pse' && (
                      <>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">info</span>
                          Completa tu pago en PSE
                        </h4>
                        <p className="text-sm text-white/70">
                          Si no fuiste redirigido automáticamente, puedes abrir nuevamente la página del banco desde el siguiente botón:
                        </p>
                        {paymentInstructions.redirectUrl && (
                          <a
                            href={paymentInstructions.redirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary/80 px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
                          >
                            Ir al banco
                          </a>
                        )}
                        {paymentInstructions.referenceId && (
                          <p className="text-xs text-white/50">
                            Referencia de seguimiento: {paymentInstructions.referenceId}
                          </p>
                        )}
                      </>
                    )}

                    {paymentInstructions.type === 'efecty' && (
                      <>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">store</span>
                          Instrucciones para pagar en Efecty
                        </h4>
                        <ul className="space-y-2 text-sm text-white/70">
                          {paymentInstructions.referenceId && (
                            <li>
                              <span className="font-semibold text-white">Referencia:</span> {paymentInstructions.referenceId}
                            </li>
                          )}
                          {paymentInstructions.expirationDate && (
                            <li>
                              <span className="font-semibold text-white">Vence:</span>{" "}
                              {new Date(paymentInstructions.expirationDate).toLocaleString('es-CO')}
                            </li>
                          )}
                          <li>
                            Presenta el código en cualquier punto Efecty y realiza el pago por el monto indicado.
                          </li>
                        </ul>
                        {paymentInstructions.ticketUrl && (
                          <a
                            href={paymentInstructions.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary/80 px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
                          >
                            Descargar comprobante
                          </a>
                        )}
                        {paymentInstructions.barcode && (
                          <div className="rounded bg-black/40 px-3 py-2 text-center text-sm tracking-[0.3em] text-white font-mono">
                            {paymentInstructions.barcode}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmación de abandono */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-amber-400 text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">¿Abandonar la compra?</h3>
              <p className="text-slate-300 mb-6">
                Estás a punto de abandonar el proceso de compra. Tus entradas seleccionadas se perderán y tendrás que comenzar de nuevo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Continuar comprando
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Abandonar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Cargando checkout...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
