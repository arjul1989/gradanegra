"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { eventService, Event } from "@/lib/eventService";
import Navbar from "@/components/Navbar";
import { SkeletonFeaturedEvent, SkeletonEventGrid } from "@/components/SkeletonCard";

export default function Home() {
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const featured = await eventService.getFeaturedEvents();
        if (featured.length > 0) {
          setFeaturedEvent(featured[0]);
        }

        const categoriesData = eventService.getCategories();
        const categoriesWithEvents = await Promise.all(
          categoriesData.map(async (cat) => {
            const events = await eventService.getEventsByCategory(cat.slug);
            // Triplicar eventos para efecto de carrusel
            const eventsMapped = events.slice(0, 5).map(event => ({
              id: event.id,
              title: event.name,
              date: new Date(event.date).toLocaleDateString('es-MX', { 
                weekday: 'short', 
                day: 'numeric',
                month: 'short'
              }),
              price: event.price,
              image: event.image,
            }));
            
            // Duplicar para crear más eventos
            const tripleEvents = [
              ...eventsMapped,
              ...eventsMapped.map((e, i) => ({ ...e, id: `${e.id}-dup1-${i}` })),
              ...eventsMapped.map((e, i) => ({ ...e, id: `${e.id}-dup2-${i}` })),
            ];
            
            return {
              slug: cat.slug,
              name: cat.name,
              events: tripleEvents
            };
          })
        );

        setCategories(categoriesWithEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-8">
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
            {/* Featured Event Skeleton */}
            <section className="mb-6 md:mb-8">
              <div className="h-6 bg-white/10 rounded w-48 mb-3 md:mb-4 animate-pulse"></div>
              <SkeletonFeaturedEvent />
            </section>

            {/* Categories Skeletons */}
            <section className="mb-6 md:mb-8">
              <div className="h-6 bg-white/10 rounded w-40 mb-3 md:mb-4 animate-pulse"></div>
              <SkeletonEventGrid count={6} compact={true} />
            </section>

            <section className="mb-6 md:mb-8">
              <div className="h-6 bg-white/10 rounded w-40 mb-3 md:mb-4 animate-pulse"></div>
              <SkeletonEventGrid count={6} compact={true} />
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-6">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
          {featuredEvent && (
            <section className="mb-6 md:mb-8">
              <h2 className="text-white text-lg md:text-xl font-bold mb-2 md:mb-3">Evento Destacado</h2>
              <Link href={`/eventos/${featuredEvent.id}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 bg-card-dark rounded-lg overflow-hidden border border-white/5 hover:border-primary/30 transition-all group cursor-pointer">
                  <div className="relative aspect-[16/9] md:aspect-[4/3] md:col-span-1">
                    <Image 
                      src={featuredEvent.image} 
                      alt={featuredEvent.name} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      priority
                    />
                    <div className="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded text-white text-xs font-bold uppercase tracking-wide">
                      Destacado
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-3 md:p-4 md:col-span-2">
                    <h3 className="text-white text-base md:text-lg font-bold mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">{featuredEvent.name}</h3>
                    <p className="text-white/60 text-xs md:text-sm mb-2 line-clamp-2">{featuredEvent.description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-white/70 text-xs">
                        <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                        {new Date(featuredEvent.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/70 text-xs">
                        <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                        <span className="line-clamp-1">{featuredEvent.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-white text-base md:text-lg font-bold">${featuredEvent.price}</span>
                      <div className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors">
                        Ver Detalles
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {categories.slice(0, 2).map((category) => (
            <section key={category.slug} className="mb-6 md:mb-8">
              <Link href={`/categoria/${category.slug}`} className="inline-flex items-center gap-2 mb-3 md:mb-4 hover:text-primary transition-colors cursor-pointer group">
                <h2 className="text-white text-lg md:text-xl font-bold">{category.name}</h2>
                <span className="material-symbols-outlined text-white/40 group-hover:text-primary group-hover:translate-x-1 transition-all text-lg">
                  arrow_forward
                </span>
              </Link>
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                {category.events.map((event: any) => (
                  <Link key={event.id} href={`/eventos/${event.id.split('-')[0]}`}>
                    <div className="group cursor-pointer flex-shrink-0 w-36 sm:w-40 md:w-44">
                      <div className="relative aspect-[3/4] mb-2 rounded-lg overflow-hidden bg-card-dark border border-white/5 group-hover:border-primary/30 transition-all shadow-lg">
                        <Image 
                          src={event.image} 
                          alt={event.title} 
                          fill 
                          sizes="180px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-white text-sm font-semibold mb-0.5 line-clamp-2 group-hover:text-primary transition-colors leading-tight">{event.title}</h3>
                      <p className="text-white/50 text-xs mb-1">{event.date}</p>
                      <p className="text-primary text-sm font-bold">${event.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-white/5 bg-card-dark/95 backdrop-blur-md shadow-2xl">
        <Link href="/" className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-primary">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>home</span>
          <p className="text-xs font-semibold">Inicio</p>
        </Link>
        <Link href="/mis-boletos" className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/50 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-xl">confirmation_number</span>
          <p className="text-xs font-medium">Boletos</p>
        </Link>
        <Link href="/perfil" className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/50 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-xl">person</span>
          <p className="text-xs font-medium">Perfil</p>
        </Link>
      </nav>
    </div>
  );
}
