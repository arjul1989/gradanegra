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
}

interface Achievement {
  id: string;
  name: string;
  image: string;
}

function MisBoletosContent() {
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    eventsAttended: 0,
    badgesEarned: 0,
  });
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
          // Convertir Firestore Timestamp a Date
          const eventDate = ticket.event?.date?._seconds 
            ? new Date(ticket.event.date._seconds * 1000)
            : new Date(ticket.createdAt._seconds * 1000);
          
          return {
            id: ticket.ticketNumber, // Usar ticketNumber como id
            eventName: ticket.event?.name || 'Evento',
            eventImage: ticket.event?.images?.banner || ticket.event?.images?.thumbnail || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop',
            date: eventDate.toISOString(),
            location: ticket.event?.venue || 'Ubicación',
            status: eventDate > new Date() ? 'upcoming' : 'past',
            event: ticket.event,
            ticketNumber: ticket.ticketNumber,
            price: ticket.price,
            currency: ticket.currency,
          };
        });

        console.log('✨ Transformed tickets:', transformedTickets);
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

  // Mock achievements (puedes reemplazar con datos reales después)
  const achievements: Achievement[] = [
    {
      id: "1",
      name: "Pionero Musical",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
    },
    {
      id: "2",
      name: "Explorador Urbano",
      image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=200&h=200&fit=crop",
    },
    {
      id: "3",
      name: "Fanático del Deporte",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop",
    },
    {
      id: "4",
      name: "Amante del Teatro",
      image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=200&h=200&fit=crop",
    },
    {
      id: "5",
      name: "Alma de la Fiesta",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&h=200&fit=crop",
    },
    {
      id: "6",
      name: "Festivalero",
      image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop",
    },
  ];

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
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
      <Navbar />

      {/* Main Content */}
      <main className="flex flex-1 justify-center px-4 py-6 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="flex w-full max-w-7xl flex-col gap-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-900/50 p-3">
              <p className="text-red-400 text-sm">
                <span className="font-semibold">Error:</span> {error}
              </p>
            </div>
          )}

          {/* Stats Section */}
          <section className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-xl bg-card-dark p-4 border border-white/5">
              <p className="text-white/50 text-sm font-medium">Eventos Asistidos</p>
              <p className="text-white text-3xl font-bold">{stats.eventsAttended}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-card-dark p-4 border border-white/5">
              <p className="text-white/50 text-sm font-medium">Insignias Ganadas</p>
              <p className="text-white text-3xl font-bold">{stats.badgesEarned}</p>
            </div>
          </section>

          {/* Achievements Section */}
          <section>
            <h2 className="text-white text-lg font-bold mb-3">
              Logros Recientes
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex flex-col items-center gap-1.5">
                  <div className="relative size-20 rounded-full overflow-hidden border-2 border-white/10">
                    <Image
                      src={achievement.image}
                      alt={achievement.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30"></div>
                  </div>
                  <p className="text-white/70 text-xs font-medium text-center line-clamp-2">{achievement.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tickets Section */}
          <section className="flex flex-col gap-4">
            <h2 className="text-white text-lg font-bold">Mis Boletos</h2>
            
            {/* Filter Tabs */}
            <div className="flex justify-start">
              <div className="flex h-9 items-center rounded-lg bg-card-dark p-1 border border-white/5">
                <button
                  onClick={() => setFilter("upcoming")}
                  className={`flex h-full items-center justify-center rounded-md px-4 text-sm font-semibold transition-all ${
                    filter === "upcoming"
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Próximos
                </button>
                <button
                  onClick={() => setFilter("past")}
                  className={`flex h-full items-center justify-center rounded-md px-4 text-sm font-semibold transition-all ${
                    filter === "past" 
                      ? "bg-primary text-white shadow-lg shadow-primary/30" 
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Pasados
                </button>
              </div>
            </div>

            {/* Tickets Grid */}
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-6xl text-white/20 mb-3">confirmation_number</span>
                <p className="text-white/60 text-sm">No tienes boletos {filter === 'upcoming' ? 'próximos' : 'pasados'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col overflow-hidden rounded-lg bg-card-dark border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    {/* Ticket Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image 
                        src={ticket.eventImage} 
                        alt={ticket.eventName} 
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>

                    {/* Ticket Info */}
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">{ticket.eventName}</h3>
                        <div className="flex items-center gap-1.5 text-white/50">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          <p className="text-xs font-medium">{new Date(ticket.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/50">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          <p className="text-xs font-medium line-clamp-1">{ticket.location}</p>
                        </div>
                      </div>
                      <Link href={`/ticket/${ticket.id}`} className="w-full">
                        <button className="flex h-9 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90 shadow-lg shadow-primary/20">
                          Ver Ticket
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-white/5 bg-card-dark/95 backdrop-blur-md shadow-2xl">
        <Link
          href="/"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/50 hover:text-primary transition-colors"
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
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/50 hover:text-primary transition-colors"
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
