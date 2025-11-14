"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { apiService } from "@/lib/apiService";
import { useAuth } from "@/contexts/AuthContext";

interface Ticket {
  id: string;
  eventName: string;
  eventImage: string;
  date: string;
  location: string;
  status: "upcoming" | "past";
  event?: {
    id: string;
    name: string;
    image: string;
    date: string;
    location: string;
    venue: string;
  };
  tierName?: string;
  ticketNumber?: string;
  price?: number;
  currency?: string;
}

function MisBoletosContent() {
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadTickets = async () => {
      // Esperar a que auth termine de cargar
      if (authLoading) {
        return;
      }

      // Si no hay usuario, no hacer nada (ProtectedRoute manejará el redirect)
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('🎫 Loading tickets for user:', user.email);
        
        const response = await apiService.getMyTickets();
        console.log('✅ Tickets loaded:', response);
        
        // Transform tickets to match the interface
        // El backend devuelve response.data, no response.tickets
        const ticketsData = response.data || [];
        
        const transformedTickets = ticketsData.map((ticket: any) => {
          console.log('🔍 Processing ticket:', ticket);
          
          // Convertir Firestore Timestamp a Date
          let eventDate: Date;
          
          if (ticket.event?.fecha) {
            // Si tiene fecha en el evento
            if (typeof ticket.event.fecha === 'string') {
              eventDate = new Date(ticket.event.fecha);
            } else if (ticket.event.fecha._seconds) {
              eventDate = new Date(ticket.event.fecha._seconds * 1000);
            } else {
              eventDate = new Date(); // Fallback a hoy
            }
          } else if (ticket.createdAt) {
            // Si no, usar fecha de creación del ticket
            if (typeof ticket.createdAt === 'string') {
              eventDate = new Date(ticket.createdAt);
            } else if (ticket.createdAt._seconds) {
              eventDate = new Date(ticket.createdAt._seconds * 1000);
            } else {
              eventDate = new Date();
            }
          } else {
            // Fallback: asumir que es próximo
            eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + 30); // 30 días en el futuro
          }
          
          const status = eventDate > new Date() ? 'upcoming' : 'past';
          console.log('📅 Event date:', eventDate, '| Status:', status);
          
          const transformed = {
            id: ticket.ticketNumber || ticket.id,
            eventName: ticket.event?.nombre || ticket.event?.name || 'Evento',
            eventImage: ticket.event?.imagen || ticket.event?.images?.banner || ticket.event?.images?.thumbnail || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop',
            date: eventDate.toISOString(),
            location: ticket.event?.ciudad || ticket.event?.ubicacion || ticket.event?.venue || 'Ubicación',
            status: status,
            event: ticket.event,
            ticketNumber: ticket.ticketNumber,
            price: ticket.price,
            currency: ticket.currency || 'COP',
            tierName: ticket.metadata?.tierName || ticket.tierName || ticket.tier?.name || ticket.tier?.nombre || ticket.tier?.metadata?.name
          };
          
          console.log('✅ Transformed ticket:', transformed);
          return transformed;
        });

        console.log('✨ All transformed tickets:', transformedTickets);
        setTickets(transformedTickets);
      } catch (error: any) {
        console.error('❌ Error loading tickets:', error);
        setError(error.response?.data?.message || 'Error al cargar los tickets');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [user, authLoading]);

  const filteredTickets = tickets.filter((ticket) => ticket.status === filter);

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-white">Cargando tus boletos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-800 dark:bg-[#0B1120] dark:text-gray-200">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-100/60 p-4 text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
              <p className="text-sm font-medium">
                <span className="font-semibold">Error:</span> {error}
              </p>
            </div>
          )}

          <header className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Mis Boletos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Aquí encontrarás todas tus entradas. Accede rápidamente a los detalles del evento, tu código QR y un resumen del tipo de ticket que compraste.
            </p>
            <div className="mt-4 flex items-center space-x-2 rounded-lg bg-gray-200 p-1 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:max-w-xs">
              <button
                onClick={() => setFilter("upcoming")}
                className={`flex-1 rounded-md px-4 py-2 transition-colors ${
                  filter === "upcoming"
                    ? "bg-primary text-white shadow"
                    : "hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Próximos
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`flex-1 rounded-md px-4 py-2 transition-colors ${
                  filter === "past"
                    ? "bg-primary text-white shadow"
                    : "hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Pasados
              </button>
            </div>
          </header>

          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900/40">
              <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-600 mb-3">
                confirmation_number
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No tienes boletos {filter === "upcoming" ? "próximos" : "pasados"}.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => {
                const isVip =
                  ticket.tierName?.toLowerCase().includes("vip") ||
                  ticket.tierName?.toLowerCase().includes("premium");
                return (
                  <div
                    key={ticket.id}
                    className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-800/60"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={ticket.eventImage}
                        alt={ticket.eventName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                            {ticket.eventName}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                            Ticket #{ticket.ticketNumber}
                          </p>
                        </div>
                        {ticket.tierName && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isVip
                                ? "bg-yellow-400 text-yellow-900"
                                : "bg-primary/15 text-primary"
                            }`}
                          >
                            {ticket.tierName}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined mr-2 text-lg text-gray-400 dark:text-gray-500">
                            calendar_today
                          </span>
                          <span>
                            {new Date(ticket.date).toLocaleString("es-CO", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="material-symbols-outlined mr-2 text-lg text-gray-400 dark:text-gray-500">
                            location_on
                          </span>
                          <span>{ticket.location}</span>
                        </div>
                        {ticket.price && (
                          <div className="flex items-center">
                            <span className="material-symbols-outlined mr-2 text-lg text-gray-400 dark:text-gray-500">
                              payments
                            </span>
                            <span>
                              {new Intl.NumberFormat("es-CO", {
                                style: "currency",
                                currency: ticket.currency || "COP",
                                maximumFractionDigits: 0,
                              }).format(ticket.price)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-4">
                        <Link href={`/ticket/${ticket.id}`}>
                          <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-700">
                            Ver Ticket
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 md:hidden">
        <Link
          href="/"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-gray-500 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary"
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <p className="text-xs font-medium">Inicio</p>
        </Link>

        <Link
          href="/mis-boletos"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-primary"
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
          >
            confirmation_number
          </span>
          <p className="text-xs font-semibold">Boletos</p>
        </Link>

        <Link
          href="/perfil"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-gray-500 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary"
        >
          <span className="material-symbols-outlined text-xl">person</span>
          <p className="text-xs font-medium">Perfil</p>
        </Link>
      </nav>
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
