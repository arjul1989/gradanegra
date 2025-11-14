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
    
    // Cargar evento real desde el backend
    async function loadEvent() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${API_URL}/api/eventos/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Evento no encontrado');
        }
        
        const data = await response.json();
        const eventoData = data.success ? data.data : data;
        
        // Mapear datos del backend al formato esperado por el componente
        const mappedEvent: Event = {
          id: eventoData.id,
          name: eventoData.nombre || eventoData.name,
          description: eventoData.descripcion || eventoData.description || 'Descripción no disponible',
          imageUrl: eventoData.imagenUrl || eventoData.imagen || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200',
          date: eventoData.fecha ? (eventoData.fecha._seconds ? new Date(eventoData.fecha._seconds * 1000).toISOString().split('T')[0] : eventoData.fecha.split('T')[0]) : '2024-01-01',
          time: eventoData.hora || '20:00',
          location: eventoData.lugar || eventoData.location || 'Ubicación por confirmar',
          address: eventoData.direccion || eventoData.address || `${eventoData.lugar || ''}, ${eventoData.ciudad || ''}`,
          ageRestriction: eventoData.restriccionEdad || '18+',
          lineup: eventoData.artistas || '',
          mapUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800',
          ticketTypes: []
        };
        
        // Mapear tiers a ticketTypes
        if (eventoData.tiers && Array.isArray(eventoData.tiers)) {
          mappedEvent.ticketTypes = eventoData.tiers.map((tier: any) => ({
            id: tier.id,
            name: tier.nombre,
            price: tier.precio,
            description: tier.descripcion || `Acceso ${tier.nombre}`,
            available: tier.capacidad - (tier.vendidos || 0)
          }));
        } else {
          // Fallback si no hay tiers
          mappedEvent.ticketTypes = [
            {
              id: 'general',
              name: 'General',
              price: eventoData.precio || eventoData.precioBase || 50000,
              description: 'Acceso general al evento',
              available: eventoData.capacidad || 100
            }
          ];
        }
        
        setEvent(mappedEvent);
        
        // Inicializar cantidades en 0
        const initialQuantities: { [key: string]: number } = {};
        mappedEvent.ticketTypes.forEach(ticket => {
          initialQuantities[ticket.id] = 0;
        });
        setTicketQuantities(initialQuantities);
        
      } catch (error) {
        console.error('Error al cargar evento:', error);
        // Fallback a datos básicos si falla
        setEvent(null);
      }
    }
    
    loadEvent();
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
    // Verificar que haya al menos un ticket seleccionado
    const totalTickets = Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
    
    if (totalTickets === 0) {
      alert('Por favor selecciona al menos un ticket');
      return;
    }
    
    console.log('Comprar tickets:', ticketQuantities);
    
    // Construir query params con las cantidades seleccionadas
    const queryParams = new URLSearchParams();
    Object.entries(ticketQuantities).forEach(([ticketId, quantity]) => {
      if (quantity > 0) {
        queryParams.append(ticketId, quantity.toString());
      }
    });
    
    // Redirigir a checkout con los parámetros
    router.push(`/checkout/${eventId}?${queryParams.toString()}`);
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
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-stone-300 pb-20 md:pb-8">
      {/* Top App Bar (Sticky Header) */}
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/95 backdrop-blur-md border-b border-white/5 px-4 py-3 max-w-7xl mx-auto w-full shadow-lg">
        <button 
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h2 className="text-white text-base font-semibold flex-1 ml-3 truncate">
          {event.name}
        </h2>
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-xl">share</span>
        </button>
      </header>

      <main className="flex flex-col md:flex-row max-w-7xl mx-auto w-full gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-6">
        {/* Left Column - Event Info */}
        <div className="flex flex-col flex-1 gap-4">
          {/* Hero Section */}
          <div 
            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end rounded-xl overflow-hidden relative"
            style={{ 
              backgroundImage: `url(${event.imageUrl})`,
              minHeight: '320px'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="relative p-4 md:p-6">
              <h1 className="text-white font-bold text-3xl md:text-4xl mb-2">
                {event.name}
              </h1>
              <p className="text-white/80 text-sm md:text-base font-medium">
                {formatDate(event.date)} • {event.location}
              </p>
            </div>
          </div>

          {/* Icon-based Info Bar */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center gap-1.5 py-3 text-center bg-card-dark rounded-lg border border-white/5">
              <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
              <p className="text-white text-xs font-semibold">
                {new Date(event.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1.5 py-3 text-center bg-card-dark rounded-lg border border-white/5">
              <span className="material-symbols-outlined text-primary text-xl">schedule</span>
              <p className="text-white text-xs font-semibold">{event.time}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 py-3 text-center bg-card-dark rounded-lg border border-white/5">
              <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
              <p className="text-white text-xs font-semibold">${minPrice}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 py-3 text-center bg-card-dark rounded-lg border border-white/5">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
              <p className="text-white text-xs font-semibold">{event.ageRestriction}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card-dark rounded-lg border border-white/5 p-4">
            <h3 className="font-bold text-lg text-white mb-2">Descripción</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {event.description}
            </p>
          </div>
          
          {/* Lineup */}
          {event.lineup && (
            <div className="bg-card-dark rounded-lg border border-white/5 p-4">
              <h3 className="font-bold text-lg text-white mb-2">Lineup</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {event.lineup}
              </p>
            </div>
          )}

          {/* Gamification Widget */}
          <div className="bg-gradient-to-r from-gamification-accent/10 to-transparent border border-gamification-accent/20 rounded-lg p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-gamification-accent text-3xl">local_fire_department</span>
            <div>
              <h4 className="font-bold text-base text-gamification-accent">TU ENERGÍA</h4>
              <p className="text-white/70 text-xs">
                Asiste y gana <strong>+250 Puntos</strong> para insignias exclusivas.
              </p>
            </div>
          </div>

          {/* Map - Mobile */}
          <div className="md:hidden bg-card-dark rounded-lg border border-white/5 p-4">
            <h3 className="font-bold text-lg text-white mb-3">Ubicación</h3>
            {event.mapUrl && (
              <div 
                className="w-full h-40 bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden mb-2"
                style={{ backgroundImage: `url(${event.mapUrl})` }}
              ></div>
            )}
            <p className="text-white/70 text-sm">{event.address}</p>
          </div>
        </div>

        {/* Right Column - Ticket Selection (Desktop Sidebar) */}
        <div className="md:w-[380px] md:sticky md:top-20 md:self-start">
          <div className="bg-card-dark rounded-lg border border-white/5 p-4">
            <h3 className="font-bold text-lg text-white mb-3">Selecciona tus entradas</h3>
            <div className="flex flex-col gap-2.5">
              {event.ticketTypes.map((ticket) => (
                <div key={ticket.id} className="flex flex-col gap-2 rounded-lg bg-background-dark border border-white/5 p-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm">{ticket.name}</h4>
                      <p className="text-primary font-bold text-base">${ticket.price.toFixed(2)}</p>
                      <p className="text-white/50 text-xs mt-0.5">{ticket.description}</p>
                      <p className="text-white/40 text-xs mt-0.5">Disponibles: {ticket.available}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQuantity(ticket.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white text-lg font-bold hover:bg-white/10 transition-colors"
                        disabled={ticketQuantities[ticket.id] === 0}
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-white text-sm">
                        {ticketQuantities[ticket.id] || 0}
                      </span>
                      <button 
                        onClick={() => updateQuantity(ticket.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white text-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        disabled={ticketQuantities[ticket.id] >= ticket.available}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Purchase Button */}
            <div className="hidden md:block mt-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/60 text-sm">Total</span>
                <span className="text-white text-xl font-bold">${total.toFixed(2)}</span>
              </div>
              <button 
                onClick={handlePurchase}
                disabled={total === 0}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comprar Entradas
              </button>
            </div>
          </div>

          {/* Map - Desktop */}
          <div className="hidden md:block bg-card-dark rounded-lg border border-white/5 p-4 mt-4">
            <h3 className="font-bold text-base text-white mb-3">Ubicación</h3>
            {event.mapUrl && (
              <div 
                className="w-full h-40 bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden mb-2"
                style={{ backgroundImage: `url(${event.mapUrl})` }}
              ></div>
            )}
            <p className="text-white/70 text-sm">{event.address}</p>
          </div>
        </div>
      </main>

      {/* Sticky Footer - Mobile */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card-dark/95 backdrop-blur-md border-t border-white/5 p-3 shadow-2xl">
        <div className="flex justify-between items-center gap-3">
          <div>
            <p className="text-xs text-white/60">Total</p>
            <p className="text-lg font-bold text-white">${total.toFixed(2)}</p>
          </div>
          <button 
            onClick={handlePurchase}
            disabled={total === 0}
            className="flex h-11 flex-1 max-w-[200px] items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Comprar
          </button>
        </div>
      </footer>
    </div>
  );
}
