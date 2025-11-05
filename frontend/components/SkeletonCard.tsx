export default function SkeletonCard({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="group cursor-pointer h-full animate-pulse">
        <div className="relative aspect-[3/4] mb-2 rounded-lg overflow-hidden bg-white/5">
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-3 bg-white/5 rounded w-1/2"></div>
          <div className="h-3 bg-white/5 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-dark rounded-xl overflow-hidden border border-white/5 shadow-lg h-full flex flex-col animate-pulse">
      <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5"></div>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-3">
        <div className="h-5 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/5 rounded w-full"></div>
        <div className="h-4 bg-white/5 rounded w-2/3"></div>
        <div className="flex items-center justify-between mt-auto">
          <div className="h-6 bg-white/10 rounded w-20"></div>
          <div className="h-4 bg-white/5 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonEventGrid({ count = 6, compact = true }: { count?: number; compact?: boolean }) {
  return (
    <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} compact={compact} />
      ))}
    </div>
  );
}

export function SkeletonFeaturedEvent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 bg-card-dark rounded-xl overflow-hidden border border-white/5 shadow-xl animate-pulse">
      <div className="relative aspect-[16/9] md:aspect-square md:col-span-2 bg-white/5">
        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5"></div>
      </div>
      <div className="flex flex-col justify-center p-4 md:p-5 md:col-span-3 gap-3">
        <div className="h-3 bg-white/10 rounded w-24"></div>
        <div className="h-8 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/5 rounded w-full"></div>
        <div className="h-4 bg-white/5 rounded w-5/6"></div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="h-4 bg-white/5 rounded w-48"></div>
          <div className="h-4 bg-white/5 rounded w-40"></div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="h-7 bg-white/10 rounded w-24"></div>
          <div className="h-10 bg-primary/20 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}
