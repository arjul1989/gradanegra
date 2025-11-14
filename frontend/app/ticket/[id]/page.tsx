"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiService } from "@/lib/apiService";
import { useAuth } from "@/contexts/AuthContext";

interface TicketDetail {
  ticketNumber: string;
  eventId: string;
  tierId: string;
  price: number;
  status: string;
  qrCode: string;
  event?: {
    id: string;
    nombre?: string;
    name?: string;
    descripcion?: string;
    description?: string;
    fecha?: any;
    date?: any;
    lugar?: string;
    venue?: any;
    ciudad?: string;
    imagen?: string;
    images?: any;
  };
  metadata?: {
    tierName?: string;
    purchaseEmail?: string;
  };
  createdAt: any;
}

function TicketDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ticketId = params.id as string;

  useEffect(() => {
    if (user && ticketId) {
      loadTicket();
    }
  }, [user, ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getMyTicket(ticketId);
      console.log('✅ Ticket detail loaded:', response);

      setTicket(response.data);
    } catch (error: any) {
      console.error('❌ Error loading ticket:', error);
      setError(error.response?.data?.message || 'Error al cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Fecha no disponible';
    
    let eventDate: Date;
    if (typeof date === 'string') {
      eventDate = new Date(date);
    } else if (date._seconds) {
      eventDate = new Date(date._seconds * 1000);
    } else {
      eventDate = new Date(date);
    }

    return eventDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-white">Cargando ticket...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
            <h1 className="text-2xl font-bold text-white mb-2">Ticket no encontrado</h1>
            <p className="text-white/60 mb-6">{error || 'No se pudo cargar el ticket'}</p>
            <Link href="/mis-boletos">
              <button className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all">
                Volver a Mis Boletos
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const eventName = ticket.event?.nombre || ticket.event?.name || 'Evento';
  const eventImage = ticket.event?.imagen || ticket.event?.images?.banner || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=600&fit=crop';
  const eventDate = ticket.event?.fecha || ticket.event?.date;
  const eventLocation = ticket.event?.ciudad || ticket.event?.lugar || ticket.event?.venue || 'Ubicación';
  const tierName = ticket.metadata?.tierName || 'General';

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background-dark/80 backdrop-blur-lg">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="hidden sm:inline">Volver</span>
          </button>
          <h1 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-none">
            {eventName}
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Event Image */}
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl">
            <Image
              src={eventImage}
              alt={eventName}
              fill
              className="object-cover"
            />
          </div>

          {/* QR Code Card */}
          <div className="bg-card-dark border border-white/10 rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl mb-4">
              <QRCodeSVG
                value={ticket.qrCode || `TICKET:${ticket.ticketNumber}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-white/60 text-sm mb-1">Código del Ticket</p>
            <p className="text-white text-xl font-bold font-mono">{ticket.ticketNumber}</p>
            <p className="text-xs text-white/40 mt-2">Presenta este código QR en la entrada</p>
          </div>

          {/* Ticket Info */}
          <div className="bg-card-dark border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Información del Ticket</h2>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">confirmation_number</span>
              <div className="flex-1">
                <p className="text-white/60 text-sm">Tipo de Entrada</p>
                <p className="text-white font-medium">{tierName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">calendar_today</span>
              <div className="flex-1">
                <p className="text-white/60 text-sm">Fecha del Evento</p>
                <p className="text-white font-medium capitalize">{formatDate(eventDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
              <div className="flex-1">
                <p className="text-white/60 text-sm">Ubicación</p>
                <p className="text-white font-medium">{eventLocation}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">payments</span>
              <div className="flex-1">
                <p className="text-white/60 text-sm">Precio</p>
                <p className="text-white font-medium">
                  ${ticket.price?.toLocaleString('es-CO')} COP
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">
                {(ticket.status === 'valid' || ticket.status === 'confirmed') ? 'check_circle' : 'cancel'}
              </span>
              <div className="flex-1">
                <p className="text-white/60 text-sm">Estado</p>
                <p className={`font-medium ${(ticket.status === 'valid' || ticket.status === 'confirmed') ? 'text-green-400' : 'text-red-400'}`}>
                  {(ticket.status === 'valid' || ticket.status === 'confirmed') ? 'Válido' : ticket.status === 'used' ? 'Usado' : 'Cancelado'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 h-12 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined">print</span>
              <span>Imprimir</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Ticket - ${eventName}`,
                    text: `Mi ticket para ${eventName}`,
                    url: window.location.href
                  });
                }
              }}
              className="flex items-center justify-center gap-2 h-12 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined">share</span>
              <span>Compartir</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <ProtectedRoute>
      <TicketDetailContent />
    </ProtectedRoute>
  );
}

