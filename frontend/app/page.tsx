"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { eventService, Event } from "@/lib/eventService";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [allFeaturedEvents, setAllFeaturedEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedSections, setLoadedSections] = useState<Set<number>>(new Set());
  const [selectedCity, setSelectedCity] = useState("Todas las ciudades");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompactView, setIsCompactView] = useState(true);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  
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

  // Navegación del carousel
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  };

  // Touch/Drag handlers para móviles (NO para mouse drag)
  const handleDragStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    currentXRef.current = e.touches[0].clientX;
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const diff = startXRef.current - currentXRef.current;
    const threshold = 75; // Mayor threshold para evitar cambios accidentales

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left → next
        nextSlide();
      } else {
        // Swipe right → prev
        prevSlide();
      }
    }
  };

  // Wheel handler para Magic Mouse (React) - Suave y controlado
  const handleWheelReact = (e: React.WheelEvent) => {
    // Permitir que el evento se procese
    e.stopPropagation();
  };

  // useEffect con wheel listener nativo - Acumulación controlada
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || featuredEvents.length === 0) return;

    let accumulatedDelta = 0;
    let isProcessing = false;
    let lastEventTime = 0;

    const handleWheelNative = (e: WheelEvent) => {
      const now = Date.now();
      const timeSinceLastEvent = now - lastEventTime;
      
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const delta = isHorizontal ? deltaX : deltaY;
      
      if (Math.abs(delta) > 2) {
        e.preventDefault();
      }
      
      if (isProcessing) return;
      if (Math.abs(delta) < 1) return;
      
      // Resetear acumulado si pasó mucho tiempo
      if (timeSinceLastEvent > 150) {
        accumulatedDelta = 0;
      }
      
      lastEventTime = now;
      accumulatedDelta += delta;
      
      const threshold = 100;
      
      if (Math.abs(accumulatedDelta) >= threshold) {
        isProcessing = true;
        
        if (accumulatedDelta > 0) {
          setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
        } else {
          setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
        }
        
        accumulatedDelta = 0;
        
        setTimeout(() => {
          isProcessing = false;
        }, 550);
      }
    };

    carousel.addEventListener('wheel', handleWheelNative, { passive: false });
    
    return () => {
      carousel.removeEventListener('wheel', handleWheelNative);
    };
  }, [featuredEvents.length, currentSlide, carouselRef.current]);

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

  // Log de montaje del componente
  useEffect(() => {
    async function loadInitialContent() {
      try {
        const featured = await eventService.getFeaturedEvents();
        if (featured.length > 0) {
          setAllFeaturedEvents(featured);
          setFeaturedEvents(featured);
        }

        // Cargar categorías y verificar cuáles tienen eventos
        const categoriesData = await eventService.getCategories();
        const categoriesWithEvents = [];
        
        for (const cat of categoriesData) {
          const events = await eventService.getEventsByCategory(cat.slug);
          if (events && events.length > 0) {
            categoriesWithEvents.push({
              slug: cat.slug,
              name: cat.name || cat.nombre,
              events: [],
              loaded: false,
              eventCount: events.length,
              allEvents: events // Guardar todos los eventos para filtrar después
            });
          }
        }

        setAllCategories(categoriesWithEvents);
        setCategories(categoriesWithEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialContent();
  }, []);
  
  // Filtrar eventos por búsqueda y ciudad
  useEffect(() => {
    if (allFeaturedEvents.length === 0 && allCategories.length === 0) return;
    
    // Filtrar eventos destacados
    let filteredFeatured = allFeaturedEvents;
    
    if (selectedCity !== "Todas las ciudades") {
      filteredFeatured = filteredFeatured.filter(event => 
        event.city === selectedCity || event.ciudad === selectedCity
      );
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredFeatured = filteredFeatured.filter(event => 
        (event.name?.toLowerCase().includes(query) || 
         event.nombre?.toLowerCase().includes(query))
      );
    }
    
    setFeaturedEvents(filteredFeatured);
    
    // Filtrar categorías y sus eventos
    const filteredCategories = allCategories.map(cat => {
      let filteredEvents = cat.allEvents || [];
      
      if (selectedCity !== "Todas las ciudades") {
        filteredEvents = filteredEvents.filter((event: any) => 
          event.city === selectedCity || event.ciudad === selectedCity
        );
      }
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter((event: any) => 
          (event.name?.toLowerCase().includes(query) || 
           event.nombre?.toLowerCase().includes(query))
        );
      }
      
      // Mapear eventos con los campos correctos para las cards
      const eventsMapped = filteredEvents.slice(0, 5).map((event: any) => ({
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
        ...eventsMapped.map((e: any, i: number) => ({ ...e, id: `${e.id}-dup1-${i}` })),
        ...eventsMapped.map((e: any, i: number) => ({ ...e, id: `${e.id}-dup2-${i}` })),
      ];
      
      return {
        ...cat,
        events: tripleEvents,
        eventCount: filteredEvents.length,
        loaded: true // Marcar como cargado ya que ya tenemos los eventos filtrados
      };
    }).filter(cat => cat.eventCount > 0); // Solo mostrar categorías con eventos
    
    setCategories(filteredCategories);
    
    // Resetear el slide del carousel si se filtró
    if (currentSlide >= filteredFeatured.length && filteredFeatured.length > 0) {
      setCurrentSlide(0);
    }
  }, [selectedCity, searchQuery, allFeaturedEvents, allCategories]);

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
  
  // Cargar las primeras 3 categorías automáticamente
  useEffect(() => {
    if (categories.length > 0 && loadedSections.size === 0) {
      console.log('🚀 Auto-loading first 3 categories...', categories.slice(0, 3).map(c => c.slug));
      // Cargar las primeras 3 categorías
      [0, 1, 2].forEach((index) => {
        if (index < categories.length) {
          setTimeout(() => {
            console.log(`⏰ Triggering load for category ${index}`);
            setLoadedSections((prev) => new Set([...prev, index]));
            loadCategoryEvents(index);
          }, index * 200); // Escalonar la carga
        }
      });
    }
  }, [categories.length]);

  const loadCategoryEvents = async (index: number) => {
    const category = categories[index];
    if (!category || category.loaded) return;

    console.log(`🔄 Loading category ${index}: ${category.slug}`);
    
    try {
      const events = await eventService.getEventsByCategory(category.slug);
      console.log(`✅ Loaded ${events.length} events for ${category.slug}:`, events.map(e => e.nombre));
      
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

      console.log(`📦 Setting ${tripleEvents.length} events (tripled) for category ${index}`);

      setCategories((prev) =>
        prev.map((cat, i) =>
          i === index ? { ...cat, events: tripleEvents, loaded: true } : cat
        )
      );
    } catch (error) {
      console.error(`❌ Error loading category ${category.slug}:`, error);
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
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar - Desktop only - Fixed */}
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-r border-gray-200/50 dark:border-slate-700/50 p-6 hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 shadow-sm overflow-y-auto backdrop-blur-sm">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold mb-10 text-slate-900 dark:text-white flex-shrink-0">
          <span className="material-symbols-outlined text-3xl">confirmation_number</span>
          <span>GRADA NEGRA</span>
        </Link>
        
        <nav className="flex flex-col space-y-1 text-slate-600 dark:text-slate-400 flex-1">
          <Link href="/" className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-slate-700 dark:to-slate-600 text-white font-semibold shadow-md mb-2">
            <span className="material-symbols-outlined">home</span>
            <span>Inicio</span>
          </Link>
          
          <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>
          
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-4 py-2">Categorías</h3>
          
          {categories.map((category, index) => (
            <button
              key={category.slug}
              onClick={() => scrollToCategory(index)}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all text-left w-full"
            >
              <span className="material-symbols-outlined">
                {getCategoryIcon(category.slug)}
              </span>
              <span className="truncate">{category.name}</span>
            </button>
          ))}
          
          <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>
          
          <Link href="/mis-boletos" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all">
            <span className="material-symbols-outlined">confirmation_number</span>
            <span>Mis Boletos</span>
          </Link>
        </nav>

        <div className="mt-auto space-y-1 flex-shrink-0">
          {user ? (
            <>
              <Link href="/usuario/perfil" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 text-slate-600 dark:text-slate-400 transition-all">
                <span className="material-symbols-outlined">account_circle</span>
                <span className="truncate">{user.displayName?.split(' ')[0] || user.email?.split('@')[0]}</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center space-x-3 px-4 py-2 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all text-sm"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Salir</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 text-slate-600 dark:text-slate-400 transition-all">
              <span className="material-symbols-outlined">login</span>
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Menu - Netflix Style */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-2xl animate-slide-in-left">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">GN</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">GRADA NEGRA</h1>
                  <p className="text-xs text-gray-600 dark:text-slate-400">Tu boleto digital</p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-700 dark:text-slate-300">close</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-slate-700 dark:to-slate-600 text-white shadow-lg"
              >
                <span className="material-symbols-outlined">home</span>
                <span className="font-medium">Inicio</span>
              </Link>
              
              <Link 
                href="/eventos" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 text-gray-700 dark:text-slate-300 transition-all"
              >
                <span className="material-symbols-outlined">confirmation_number</span>
                <span>Todos los Eventos</span>
              </Link>
              
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700 mt-2">
                <p className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Categorías</p>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/categoria/${category.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 text-gray-700 dark:text-slate-300 transition-all"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-full">{category.eventCount}</span>
                  </Link>
                ))}
              </div>

              {user ? (
                <>
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700 mt-2">
                    <Link 
                      href="/usuario/perfil" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 text-gray-700 dark:text-slate-300 transition-all"
                    >
                      <span className="material-symbols-outlined">person</span>
                      <span>Mi Perfil</span>
                    </Link>
                    
                    <Link 
                      href="/mis-eventos" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700 text-gray-700 dark:text-slate-300 transition-all"
                    >
                      <span className="material-symbols-outlined">event_available</span>
                      <span>Mis Eventos</span>
                    </Link>
                    
                    <Link 
                      href="/logout" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 text-red-600 dark:text-red-400 transition-all"
                    >
                      <span className="material-symbols-outlined">logout</span>
                      <span>Salir</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700 mt-2">
                  <Link 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-slate-700 dark:to-slate-600 text-white shadow-lg"
                  >
                    <span className="material-symbols-outlined">login</span>
                    <span className="font-medium">Iniciar Sesión</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Help Button */}
            <div className="absolute bottom-6 left-0 right-0 px-4">
              <Link
                href="/ayuda"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-3 shadow-md hover:shadow-lg transition-all text-gray-700 dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-xl">help</span>
                <span className="font-medium">Ayuda</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - With left margin to account for fixed sidebar */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50/95 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/95 backdrop-blur-md border-b border-gray-300/50 dark:border-slate-700/50 shadow-lg">
          <div className="w-full px-4 md:px-6 py-3 md:py-4 flex justify-between items-center gap-2 md:gap-4">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined text-2xl text-gray-700 dark:text-slate-300">menu</span>
            </button>

            <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-3xl">
              <div className="relative flex-1">
                <input
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-3 pl-12 pr-4 text-base text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-gray-900 dark:focus:ring-slate-600 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                  placeholder="¿Qué evento buscas hoy?"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xl">search</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                )}
              </div>
              
              {/* City Filter - Segmented Control (iOS Style) */}
              <div className="relative hidden lg:flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-lg">location_on</span>
                
                {/* Compact View - Segmented Control */}
                {isCompactView && (
                  <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-full p-1 gap-1 shadow-sm">
                    {popularCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                          selectedCity === city
                            ? 'bg-gradient-to-r from-gray-900 to-gray-700 dark:from-slate-700 dark:to-slate-600 text-white shadow-lg'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600/50'
                        }`}
                      >
                        {city === "Todas las ciudades" ? (
                          <span className="flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                              <rect x="3" y="10" width="4" height="11" fill="currentColor" opacity="0.7"/>
                              <rect x="10" y="6" width="4" height="15" fill="currentColor"/>
                              <rect x="17" y="8" width="4" height="13" fill="currentColor" opacity="0.7"/>
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
            
            <div className="md:hidden flex items-center">
              <Link href="/" className="flex items-center space-x-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                <span className="hidden sm:inline">GRADA NEGRA</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-3">
              <Link 
                href="/panel/login" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-slate-700 dark:to-slate-600 hover:from-gray-800 hover:to-gray-600 dark:hover:from-slate-600 dark:hover:to-slate-500 text-white transition-all shadow-md hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-xl">storefront</span>
                <span className="font-medium">Negocios</span>
              </Link>
              <Link 
                href="#" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md transition-all text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">help</span>
                <span className="font-medium">Ayuda</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-20 pb-20 md:pb-0 relative">
          {/* Fondo con degradado radial */}
          <div className="absolute inset-0 bg-gradient-radial from-gray-100 via-gray-200 to-gray-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 opacity-60 pointer-events-none"></div>
          <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
            {/* No Results Message */}
            {(searchQuery || selectedCity !== "Todas las ciudades") && featuredEvents.length === 0 && categories.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-6xl md:text-8xl text-gray-400 dark:text-slate-600 mb-4">search_off</span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  No encontramos resultados
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                  {searchQuery && selectedCity !== "Todas las ciudades" 
                    ? `No hay eventos que coincidan con "${searchQuery}" en ${selectedCity}`
                    : searchQuery 
                    ? `No hay eventos que coincidan con "${searchQuery}"`
                    : `No hay eventos disponibles en ${selectedCity}`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCity("Todas las ciudades");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-slate-700 dark:to-slate-600 text-white rounded-lg hover:scale-105 transition-transform shadow-lg"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
            
            {/* Featured Events - Clean Centered Carousel */}
            {featuredEvents.length > 0 && (
              <section className="w-full relative -mx-4 sm:mx-0 px-2 sm:px-0">
                <div className="relative h-[350px] md:h-[500px] overflow-hidden">
                  {/* Botones de navegación */}
                  {featuredEvents.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl"
                        aria-label="Evento anterior"
                      >
                        <span className="material-symbols-outlined text-xl md:text-3xl">chevron_left</span>
                      </button>
                      
                      <button
                        onClick={nextSlide}
                        className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl"
                        aria-label="Evento siguiente"
                      >
                        <span className="material-symbols-outlined text-xl md:text-3xl">chevron_right</span>
                      </button>
                    </>
                  )}

                  {/* Carousel Container */}
                  <div 
                    ref={carouselRef}
                    className="relative w-full h-full flex items-center justify-center"
                    onWheel={handleWheelReact}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                  >
                    {/* Slides */}
                    {featuredEvents.map((event, index) => {
                      const offset = index - currentSlide;
                      const isActive = index === currentSlide;
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => !isActive && goToSlide(index)}
                          className="absolute transition-all duration-500 ease-out cursor-pointer px-1 sm:px-0"
                          style={{
                            transform: `translateX(${offset * 100}%) scale(${isActive ? 1 : 0.85})`,
                            opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.6,
                            zIndex: isActive ? 10 : Math.abs(offset) === 1 ? 5 : 0,
                            pointerEvents: Math.abs(offset) > 1 ? 'none' : 'auto',
                            width: '100%',
                            maxWidth: isActive ? '1200px' : '900px',
                          }}
                        >
                          <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[350px] md:h-[500px]">
                            <Image
                              src={event.image || event.imagen || '/placeholder-event.jpg'}
                              alt={event.name || event.nombre || 'Evento'}
                              fill
                              sizes="(max-width: 768px) 85vw, 1200px"
                              className="object-cover"
                              priority={index === 0}
                            />
                            
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                            
                            {/* Badge Destacado - Posicionado arriba para evitar corte en móvil */}
                            {isActive && (
                              <span className="absolute top-3 left-3 md:top-6 md:left-6 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full uppercase tracking-wider inline-block shadow-lg z-20">
                                Destacado
                              </span>
                            )}
                            
                            {/* Content - Only visible on active slide */}
                            {isActive && (
                              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 text-white">
                                <h2 className="text-xl md:text-5xl font-bold mb-2 md:mb-3 drop-shadow-lg line-clamp-2">
                                  {event.name || event.nombre}
                                </h2>
                                <p className="text-xs md:text-lg text-gray-200 mb-3 md:mb-4 max-w-3xl line-clamp-2 hidden sm:block">
                                  {event.description || event.descripcion}
                                </p>
                                <div className="flex items-center flex-wrap gap-2 md:gap-4 mb-4 md:mb-6">
                                  <div className="flex items-center space-x-1 md:space-x-2 bg-white/10 backdrop-blur-sm px-2 md:px-4 py-1 md:py-2 rounded-full">
                                    <span className="material-symbols-outlined text-base md:text-xl">calendar_month</span>
                                    <span className="text-xs md:text-base">
                                      {new Date(event.date || event.proximaFecha || Date.now()).toLocaleDateString('es-MX', { 
                                        day: 'numeric', 
                                        month: 'short'
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 md:space-x-2 bg-white/10 backdrop-blur-sm px-2 md:px-4 py-1 md:py-2 rounded-full">
                                    <span className="material-symbols-outlined text-base md:text-xl">location_on</span>
                                    <span className="text-xs md:text-base truncate max-w-[120px] md:max-w-none">
                                      {event.location || event.ubicacion || event.city || event.ciudad}
                                    </span>
                                  </div>
                                </div>
                                <Link
                                  href={`/eventos/${event.id}`}
                                  className="inline-block bg-gradient-to-r from-white to-gray-100 text-black font-bold py-2 md:py-3 px-5 md:px-8 rounded-full text-xs md:text-base hover:from-gray-100 hover:to-white transform hover:scale-105 transition-all duration-300 shadow-xl"
                                >
                                  Ver Detalles
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Indicators */}
                {featuredEvents.length > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`rounded-full transition-all duration-300 ${
                          currentSlide === index 
                            ? 'w-8 h-2 bg-gradient-to-r from-gray-900 to-gray-700' 
                            : 'w-2 h-2 bg-gray-300 hover:bg-gray-500'
                        }`}
                        aria-label={`Ir al evento ${index + 1}`}
                      />
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
                  className="flex items-center space-x-2 text-2xl font-bold mb-4 text-slate-900 dark:text-white group hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                >
                  <span>{category.name}</span>
                  <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
                
                <div className="flex overflow-x-auto space-x-3 sm:space-x-4 pb-4 scrollbar-hide">
                  {category.loaded && category.events.length > 0 ? (
                    category.events.map((event: any) => (
                      <Link key={event.id} href={`/eventos/${event.id}`} className="flex-shrink-0 w-[280px] sm:w-80 group">
                        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 border border-gray-100/50 dark:border-slate-700/50">
                          <div className="overflow-hidden relative">
                            <div className="relative w-full h-44 sm:h-48">
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                sizes="(max-width: 640px) 288px, 320px"
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900/50">
                            <h3 className="text-lg font-bold mb-2 truncate text-slate-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">{event.title}</h3>
                            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-start bg-gradient-to-r from-gray-50 to-transparent dark:from-slate-700/50 dark:to-transparent px-2 py-1 rounded">
                                <span className="material-symbols-outlined text-base mr-2 mt-0.5">calendar_month</span>
                                <span>{event.date}</span>
                              </div>
                              <div className="flex items-start bg-gradient-to-r from-gray-50 to-transparent dark:from-slate-700/50 dark:to-transparent px-2 py-1 rounded">
                                <span className="material-symbols-outlined text-base mr-2 mt-0.5">location_on</span>
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    // Skeleton loading
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-[280px] sm:w-80">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-lg overflow-hidden animate-pulse">
                          <div className="w-full h-44 sm:h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800"></div>
                          <div className="p-4">
                            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 rounded mb-2"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 rounded w-3/4"></div>
                              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 rounded w-2/3"></div>
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

      {/* Bottom Navigation Bar - Netflix Style (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 md:hidden z-50 shadow-2xl">
        <div className="flex justify-around items-center py-2 px-4 max-w-screen-sm mx-auto">
          <Link href="/" className="flex flex-col items-center py-2 px-3 min-w-[60px] group">
            <span className="material-symbols-outlined text-2xl text-gray-900 dark:text-white group-hover:scale-110 transition-transform">home</span>
            <span className="text-[10px] font-semibold text-gray-900 dark:text-white mt-1">Inicio</span>
          </Link>
          
          <button 
            onClick={() => {
              const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
              searchInput?.focus();
            }}
            className="flex flex-col items-center py-2 px-3 min-w-[60px] group"
          >
            <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-slate-400 group-hover:scale-110 transition-transform">search</span>
            <span className="text-[10px] text-gray-600 dark:text-slate-400 mt-1">Buscar</span>
          </button>
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center py-2 px-3 min-w-[60px] group"
          >
            <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-slate-400 group-hover:scale-110 transition-transform">category</span>
            <span className="text-[10px] text-gray-600 dark:text-slate-400 mt-1">Categorías</span>
          </button>
          
          <Link href={user ? "/usuario/perfil" : "/login"} className="flex flex-col items-center py-2 px-3 min-w-[60px] group">
            <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-slate-400 group-hover:scale-110 transition-transform">person</span>
            <span className="text-[10px] text-gray-600 dark:text-slate-400 mt-1">{user ? "Perfil" : "Entrar"}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
