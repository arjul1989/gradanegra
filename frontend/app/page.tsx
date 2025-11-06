"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { eventService, Event } from "@/lib/eventService";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedSections, setLoadedSections] = useState<Set<number>>(new Set([0]));
  const [selectedCity, setSelectedCity] = useState("Todas las ciudades");
  const [isCompactView, setIsCompactView] = useState(true);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const { user } = useAuth();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const heroObserverRef = useRef<IntersectionObserver | null>(null);
  
  // Get popular cities (first 5)
  const popularCities = ["Todas las ciudades", "Bogotá", "Medellín", "Cali", "Barranquilla"];
  
  // Función para hacer scroll a una categoría específica
  const scrollToCategory = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      // Scroll suave a la sección, considerando el header fijo (80px)
      const yOffset = -100; 
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
          setFeaturedEvents(featured);
        }

        const categoriesData = await eventService.getCategories();
        const categoriesWithPlaceholders = categoriesData.map((cat) => ({
          slug: cat.slug,
          name: cat.name || cat.nombre,
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

  // Intersection Observer para detectar el evento hero activo
  useEffect(() => {
    if (featuredEvents.length === 0) return;

    heroObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-hero-index'));
            setActiveHeroIndex(index);
          }
        });
      },
      { 
        root: null,
        threshold: 0.6, // 60% visible para considerarlo activo
        rootMargin: '0px'
      }
    );

    return () => heroObserverRef.current?.disconnect();
  }, [featuredEvents.length]);

  const loadCategoryEvents = async (index: number) => {
    const category = categories[index];
    if (!category || category.loaded) return;

    try {
      const events = await eventService.getEventsByCategory(category.slug);
      const eventsMapped = events.slice(0, 5).map(event => ({
        id: event.id,
        title: event.name || event.nombre,
        date: new Date(event.date || event.proximaFecha || Date.now()).toLocaleDateString('es-MX', { 
          day: 'numeric',
          month: 'short'
        }),
        price: event.price || event.precioDesde || 0,
        image: event.image || event.imagen || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop',
        location: event.location || event.ubicacion || event.city || event.ciudad,
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
  
  // Helper function para obtener el icono según la categoría
  const getCategoryIcon = (slug: string): string => {
    const iconMap: Record<string, string> = {
      'rock-underground': 'music_note',
      'electronica-oscuridad': 'nightlife',
      'reggaeton-urbano': 'album',
      'salsa-tropical': 'music_note',
      'comedia-stand-up': 'sentiment_very_satisfied',
      'deportes-extremos': 'sports_soccer',
      'arte-cultura': 'palette',
      'gastronomia': 'restaurant',
      'festivales': 'celebration'
    };
    return iconMap[slug] || 'category';
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
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-white via-gray-50 to-white border-r border-gray-200/50 p-6 hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 shadow-sm overflow-y-auto">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold mb-10 text-text-light flex-shrink-0">
          <span className="material-symbols-outlined text-3xl">confirmation_number</span>
          <span>GRADA NEGRA</span>
        </Link>
        
        <nav className="flex flex-col space-y-1 text-text-muted-light flex-1">
          <Link href="/" className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold shadow-md mb-2">
            <span className="material-symbols-outlined">home</span>
            <span>Inicio</span>
          </Link>
          
          <div className="border-t border-gray-200 my-2"></div>
          
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted-light px-4 py-2">Categorías</h3>
          
          {categories.map((category, index) => (
            <button
              key={category.slug}
              onClick={() => scrollToCategory(index)}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 transition-all text-left w-full"
            >
              <span className="material-symbols-outlined">
                {getCategoryIcon(category.slug)}
              </span>
              <span className="truncate">{category.name}</span>
            </button>
          ))}
          
          <div className="border-t border-gray-200 my-2"></div>
          
          <Link href="/mis-boletos" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 transition-all">
            <span className="material-symbols-outlined">confirmation_number</span>
            <span>Mis Boletos</span>
          </Link>
        </nav>

        <div className="mt-auto space-y-1 flex-shrink-0">
          {user ? (
            <>
              <Link href="/perfil" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 text-text-muted-light transition-all">
                <span className="material-symbols-outlined">account_circle</span>
                <span className="truncate">{user.email?.split('@')[0]}</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center space-x-3 px-4 py-2 text-text-muted-light rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 transition-all text-sm"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Salir</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 text-text-muted-light transition-all">
              <span className="material-symbols-outlined">login</span>
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content - With left margin to account for fixed sidebar */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-gradient-to-r from-white via-gray-50 to-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="w-full px-6 py-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1 max-w-xs">
                <input
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light focus:ring-gray-900 focus:from-white focus:to-gray-100 transition-all"
                  placeholder="Buscar eventos, artistas..."
                  type="search"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light">search</span>
              </div>
              
              {/* City Filter - Segmented Control (iOS Style) */}
              <div className="relative hidden lg:flex items-center gap-3">
                <span className="material-symbols-outlined text-text-muted-light text-lg">location_on</span>
                
                {/* Compact View - Segmented Control */}
                {isCompactView && (
                  <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-50 rounded-full p-1 gap-1 shadow-sm">
                    {popularCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                          selectedCity === city
                            ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg'
                            : 'text-text-muted-light hover:text-text-light hover:bg-white/50'
                        }`}
                      >
                        {city === "Todas las ciudades" ? (
                          <span className="flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                              <rect x="3" y="10" width="4" height="11" fill="currentColor" opacity="0.7"/>
                              <rect x="10" y="6" width="4" height="15" fill="currentColor"/>
                              <rect x="17" y="8" width="4" height="13" fill="currentColor" opacity="0.7"/>
                              <rect x="4" y="12" width="2" height="2" fill="white" opacity="0.5"/>
                              <rect x="4" y="15" width="2" height="2" fill="white" opacity="0.5"/>
                              <rect x="11" y="8" width="2" height="2" fill="white" opacity="0.5"/>
                              <rect x="11" y="11" width="2" height="2" fill="white" opacity="0.5"/>
                              <rect x="11" y="14" width="2" height="2" fill="white" opacity="0.5"/>
                              <rect x="18" y="10" width="2" height="2" fill="white" opacity="0.5"/>
                              <rect x="18" y="13" width="2" height="2" fill="white" opacity="0.5"/>
                              <rect x="18" y="16" width="2" height="2" fill="white" opacity="0.5"/>
                            </svg>
                            Todas
                          </span>
                        ) : city}
                      </button>
                    ))}
                    
                    {cities.length > 5 && (
                      <button
                        onClick={() => setIsCompactView(false)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium text-text-muted-light hover:text-text-light hover:bg-gray-200 transition-all"
                        title="Ver todas las ciudades"
                      >
                        <span className="material-symbols-outlined text-sm">more_horiz</span>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Extended View - All Cities Grid */}
                {!isCompactView && (
                  <div className="absolute top-full left-0 mt-2 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl border border-gray-200/50 p-4 z-50 min-w-[500px]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-text-light">Selecciona una ciudad</h3>
                      <button
                        onClick={() => setIsCompactView(true)}
                        className="text-text-muted-light hover:text-text-light transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedCity(city);
                            setIsCompactView(true);
                          }}
                          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            selectedCity === city
                              ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg'
                              : 'bg-gradient-to-br from-gray-50 to-gray-100 text-text-muted-light hover:from-gray-100 hover:to-gray-200 hover:text-text-light'
                          }`}
                        >
                          {city === "Todas las ciudades" ? (
                            <span className="flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                                <rect x="3" y="10" width="4" height="11" fill="currentColor" opacity="0.7"/>
                                <rect x="10" y="6" width="4" height="15" fill="currentColor"/>
                                <rect x="17" y="8" width="4" height="13" fill="currentColor" opacity="0.7"/>
                                <rect x="4" y="12" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                                <rect x="4" y="15" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                                <rect x="11" y="8" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                                <rect x="11" y="11" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                                <rect x="11" y="14" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                                <rect x="18" y="10" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                                <rect x="18" y="13" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                                <rect x="18" y="16" width="2" height="2" fill={selectedCity === city ? "white" : "currentColor"} opacity="0.5"/>
                              </svg>
                              Todas
                            </span>
                          ) : city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile City Selector */}
              <div className="relative lg:hidden">
                <button
                  onClick={() => setIsCompactView(!isCompactView)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-sm text-text-light transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  <span className="font-medium">
                    {selectedCity === "Todas las ciudades" ? (
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="10" width="4" height="11" fill="currentColor" opacity="0.7"/>
                          <rect x="10" y="6" width="4" height="15" fill="currentColor"/>
                          <rect x="17" y="8" width="4" height="13" fill="currentColor" opacity="0.7"/>
                        </svg>
                        Todas
                      </span>
                    ) : selectedCity}
                  </span>
                  <span className={`material-symbols-outlined text-lg transition-transform ${!isCompactView ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                
                {!isCompactView && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[320px] overflow-y-auto">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setIsCompactView(true);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedCity === city 
                            ? 'bg-gray-100 text-text-light font-semibold' 
                            : 'text-text-muted-light hover:bg-gray-50'
                        }`}
                      >
                        {city === "Todas las ciudades" ? (
                          <span className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="10" width="4" height="11" fill="currentColor" opacity="0.7"/>
                              <rect x="10" y="6" width="4" height="15" fill="currentColor"/>
                              <rect x="17" y="8" width="4" height="13" fill="currentColor" opacity="0.7"/>
                            </svg>
                            Todas
                          </span>
                        ) : city}
                      </button>
                    ))}
                  </div>
                )}
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
            {/* Featured Events - Hero Carousel with Dynamic Scaling */}
            {featuredEvents.length > 0 && (
              <section className="w-full -mx-6">
                {/* Contenedor con altura fija para evitar saltos */}
                <div className="h-[300px] md:h-[450px]">
                  <div className="flex overflow-x-auto gap-8 px-6 pb-4 scrollbar-hide snap-x snap-mandatory w-full h-full items-center">
                    {featuredEvents.map((event, index) => {
                      const isActive = activeHeroIndex === index;
                      const isFirst = index === 0;
                      
                      return (
                        <div 
                          key={event.id}
                          data-hero-index={index}
                          ref={(el) => {
                            if (el && heroObserverRef.current) {
                              heroObserverRef.current.observe(el);
                            }
                          }}
                          className={`flex-shrink-0 snap-center transition-all duration-700 ease-out h-full ${
                            isActive 
                              ? 'w-[calc(100vw-48px)] md:w-[calc(100vw-320px)] scale-100 opacity-100' 
                              : isFirst 
                                ? 'w-[calc((100vw-48px)*0.5)] md:w-[calc((100vw-320px)*0.5)] scale-90 opacity-70'
                                : 'w-[calc((100vw-48px)*0.3)] md:w-[calc((100vw-320px)*0.3)] scale-75 opacity-50'
                          }`}
                          style={{ maxWidth: isActive ? '1552px' : isFirst ? '776px' : '465px' }}
                        >
                          <div className="relative rounded-lg overflow-hidden group w-full h-full shadow-2xl">
                            <Image
                              src={event.image || event.imagen || '/placeholder-event.jpg'}
                              alt={event.name || event.nombre || 'Evento'}
                              fill
                              sizes="(max-width: 768px) 100vw, 1552px"
                              className="object-cover transition-transform duration-700"
                              priority={index === 0}
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-500 ${
                              isActive ? 'opacity-100' : 'opacity-40'
                            }`}></div>
                            <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-8 text-white transition-all duration-500 ${
                              isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            }`}>
                              <div className="max-w-4xl">
                                <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block shadow-lg">
                                  Destacado
                                </span>
                                <h2 className="text-xl md:text-4xl font-bold mb-2 drop-shadow-lg line-clamp-2">{event.name || event.nombre}</h2>
                                <p className="max-w-2xl text-xs md:text-base text-gray-200 hidden md:block drop-shadow-md line-clamp-2">
                                  {event.description || event.descripcion}
                                </p>
                                <div className="flex items-center flex-wrap gap-3 text-xs md:text-sm mt-4">
                                  <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="material-symbols-outlined text-base md:text-lg">calendar_month</span>
                                    <span>{new Date(event.date || event.proximaFecha || Date.now()).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="material-symbols-outlined text-base md:text-lg">location_on</span>
                                    <span className="truncate max-w-[200px]">{event.location || event.ubicacion || event.city || event.ciudad}</span>
                                  </div>
                                </div>
                                <Link
                                  href={`/eventos/${event.id}`}
                                  className="bg-gradient-to-r from-white to-gray-100 text-black font-bold py-2 px-6 rounded-full text-xs md:text-sm hover:from-gray-100 hover:to-white transform hover:scale-105 transition-all duration-300 ease-in-out mt-4 inline-block shadow-lg"
                                >
                                  Ver Detalles
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Scroll Indicators */}
                {featuredEvents.length > 1 && (
                  <div className="flex justify-center gap-2 mt-6 px-6">
                    {featuredEvents.map((_, index) => (
                      <div 
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeHeroIndex === index 
                            ? 'w-8 bg-gradient-to-r from-gray-900 to-gray-700' 
                            : 'w-2 bg-gray-300 hover:bg-gray-500'
                        }`}
                      ></div>
                    ))}
                  </div>
                )}
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
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 border border-gray-100/50">
                          <div className="overflow-hidden relative">
                            <div className="relative w-full h-48">
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                sizes="320px"
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-white via-white to-gray-50/50">
                            <h3 className="text-lg font-bold mb-2 truncate text-text-light group-hover:text-gray-900 transition-colors">{event.title}</h3>
                            <div className="space-y-1 text-sm text-text-muted-light">
                              <div className="flex items-start bg-gradient-to-r from-gray-50 to-transparent px-2 py-1 rounded">
                                <span className="material-symbols-outlined text-base mr-2 mt-0.5">calendar_month</span>
                                <span>{event.date}</span>
                              </div>
                              <div className="flex items-start bg-gradient-to-r from-gray-50 to-transparent px-2 py-1 rounded">
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
                        <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg shadow-lg overflow-hidden animate-pulse">
                          <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                          <div className="p-4">
                            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
                              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
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
