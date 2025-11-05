import Image from 'next/image';
import Link from 'next/link';
import { getBlurDataURL, getOptimizedSizes } from '@/lib/imageUtils';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  price: number;
  image: string;
  compact?: boolean;
}

export default function EventCard({ id, title, date, price, image, compact = false }: EventCardProps) {
  if (compact) {
    return (
      <Link href={`/eventos/${id}`}>
        <div className="group cursor-pointer h-full">
          <div className="relative aspect-[3/4] mb-2 rounded-lg overflow-hidden bg-card-dark border border-white/5 group-hover:border-primary/30 transition-all shadow-lg">
            <Image 
              src={image} 
              alt={title} 
              fill 
              sizes={getOptimizedSizes('compact')}
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              placeholder="blur"
              blurDataURL={getBlurDataURL(400, 533)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-white text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
              {title}
            </h3>
            <p className="text-white/50 text-xs">{date}</p>
            <p className="text-primary text-sm font-bold">${price}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/eventos/${id}`}>
      <div className="group cursor-pointer bg-card-dark rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all shadow-lg hover:shadow-primary/10 h-full flex flex-col">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image 
            src={image} 
            alt={title} 
            fill 
            sizes={getOptimizedSizes('card')}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            placeholder="blur"
            blurDataURL={getBlurDataURL(600, 338)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-primary text-xs font-bold mb-0.5">{date}</p>
          </div>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-white text-base font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {title}
          </h3>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-white text-lg font-bold">${price}</span>
            <span className="text-white/60 text-xs group-hover:text-primary transition-colors">
              Ver más →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
