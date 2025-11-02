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
      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <div className="flex w-full max-w-7xl flex-col gap-8">
          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-900 p-4">
              <p className="text-red-400 text-sm">
                <span className="font-bold">Error:</span> {error}
              </p>
              <p className="text-red-400/70 text-xs mt-2">
                Intenta cerrar sesión y volver a iniciar sesión.
              </p>
            </div>
          )}

          {/* Stats Section */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-1 flex-col gap-2 rounded-xl bg-white/5 p-6 border border-white/10">
              <p className="text-white/60 text-base font-medium leading-normal">Eventos Asistidos</p>
              <p className="text-white tracking-tight text-4xl font-bold leading-tight">{stats.eventsAttended}</p>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl bg-white/5 p-6 border border-white/10">
              <p className="text-white/60 text-base font-medium leading-normal">Insignias Ganadas</p>
              <p className="text-white tracking-tight text-4xl font-bold leading-tight">{stats.badgesEarned}</p>
            </div>
          </section>

          {/* Achievements Section */}
          <section>
            <h2 className="text-white text-[22px] font-bold leading-tight tracking-tight px-4 pb-4 font-display">
              Logros Recientes
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex flex-col items-center gap-2">
                  <div className="relative size-28 rounded-full overflow-hidden">
                    <Image
                      src={achievement.image}
                      alt={achievement.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                  </div>
                  <p className="text-white text-sm font-medium leading-tight text-center">{achievement.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tickets Section */}
          <section className="flex flex-col gap-6">
            {/* Filter Tabs */}
            <div className="flex px-4 py-3">
              <div className="mx-auto flex h-10 w-full max-w-xs items-center justify-center rounded-lg bg-white/5 p-1">
                <button
                  onClick={() => setFilter("upcoming")}
                  className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium leading-normal transition-colors ${
                    filter === "upcoming"
                      ? "bg-background-dark text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Próximos
                </button>
                <button
                  onClick={() => setFilter("past")}
                  className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium leading-normal transition-colors ${
                    filter === "past" ? "bg-background-dark text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  Pasados
                </button>
              </div>
            </div>

            {/* Tickets Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col overflow-hidden rounded-xl bg-white/5 border border-white/10 transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  {/* Ticket Image */}
                  <div className="relative aspect-[16/9] w-full">
                    <Image 
                      src={ticket.eventImage} 
                      alt={ticket.eventName} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover" 
                    />
                  </div>

                  {/* Ticket Info */}
                  <div className="flex flex-col gap-4 p-5">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-white">{ticket.eventName}</h3>
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        <p className="text-sm font-medium">{ticket.date}</p>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        <p className="text-sm font-medium">{ticket.location}</p>
                      </div>
                    </div>
                    <Link href={`/ticket/${ticket.id}`}>
                      <button className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90">
                        Ver Ticket
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-20 items-center justify-around border-t border-white/10 bg-background-dark/80 backdrop-blur-md">
        <Link
          href="/"
          className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full py-1 text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined h-8 text-2xl">home</span>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Inicio</p>
        </Link>

        <Link
          href="/mis-boletos"
          className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full py-1 text-primary"
        >
          <span
            className="material-symbols-outlined h-8 text-2xl"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
          >
            confirmation_number
          </span>
          <p className="text-xs font-bold leading-normal tracking-[0.015em]">Mis Boletos</p>
        </Link>

        <Link
          href="/perfil"
          className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full py-1 text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined h-8 text-2xl">person</span>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Perfil</p>
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
