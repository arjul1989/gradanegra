"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { eventService, Event } from "@/lib/eventService";
import Navbar from "@/components/Navbar";

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
            return {
              slug: cat.slug,
              name: cat.name,
              events: events.slice(0, 5).map(event => ({
                id: event.id,
                title: event.name,
                date: new Date(event.date).toLocaleDateString('es-MX', { 
                  weekday: 'short', 
                  day: 'numeric',
                  month: 'short'
                }),
                price: event.price,
                image: event.image,
              }))
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
      <div className="flex min-h-screen items-center justify-center bg-background-dark">
        <div className="text-center">
          <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-white">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-8">
        <div className="container mx-auto px-4 md:px-10 py-6 md:py-8 max-w-7xl">
          {featuredEvent && (
            <section className="mb-8 md:mb-12">
              <h2 className="text-white text-2xl md:text-3xl font-bold mb-4 md:mb-6 font-display">Evento Destacado</h2>
              <Link href={`/eventos/${featuredEvent.id}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="relative aspect-[16/9] md:aspect-square">
                    <Image 
                      src={featuredEvent.image} 
                      alt={featuredEvent.name} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 md:p-8">
                    <span className="text-primary text-sm md:text-base font-semibold mb-2">DESTACADO</span>
                    <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 font-display">{featuredEvent.name}</h3>
                    <p className="text-white/70 text-sm md:text-base mb-4 md:mb-6 line-clamp-2">{featuredEvent.description}</p>
                    <div className="flex flex-col gap-2 mb-4 md:mb-6">
                      <div className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                        <span className="material-symbols-outlined text-primary">calendar_today</span>
                        {new Date(featuredEvent.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        {featuredEvent.location}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xl md:text-2xl font-bold">${featuredEvent.price} MXN</span>
                      <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-colors">Comprar Ahora</button>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {categories.slice(0, 2).map((category) => (
            <section key={category.slug} className="mb-8 md:mb-12">
              <Link href={`/categoria/${category.slug}`} className="inline-block mb-4 md:mb-6 hover:text-primary transition-colors cursor-pointer">
                <h2 className="text-white text-xl md:text-2xl font-bold font-display">{category.name}</h2>
              </Link>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {category.events.map((event: any) => (
                  <Link key={event.id} href={`/eventos/${event.id}`}>
                    <div className="group cursor-pointer">
                      <div className="relative aspect-[3/4] mb-3 rounded-xl overflow-hidden bg-white/5">
                        <Image 
                          src={event.image} 
                          alt={event.title} 
                          fill 
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                      <h3 className="text-white text-sm md:text-base font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
                      <p className="text-white/60 text-xs md:text-sm mb-1">{event.date}</p>
                      <p className="text-primary text-sm md:text-base font-bold">${event.price} MXN</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-20 items-center justify-around border-t border-white/10 bg-background-dark/80 backdrop-blur-md">
        <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full py-1 text-primary">
          <span className="material-symbols-outlined h-8 text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>home</span>
          <p className="text-xs font-bold leading-normal tracking-[0.015em]">Inicio</p>
        </Link>
        <Link href="/mis-boletos" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full py-1 text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined h-8 text-2xl">confirmation_number</span>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Mis Boletos</p>
        </Link>
        <Link href="/perfil" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full py-1 text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined h-8 text-2xl">person</span>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Perfil</p>
        </Link>
      </nav>
    </div>
  );
}
