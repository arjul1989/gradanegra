"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { eventService, Event } from "@/lib/eventService";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedSections, setLoadedSections] = useState<Set<number>>(new Set([0]));
  const [selectedCity, setSelectedCity] = useState("Todas las ciudades");
  const { user } = useAuth();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const cities = [
    "Todas las ciudades",
    "Bogotá",
    "Medellín",
    "Cali",
    "Barranquilla",
    "Cartagena",
    "Cúcuta",
    "Bucaramanga",
    "Pereira",
    "Santa Marta",
    "Ibagué",
  ];

  useEffect(() => {
    async function loadInitialContent() {
      try {
        const featured = await eventService.getFeaturedEvents();
        if (featured.length > 0) {
          setFeaturedEvent(featured[0]);
        }

        const categoriesData = eventService.getCategories();
        const categoriesWithPlaceholders = categoriesData.map((cat) => ({
          slug: cat.slug,
          name: cat.name,
          events: [],
          loaded: false,
        }));

        setCategories(categoriesWithPlaceholders);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialContent();
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!loadedSections.has(index)) {
              setLoadedSections((prev) => new Set([...prev, index]));
              loadCategoryEvents(index);
            }
          }
        });
      },
      { rootMargin: '200px' }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => observerRef.current?.disconnect();
  }, [categories.length]);

  const loadCategoryEvents = async (index: number) => {
    const category = categories[index];
    if (!category || category.loaded) return;

    try {
      const events = await eventService.getEventsByCategory(category.slug);
      const eventsMapped = events.slice(0, 5).map(event => ({
        id: event.id,
        title: event.name,
        date: new Date(event.date).toLocaleDateString('es-MX', { 
          day: 'numeric',
          month: 'short'
        }),
        price: event.price,
        image: event.image,
        location: event.location,
      }));

      // Triplicar para carrusel
      const tripleEvents = [
        ...eventsMapped,
        ...eventsMapped.map((e, i) => ({ ...e, id: `${e.id}-dup1-${i}` })),
        ...eventsMapped.map((e, i) => ({ ...e, id: `${e.id}-dup2-${i}` })),
      ];

      setCategories((prev) =>
        prev.map((cat, i) =>
          i === index ? { ...cat, events: tripleEvents, loaded: true } : cat
        )
      );
    } catch (error) {
      console.error(`Error loading category ${category.slug}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background-light">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-light"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background-light">
      {/* Sidebar - Desktop only - Fixed */}
      <aside className="w-64 flex-shrink-0 bg-background-light border-r border-gray-200/50 p-6 hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold mb-10 text-text-light">
          <span className="material-symbols-outlined text-3xl">confirmation_number</span>
          <span>GRADA NEGRA</span>
        </Link>
        
        <nav className="flex flex-col space-y-1 text-text-muted-light">
          <Link href="/" className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-200 text-text-light font-semibold">
            <span className="material-symbols-outlined">home</span>
            <span>Inicio</span>
          </Link>
          <Link href="/categoria/musica" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined">music_note</span>
            <span>Música</span>
          </Link>
          <Link href="/categoria/fiestas" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined">celebration</span>
            <span>Fiestas</span>
          </Link>
          <Link href="/categoria/deportes" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined">sports_soccer</span>
            <span>Deportes</span>
          </Link>
          <Link href="/categoria/arte-y-cultura" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined">palette</span>
            <span>Arte y Cultura</span>
          </Link>
          <Link href="/mis-boletos" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined">confirmation_number</span>
            <span>Mis Boletos</span>
          </Link>
        </nav>

        <div className="mt-auto">
          {user ? (
            <>
              <Link href="/perfil" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-200 text-text-muted-light transition-colors">
                <span className="material-symbols-outlined">account_circle</span>
                <span className="truncate">{user.email?.split('@')[0]}</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center space-x-3 px-4 py-2 text-text-muted-light rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Salir</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-200 text-text-muted-light transition-colors">
              <span className="material-symbols-outlined">login</span>
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content - With left margin to account for fixed sidebar */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-background-light/95 backdrop-blur-md border-b border-gray-200/50">
          <div className="w-full px-6 py-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1 max-w-xs">
                <input
                  className="w-full bg-gray-200 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light focus:ring-gray-900"
                  placeholder="Buscar eventos, artistas..."
                  type="search"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light">search</span>
              </div>
              
              {/* City Filter - New Simple Design */}
              <div className="relative hidden sm:block">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm text-text-light focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-text-muted-light pointer-events-none text-sm">
                  expand_more
                </span>
              </div>
            </div>
            
            <div className="md:hidden">
              <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
                <span className="material-symbols-outlined text-3xl">confirmation_number</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link href="#" className="hover:text-text-muted-light transition-colors">Ayuda</Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-20">
          <div className="w-full max-w-[1600px] mx-auto px-6 py-12 space-y-12">
            {/* Featured Event - Hero */}
            {featuredEvent && (
              <section className="w-full">
                <div className="relative rounded-lg overflow-hidden group aspect-video md:aspect-[2.4/1] w-full">
                  <Image
                    src={featuredEvent.image}
                    alt={featuredEvent.name}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                      Destacado
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">{featuredEvent.name}</h2>
                    <p className="max-w-xl text-sm md:text-base text-gray-200 hidden md:block">
                      {featuredEvent.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm mt-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                        <span>{new Date(featuredEvent.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="material-symbols-outlined text-lg">location_on</span>
                        <span>{featuredEvent.location}</span>
                      </div>
                    </div>
                    <Link
                      href={`/eventos/${featuredEvent.id}`}
                      className="bg-primary text-black font-bold py-2 px-6 rounded-full text-sm hover:bg-opacity-90 transform hover:scale-105 transition-all duration-300 ease-in-out mt-4 inline-block"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Categories Sections - Lazy Loaded */}
            {categories.map((category, index) => (
              <section
                key={category.slug}
                ref={(el) => {
                  sectionRefs.current[index] = el;
                }}
                data-index={index}
              >
                <Link
                  href={`/categoria/${category.slug}`}
                  className="flex items-center space-x-2 text-2xl font-bold mb-4 group hover:text-text-muted-light transition-colors"
                >
                  <span>{category.name}</span>
                  <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
                
                <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide -mx-6 px-6">
                  {category.loaded && category.events.length > 0 ? (
                    category.events.map((event: any) => (
                      <Link key={event.id} href={`/eventos/${event.id.split('-')[0]}`} className="flex-shrink-0 w-80 group">
                        <div className="bg-card-light rounded-lg shadow-lg overflow-hidden">
                          <div className="overflow-hidden">
                            <div className="relative w-full h-48">
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                sizes="320px"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-bold mb-2 truncate text-text-light">{event.title}</h3>
                            <div className="space-y-1 text-sm text-text-muted-light">
                              <div className="flex items-start">
                                <span className="material-symbols-outlined text-base mr-2 mt-0.5">calendar_month</span>
                                <span>{event.date}</span>
                              </div>
                              <div className="flex items-start">
                                <span className="material-symbols-outlined text-base mr-2 mt-0.5">location_on</span>
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    // Skeleton loading
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-80">
                        <div className="bg-card-light rounded-lg shadow-lg overflow-hidden animate-pulse">
                          <div className="w-full h-48 bg-gray-200"></div>
                          <div className="p-4">
                            <div className="h-6 bg-gray-200 rounded mb-2"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
