import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, Sparkles, MapPin, Heart, ChevronDown, ArrowUpDown, Loader2, Star } from "lucide-react";
import { getExploreOrganizations, getIndustries } from "../../supabase/services/organizations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocationContext } from "@/context/LocationContext";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import EmptyState from "@/components/UI/EmptyState";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const PAGE_SIZE = 12;

// ─── Recenter Map ─────────────────────────────────────────────────────────────
function RecenterMap({ businesses, userLocation }) {
  const map = useMap();
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const size = map.getSize();
        if (!size.x || !size.y) return;
        const validBiz = businesses.filter((b) => b.lat && b.lon);
        if (validBiz.length > 0) {
          const bounds = L.latLngBounds(validBiz.map((b) => [b.lat, b.lon]));
          map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 14, duration: 0.8 });
        } else if (Number.isFinite(userLocation?.latitude) && Number.isFinite(userLocation?.longitude)) {
          map.flyTo([userLocation.latitude, userLocation.longitude], 12, { duration: 0.8 });
        } else {
          map.flyTo([-34.6037, -58.3816], 5, { duration: 0.8 });
        }
      } catch (e) {}
    });
    return () => cancelAnimationFrame(raf);
  }, [businesses, userLocation?.latitude, userLocation?.longitude, map]);
  return null;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-none overflow-hidden border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] animate-pulse opacity-80">
    <div className="h-24 bg-slate-200 border-b-4 border-slate-900 flex items-center justify-center">
      <div className="w-10 h-10 bg-slate-300 border-2 border-slate-900" />
    </div>
    <div className="p-3 space-y-2">
      <div className="h-4 bg-slate-200 border border-slate-300 w-3/4" />
      <div className="h-3 bg-slate-100 border border-slate-200 w-1/2" />
      <div className="h-5 bg-slate-100 border border-slate-200 w-1/3 mt-1" />
    </div>
  </div>
);

// ─── Category image helper ────────────────────────────────────────────────────
function getCategoryImage(label = "") {
  const l = label.toLowerCase();
  if (l.includes("peluqueria") || l.includes("barberia")) return "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop";
  if (l.includes("gimnasio") || l.includes("deporte")) return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop";
  if (l.includes("medicina") || l.includes("salud")) return "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&h=200&fit=crop";
  if (l.includes("estetica") || l.includes("spa")) return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop";
  if (l.includes("gastronomia") || l.includes("restaurante") || l.includes("bar")) return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop";
  if (l.includes("mascota") || l.includes("veterinaria")) return "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=200&fit=crop";
  if (l.includes("automotor") || l.includes("taller")) return "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&h=200&fit=crop";
  return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop";
}

// ─── Favorites localStorage ───────────────────────────────────────────────────
const FAV_KEY = "kronix_favorites";
function loadFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []); }
  catch { return new Set(); }
}
function saveFavs(set) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
}

