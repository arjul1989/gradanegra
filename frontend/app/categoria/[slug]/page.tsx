"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  date: string;
  price: number;
  image: string;
}

interface Category {
  slug: string;
  name: string;
  description: string;
  events: Event[];
}

// Mock data - TODO: Reemplazar con llamadas al backend
const categoriesData: Category[] = [
  {
    slug: "rock-underground",
    name: "Noches de Rock Underground",
    description: "La mejor música rock alternativa e independiente. Bandas emergentes y clásicos del underground.",
    events: [
      {
        id: "rock-1",
        title: "Furia Metálica en el Sótano",
        date: "Vie, 12 Nov",
        price: 150,
        image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=600&fit=crop",
      },
      {
        id: "rock-2",
        title: "Acústico Rebelde",
        date: "Sáb, 13 Nov",
        price: 100,
        image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=600&fit=crop",
      },
      {
        id: "rock-3",
        title: "Tributo a Leyendas del Rock",
        date: "Vie, 19 Nov",
        price: 200,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop",
      },
      {
        id: "rock-4",
        title: "Noche de Punk y Furia",
        date: "Sáb, 20 Nov",
        price: 120,
        image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&h=600&fit=crop",
      },
      {
        id: "rock-5",
        title: "Indie Fest: Sonidos Nuevos",
        date: "Dom, 21 Nov",
        price: 180,
        image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=600&fit=crop",
      },
      {
        id: "rock-6",
        title: "Rock en Español Clásico",
        date: "Jue, 25 Nov",
        price: 220,
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=600&fit=crop",
      },
      {
        id: "rock-7",
        title: "Metal Progresivo",
        date: "Sáb, 27 Nov",
        price: 280,
        image: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400&h=600&fit=crop",
      },
      {
        id: "rock-8",
        title: "Garage Rock Revival",
        date: "Vie, 03 Dic",
        price: 160,
        image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop",
      },
    ],
  },
  {
    slug: "electronica-oscuridad",
    name: "Electrónica en la Oscuridad",
    description: "Los mejores DJs y productores de música electrónica. Techno, house, trance y más en espacios únicos.",
    events: [
      {
        id: "electro-1",
        title: "Abismo Techno",
        date: "Vie, 26 Nov",
        price: 250,
        image: "https://images.unsplash.com/photo-1571266028243-d220c6e8a67c?w=400&h=600&fit=crop",
      },
      {
        id: "electro-2",
        title: "Ritmos House & Soul",
        date: "Sáb, 27 Nov",
        price: 150,
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=600&fit=crop",
      },
      {
        id: "electro-3",
        title: "Trance Cósmico",
        date: "Vie, 03 Dic",
        price: 200,
        image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=600&fit=crop",
      },
      {
        id: "electro-4",
        title: "Sunset Downtempo",
        date: "Sáb, 04 Dic",
        price: 100,
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=600&fit=crop",
      },
      {
        id: "electro-5",
        title: "Rave Industrial",
        date: "Vie, 10 Dic",
        price: 300,
        image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=600&fit=crop",
      },
      {
        id: "electro-6",
        title: "Deep House Sessions",
        date: "Jue, 16 Dic",
        price: 180,
        image: "https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=400&h=600&fit=crop",
      },
      {
        id: "electro-7",
        title: "Drum & Bass Underground",
        date: "Sáb, 18 Dic",
        price: 220,
        image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&h=600&fit=crop",
      },
      {
        id: "electro-8",
        title: "Ambient Nocturno",
        date: "Vie, 24 Dic",
        price: 120,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop",
      },
    ],
  },
  {
    slug: "arte-cultura",
    name: "Arte y Cultura Nocturna",
    description: "Experiencias culturales únicas. Galerías, cine, danza, poesía y arte urbano en espacios alternativos.",
    events: [
      {
        id: "arte-1",
        title: "Noche de Galerías",
        date: "Jue, 11 Nov",
        price: 0,
        image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=600&fit=crop",
      },
      {
        id: "arte-2",
        title: "Poesía Subterránea",
        date: "Mié, 17 Nov",
        price: 50,
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop",
      },
      {
        id: "arte-3",
        title: "Cine de Culto al Aire Libre",
        date: "Mar, 23 Nov",
        price: 120,
        image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
      },
      {
        id: "arte-4",
        title: "Danza Contemporánea",
        date: "Vie, 26 Nov",
        price: 250,
        image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=600&fit=crop",
      },
      {
        id: "arte-5",
        title: "Murales Nocturnos",
        date: "Sáb, 27 Nov",
        price: 0,
        image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=600&fit=crop",
      },
      {
        id: "arte-6",
        title: "Teatro Experimental",
        date: "Jue, 02 Dic",
        price: 180,
        image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=600&fit=crop",
      },
      {
        id: "arte-7",
        title: "Performance Art Nocturno",
        date: "Sáb, 04 Dic",
        price: 150,
        image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=600&fit=crop",
      },
      {
        id: "arte-8",
        title: "Instalaciones Interactivas",
        date: "Vie, 10 Dic",
        price: 100,
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=600&fit=crop",
      },
    ],
  },
];

export default function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setSlug(resolvedParams.slug);
    });
  }, [params]);

  useEffect(() => {
    if (slug) {
      // TODO: Reemplazar con llamada al backend
      const foundCategory = categoriesData.find((cat) => cat.slug === slug);
      setCategory(foundCategory || null);
    }
  }, [slug]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <p className="text-white text-xl">Categoría no encontrada</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background-dark/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 md:px-10 py-3 text-white max-w-7xl">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Back Button */}
            <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 text-white">
              <div className="size-6 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    clipRule="evenodd"
                    d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-white text-lg md:text-xl font-bold font-display">Grada Negra</h2>
            </Link>

            {/* Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-white hover:text-primary transition-colors text-sm font-medium">
                Descubrir
              </Link>
              <Link href="/mis-boletos" className="text-white/70 hover:text-primary transition-colors text-sm font-medium">
                Mis Eventos
              </Link>
            </nav>
          </div>

          <div className="flex flex-1 justify-end gap-3 md:gap-6">
            {/* Search - Hidden on mobile */}
            <label className="relative hidden sm:flex flex-col min-w-40 h-10 max-w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                search
              </span>
              <input
                className="flex w-full h-full resize-none rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-primary focus:ring-1 focus:ring-primary pl-10 pr-4 text-base outline-none"
                placeholder="Buscar eventos..."
              />
            </label>

            {/* User Avatar */}
            <Link href="/perfil" className="bg-primary/20 rounded-full size-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex flex-col px-4 md:px-10 py-5 max-w-7xl pb-24 md:pb-8">
        {/* Category Header */}
        <div className="px-4 pb-6 pt-8">
          <h1 className="text-white tracking-tight text-3xl md:text-4xl lg:text-5xl font-bold font-display pb-3">
            {category.name}
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-3xl">
            {category.description}
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 p-4">
          {category.events.map((event) => (
            <Link key={event.id} href={`/eventos/${event.id}`}>
              <div className="flex flex-col gap-3 group cursor-pointer">
                {/* Event Image - Aspect ratio 3:4 (vertical) */}
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden relative">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {/* Event Info */}
                <div>
                  <p className="text-white text-base md:text-lg font-medium leading-normal group-hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </p>
                  <p className="text-white/60 text-sm font-normal leading-normal">
                    {event.date} - {event.price === 0 ? "Gratis" : `$${event.price}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
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
          className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full py-1 text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined h-8 text-2xl">confirmation_number</span>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Mis Boletos</p>
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
