'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
}

interface Event {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  date: string;
  time: string;
  location: string;
  address: string;
  ageRestriction: string;
  lineup?: string;
  mapUrl?: string;
  ticketTypes: TicketType[];
}

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketQuantities, setTicketQuantities] = useState<{ [key: string]: number }>({});
  const [total, setTotal] = useState(0);
  const [eventId, setEventId] = useState<string>('');

  useEffect(() => {
    // Unwrap params Promise
    params.then((resolvedParams) => {
      setEventId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (!eventId) return;
    
    // TODO: Conectar con el backend - GET /api/events/:id
    // Por ahora datos mock
    const mockEvent: Event = {
      id: eventId,
      name: 'METALLICA M72 WORLD TOUR',
      description: 'Prepárate para una noche de puro poder y adrenalina con la legendaria banda Metallica. La gira M72 World Tour promete un espectáculo inolvidable con sus más grandes éxitos y nuevo material. Siente la energía de miles de fans vibrando al unísono en el icónico Foro Sol.',
      imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200',
      date: '2024-10-26',
      time: '21:00',
      location: 'Foro Sol',
      address: 'Viad. Río de la Piedad S/N, Granjas México, Iztacalco, 08400 Ciudad de México, CDMX',
      ageRestriction: '18+',
      lineup: 'Metallica / Greta Van Fleet / Mammoth WVH',
      mapUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800',
      ticketTypes: [
        {
          id: 'general',
          name: 'Acceso General',
          price: 850,
          description: 'De pie en la cancha. Vive la experiencia más cerca del escenario.',
          available: 500
        },
        {
          id: 'vip',
          name: 'VIP Experience',
          price: 2500,
          description: 'Acceso preferencial, zona exclusiva y kit de mercancía oficial.',
          available: 100
        }
      ]
    };

    setEvent(mockEvent);
    
    // Inicializar cantidades en 0
    const initialQuantities: { [key: string]: number } = {};
    mockEvent.ticketTypes.forEach(ticket => {
      initialQuantities[ticket.id] = 0;
    });
    setTicketQuantities(initialQuantities);
  }, [eventId]);

  const updateQuantity = (ticketId: string, delta: number) => {
    setTicketQuantities(prev => {
      const newQuantity = Math.max(0, (prev[ticketId] || 0) + delta);
      const newQuantities = { ...prev, [ticketId]: newQuantity };
      
      // Calcular total
      if (event) {
        const newTotal = event.ticketTypes.reduce((sum, ticket) => {
          return sum + (newQuantities[ticket.id] || 0) * ticket.price;
        }, 0);
        setTotal(newTotal);
      }
      
      return newQuantities;
    });
  };

  const handlePurchase = () => {
    // TODO: Implementar flujo de compra
    console.log('Comprar tickets:', ticketQuantities);
    // Redirigir a checkout o mostrar modal de pago
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const minPrice = Math.min(...event.ticketTypes.map(t => t.price));

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-stone-300 pb-32 md:pb-8">
      {/* Top App Bar (Sticky Header) */}
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/80 p-4 backdrop-blur-sm max-w-7xl mx-auto w-full">
        <button 
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-stone-800 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-white text-lg md:text-xl font-bold leading-tight flex-1 font-body ml-2 truncate">
          {event.name}
        </h2>
        <button className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white hover:bg-stone-800 transition-colors">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main className="flex flex-col md:flex-row max-w-7xl mx-auto w-full gap-6 md:gap-8">
        {/* Left Column - Event Info */}
        <div className="flex flex-col flex-1">
          {/* Hero Section */}
          <div 
            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end min-h-80 md:min-h-[500px] md:rounded-xl md:mx-4 md:mt-4"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          >
            <div className="w-full h-24 bg-gradient-to-t from-background-dark to-transparent"></div>
          </div>

          {/* Event Title Card */}
          <div className="px-4 -mt-16 md:mt-4">
            <h1 className="text-white font-display text-4xl md:text-6xl font-bold tracking-wider uppercase">
              {event.name}
            </h1>
            <p className="text-stone-400 text-base md:text-xl font-medium font-body mt-1">
              {formatDate(event.date)} at {event.location}
            </p>
          </div>

          {/* Icon-based Info Bar */}
          <div className="pt-6 px-4">
            <div className="gap-3 grid grid-cols-4">
              <div className="flex flex-col items-center gap-2 py-2.5 text-center">
                <div className="rounded-full bg-stone-800 p-3">
                  <span className="material-symbols-outlined text-primary-accent text-2xl">calendar_month</span>
                </div>
                <p className="text-white text-sm font-medium">
                  {new Date(event.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 py-2.5 text-center">
                <div className="rounded-full bg-stone-800 p-3">
                  <span className="material-symbols-outlined text-primary-accent text-2xl">schedule</span>
                </div>
                <p className="text-white text-sm font-medium">{event.time}</p>
              </div>
              <div className="flex flex-col items-center gap-2 py-2.5 text-center">
                <div className="rounded-full bg-stone-800 p-3">
                  <span className="material-symbols-outlined text-primary-accent text-2xl">confirmation_number</span>
                </div>
                <p className="text-white text-sm font-medium">Desde ${minPrice}</p>
              </div>
              <div className="flex flex-col items-center gap-2 py-2.5 text-center">
                <div className="rounded-full bg-stone-800 p-3">
                  <span className="material-symbols-outlined text-primary-accent text-2xl">person</span>
                </div>
                <p className="text-white text-sm font-medium">{event.ageRestriction}</p>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="px-4 mt-6 flex flex-col gap-4">
            <div>
              <h3 className="font-display text-2xl md:text-3xl text-white tracking-wide">DESCRIPCIÓN</h3>
              <p className="text-stone-400 mt-2 font-body text-sm md:text-base leading-relaxed">
                {event.description}
              </p>
            </div>
            
            {event.lineup && (
              <div>
                <h3 className="font-display text-2xl md:text-3xl text-white tracking-wide">LINEUP</h3>
                <p className="text-stone-400 mt-2 font-body text-sm md:text-base leading-relaxed">
                  {event.lineup}
                </p>
              </div>
            )}
          </div>

          {/* Gamification Widget */}
          <div className="px-4 mt-8">
            <div className="bg-stone-900/50 border border-gamification-accent/30 rounded-xl p-4 flex items-center gap-4">
              <span className="material-symbols-outlined text-gamification-accent text-4xl">local_fire_department</span>
              <div>
                <h4 className="font-display text-xl text-gamification-accent tracking-wider">TU ENERGÍA</h4>
                <p className="text-stone-300 text-sm">
                  Asiste y gana <strong>+250 Puntos de Energía</strong> para desbloquear insignias exclusivas.
                </p>
              </div>
            </div>
          </div>

          {/* Map View - Ocultar en desktop si no es necesario */}
          <div className="px-4 mt-8 mb-8 md:hidden">
            <h3 className="font-display text-3xl text-white tracking-wide mb-4">UBICACIÓN</h3>
            {event.mapUrl && (
              <div 
                className="w-full h-48 bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden"
                style={{ backgroundImage: `url(${event.mapUrl})` }}
              ></div>
            )}
            <p className="text-stone-300 mt-2 text-sm">{event.address}</p>
          </div>
        </div>

        {/* Right Column - Ticket Selection (Desktop Sidebar) */}
        <div className="px-4 md:px-0 md:w-[400px] md:sticky md:top-24 md:self-start md:pr-4">
          <h3 className="font-display text-3xl text-white tracking-wide mb-4">ENTRADAS</h3>
          <div className="flex flex-col gap-3">
            {event.ticketTypes.map((ticket) => (
              <div key={ticket.id} className="flex flex-col gap-3 rounded-lg bg-stone-900 p-4 border border-stone-800">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">{ticket.name}</h4>
                    <p className="text-primary-accent font-bold text-base">${ticket.price.toFixed(2)} MXN</p>
                    <p className="text-stone-400 text-xs mt-1">{ticket.description}</p>
                    <p className="text-stone-500 text-xs mt-1">Disponibles: {ticket.available}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-stone-800 rounded-full p-1">
                    <button 
                      onClick={() => updateQuantity(ticket.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-700 text-white text-xl font-bold hover:bg-stone-600 transition-colors"
                      disabled={ticketQuantities[ticket.id] === 0}
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-white">
                      {ticketQuantities[ticket.id] || 0}
                    </span>
                    <button 
                      onClick={() => updateQuantity(ticket.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-accent text-white text-xl font-bold hover:bg-primary-accent/80 transition-colors"
                      disabled={ticketQuantities[ticket.id] >= ticket.available}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map in Desktop */}
          <div className="hidden md:block mt-8">
            <h3 className="font-display text-2xl text-white tracking-wide mb-4">UBICACIÓN</h3>
            {event.mapUrl && (
              <div 
                className="w-full h-48 bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden"
                style={{ backgroundImage: `url(${event.mapUrl})` }}
              ></div>
            )}
            <p className="text-stone-300 mt-2 text-sm">{event.address}</p>
          </div>
        </div>
      </main>

      {/* Sticky Footer / FAB - Solo móvil */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background-dark/80 p-4 backdrop-blur-sm border-t border-stone-800 md:hidden">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-stone-400">Total</p>
            <p className="text-xl font-bold text-white">${total.toFixed(2)} MXN</p>
          </div>
          <button 
            onClick={handlePurchase}
            disabled={total === 0}
            className="flex h-12 items-center justify-center rounded-lg bg-primary-accent px-8 text-base font-bold text-white shadow-lg shadow-primary-accent/30 hover:bg-primary-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Comprar Entradas
          </button>
        </div>
      </footer>

      {/* Desktop Footer - Sticky con sidebar */}
      <div className="hidden md:block fixed bottom-0 right-0 w-[400px] z-50 bg-background-dark/95 p-4 backdrop-blur-sm border-t border-stone-800">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-stone-400">Total</p>
            <p className="text-2xl font-bold text-white">${total.toFixed(2)} MXN</p>
          </div>
          <button 
            onClick={handlePurchase}
            disabled={total === 0}
            className="flex h-12 items-center justify-center rounded-lg bg-primary-accent px-8 text-base font-bold text-white shadow-lg shadow-primary-accent/30 hover:bg-primary-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