// ─── Biz Card (neo-brutalist) ─────────────────────────────────────────────────
const BizCard = React.memo(({ biz, isFav, onToggleFav, onHover, isHovered }) => {
  const navigate = useNavigate();
  const isNew = biz.created_at && new Date(biz.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const industryName = biz.industries?.name || "";
  const cityName = biz.cities?.name || "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -5, x: -5 }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => onHover(biz.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => navigate(`/reserva/${biz.slug}`)}
      className={`bg-white rounded-none overflow-hidden border-4 border-slate-900 cursor-pointer group transition-shadow duration-200 flex flex-col ${
        isHovered ? "shadow-[10px_10px_0_0_#22d3ee]" : "shadow-[6px_6px_0_0_#0f172a]"
      }`}
    >
      {/* Banner */}
      <div className="relative h-24 bg-yellow-100 border-b-4 border-slate-900 flex items-center justify-center overflow-hidden">
        {biz.logo_url ? (
          <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-12 h-12 bg-cyan-400 border-4 border-slate-900 flex items-center justify-center shadow-[3px_3px_0_0_#0f172a]">
            <span className="text-slate-900 font-black text-xl">{biz.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}

        {/* Fav button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(biz.id); }}
          className={`absolute top-2 right-2 w-7 h-7 border-2 border-slate-900 flex items-center justify-center transition-all duration-150 z-10 shadow-[2px_2px_0_0_#0f172a] ${
            isFav ? "bg-red-500 text-white" : "bg-white text-slate-400 hover:text-red-500"
          }`}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart size={12} className={isFav ? "fill-white" : ""} />
        </button>

        {isNew && (
          <span className="absolute top-2 left-2 bg-yellow-400 border-2 border-slate-900 text-slate-900 text-[9px] font-black px-2 py-0.5 uppercase tracking-wide shadow-[2px_2px_0_0_#0f172a] flex items-center gap-1">
            <Star size={8} className="fill-slate-900" /> Nuevo
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 bg-white">
        <h3 className="text-sm font-black text-slate-900 leading-tight truncate uppercase tracking-tight group-hover:text-cyan-600 transition-colors">
          {biz.name}
        </h3>
        {cityName && (
          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 truncate font-bold">
            <MapPin size={8} className="shrink-0 text-cyan-600" />
            {cityName}
          </p>
        )}
        {industryName && (
          <span className="inline-block mt-1.5 text-[9px] font-black px-2 py-0.5 bg-slate-900 text-cyan-400 uppercase tracking-widest">
            {industryName}
          </span>
        )}
      </div>
    </motion.div>
  );
});

// ─── Sort Dropdown (brutalist) ────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "newest", label: "Más nuevos" },
  { value: "az", label: "A → Z" },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider border-2 border-slate-900 px-3 py-2 bg-white shadow-[3px_3px_0_0_#0f172a] hover:bg-cyan-400 transition-colors"
      >
        <ArrowUpDown size={12} />
        <span className="hidden sm:inline">{current?.label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-[calc(100%+4px)] z-50 bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] overflow-hidden min-w-[140px]"
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors border-b-2 border-slate-200 last:border-0 ${
                  value === opt.value ? "bg-cyan-400 text-slate-900" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientHub({ onDataReady }) {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [businesses, setBusinesses] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [sortBy, setSortBy] = useState("newest");
  const [favorites, setFavorites] = useState(loadFavs);
  const [hoveredBizId, setHoveredBizId] = useState(null);

  const pageRef = useRef(0);
  const sentinelRef = useRef(null);
  const loadMoreRef = useRef(null);

  const navigate = useNavigate();
  const { userLocation } = useLocationContext();

  // Load categories
  useEffect(() => {
    getIndustries().then(({ data }) => data && setAllCategories(data));
  }, []);

  // Fetch helper — recreated only when filters/sort change
  const fetchPage = useCallback(
    (page) => getExploreOrganizations({
      searchQuery,
      category: activeCategory === "todos" ? null : activeCategory,
      provinceId: userLocation?.provinceId || null,
      cityId: userLocation?.cityId || null,
      sortBy,
      page,
      limit: PAGE_SIZE,
    }),
    [searchQuery, activeCategory, userLocation?.provinceId, userLocation?.cityId, sortBy]
  );

  // Filter/sort change → reset + fetch page 0
  useEffect(() => {
    let cancelled = false;
    pageRef.current = 0;
    setLoading(true);
    setHasMore(true);
    setBusinesses([]);

    fetchPage(0).then(({ data, count }) => {
      if (cancelled) return;
      setBusinesses(data);
      setTotalCount(count);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
      if (initialLoad) { setInitialLoad(false); onDataReady?.(); }
    });

    return () => { cancelled = true; };
  }, [fetchPage]);

  // loadMore — kept in ref so IntersectionObserver always gets latest version
  loadMoreRef.current = async () => {
    if (loadingMore || !hasMore || loading) return;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    const { data } = await fetchPage(nextPage);
    pageRef.current = nextPage;
    setBusinesses((prev) => [...prev, ...data]);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  // IntersectionObserver — set up once
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current?.(); },
      { rootMargin: "300px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // Favorites
  const toggleFav = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavs(next);
      return next;
    });
  }, []);

  const dynamicCategories = useMemo(
    () => allCategories.map((c) => ({ id: c.id, label: c.name, image: c.image_url || getCategoryImage(c.name) })),
    [allCategories]
  );

  const favBusinesses = businesses.filter((b) => favorites.has(b.id));
  const showFavsSection = favBusinesses.length > 0 && !searchQuery && activeCategory === "todos";

  const resultTitle = searchQuery
    ? `Resultados para "${searchQuery}"`
    : activeCategory !== "todos"
    ? (dynamicCategories.find((c) => c.id === activeCategory)?.label || "Descubrí opciones")
    : "Descubrí opciones";

  return (
    <div className="min-h-screen bg-[#f0f3fa] text-slate-900 -mt-24 pt-[104px] pb-16 px-4 md:px-8 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto min-h-screen">
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 mt-0 relative">

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 w-full min-w-0 pb-12">

            {/* Categories */}
            <section className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 mb-4 uppercase">
                Explora por rubro
              </h2>
              <div className="flex flex-nowrap overflow-x-auto gap-3 pb-3 scrollbar-hide">
                {/* Todos */}
                <button
                  onClick={() => setActiveCategory("todos")}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 border-4 border-slate-900 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeCategory === "todos"
                      ? "bg-cyan-400 text-slate-900 translate-x-1 translate-y-1 shadow-none"
                      : "bg-white text-slate-700 shadow-[4px_4px_0_0_#0f172a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a]"
                  }`}
                >
                  Todos
                </button>

                {dynamicCategories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id === activeCategory ? "todos" : cat.id)}
                      className={`shrink-0 flex items-center gap-2 pl-1 pr-4 py-1 border-4 border-slate-900 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-cyan-400 text-slate-900 translate-x-1 translate-y-1 shadow-none"
                          : "bg-white text-slate-700 shadow-[4px_4px_0_0_#0f172a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a]"
                      }`}
                    >
                      <div className="w-8 h-8 border-2 border-slate-900 overflow-hidden shrink-0">
                        <img src={cat.image} alt={cat.label} className="w-full h-full object-cover grayscale" />
                      </div>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Title + Sort */}
            <div className="flex items-center justify-between mb-6 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase">
                  {resultTitle}
                </h2>
                {!loading && (
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                    {businesses.length} de {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
                  </p>
                )}
              </div>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>

            {/* Favorites section */}
            {showFavsSection && (
              <section className="mb-8">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 border-b-4 border-yellow-400 pb-2 w-fit">
                  <Heart size={12} className="fill-red-500 text-red-500" />
                  Tus favoritos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mb-6">
                  <AnimatePresence>
                    {favBusinesses.map((biz) => (
                      <BizCard key={biz.id} biz={biz} isFav onToggleFav={toggleFav} onHover={setHoveredBizId} isHovered={hoveredBizId === biz.id} />
                    ))}
                  </AnimatePresence>
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 mt-6 border-b-4 border-slate-200 pb-2 w-fit">
                  Todos los negocios
                </h3>
              </section>
            )}

            {/* Main grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {!loading && businesses.map((biz) => (
                  <BizCard key={biz.id} biz={biz} isFav={favorites.has(biz.id)} onToggleFav={toggleFav} onHover={setHoveredBizId} isHovered={hoveredBizId === biz.id} />
                ))}
              </AnimatePresence>
              {loading && [1,2,3,4,5,6,7,8].map((i) => <SkeletonCard key={i} />)}
              {loadingMore && [1,2,3,4].map((i) => <SkeletonCard key={`m${i}`} />)}
            </div>

            {!loading && businesses.length === 0 && (
              <EmptyState title="No se encontraron resultados" description="Intenta con otros términos o cambia la categoría seleccionada." />
            )}

            {/* Sentinel */}
            <div ref={sentinelRef} className="h-4 mt-6" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            )}
            {!loading && !loadingMore && !hasMore && businesses.length > 0 && (
              <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-6">
                · Eso es todo ·
              </p>
            )}
          </div>

          {/* ── MAP ASIDE — solo si hay resultados ── */}
          {!loading && businesses.length > 0 && (
          <aside className="w-full xl:w-[480px] hidden xl:block shrink-0 sticky top-28 h-[calc(100vh-140px)] self-start z-0">
            <div className="bg-white border-4 border-slate-900 p-5 h-full shadow-[12px_12px_0_0_#0f172a] flex flex-col overflow-hidden relative">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-yellow-400 shrink-0 w-fit">
                <MapIcon className="text-cyan-600" size={22} strokeWidth={3} />
                <h3 className="font-black text-lg uppercase tracking-tight text-slate-900">Explorar Mapa</h3>
              </div>
              <div className="flex-1 relative overflow-hidden bg-slate-100 border-4 border-slate-900">
                <MapContainer
                  center={[-34.6037, -58.3816]}
                  zoom={5}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                  attributionControl={false}
                >
                  <RecenterMap businesses={businesses} userLocation={userLocation} />
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
                  {businesses.map((biz) => {
                    if (!biz.lat || !biz.lon) return null;
                    const isHovered = hoveredBizId === biz.id;
                    const markerIcon = L.divIcon({
                      className: "custom-leaflet-marker bg-transparent border-0",
                      html: `<div class="w-8 h-8 border-4 border-slate-900 flex items-center justify-center shadow-[3px_3px_0_0_#0f172a] transition-all duration-200 ${isHovered ? "bg-yellow-400 scale-125 z-50 -rotate-6" : "bg-cyan-400 scale-100 rotate-3 z-10"}">
                        <span class="text-xs font-black text-slate-900">${biz.name.charAt(0)}</span>
                      </div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                    });
                    return (
                      <Marker key={biz.id} position={[biz.lat, biz.lon]} icon={markerIcon} zIndexOffset={isHovered ? 1000 : 0}>
                        <Tooltip direction="top" offset={[0, -10]} opacity={1} className="brutalist-tooltip bg-white border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0_0_#0f172a] font-black uppercase rounded-none px-2 py-1 text-[10px]">
                          {biz.name}
                        </Tooltip>
                        <Popup className="rounded-none border-0 shadow-none brutalist-popup" closeButton={false}>
                          <div className="text-center p-3 w-56 bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] relative -left-3 -top-3">
                            <div className="w-full h-24 mb-3 overflow-hidden border-2 border-slate-900 bg-yellow-400">
                              {biz.logo_url
                                ? <img src={biz.logo_url} className="w-full h-full object-cover" alt={biz.name} />
                                : <div className="w-full h-full flex items-center justify-center"><Sparkles className="text-slate-900" size={32} /></div>
                              }
                            </div>
                            <h4 className="font-black text-[15px] mb-1 text-slate-900 leading-tight uppercase">{biz.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold mb-3 flex items-center justify-center gap-1 uppercase">
                              <MapPin size={8} /> {biz.cities?.name}
                            </p>
                            <button
                              onClick={() => navigate(`/reserva/${biz.slug}`)}
                              className="w-full bg-cyan-400 border-2 border-slate-900 hover:bg-cyan-300 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#0f172a] text-slate-900 text-xs font-black py-2.5 uppercase tracking-widest transition-all"
                            >
                              Agendar
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          </aside>
          )}
        </div>
      </div>
    </div>
  );
}
