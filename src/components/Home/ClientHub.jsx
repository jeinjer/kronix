import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Map as MapIcon,
  Star,
  Sparkles,
  MapPin,
} from "lucide-react";
import {
  getExploreOrganizations,
  getIndustries,
} from "../../supabase/services/organizations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocationContext } from "@/context/LocationContext";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import EmptyState from "@/components/UI/EmptyState";

// Fix leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Recenter map: prioritize business markers, fallback to city coordinates, then Argentina
function RecenterMap({ businesses, userLocation }) {
  const map = useMap();
  useEffect(() => {
    // Defer to next frame so the map container is fully sized
    const raf = requestAnimationFrame(() => {
      try {
        const size = map.getSize();
        if (!size.x || !size.y) return; // Container not ready yet

        const validBiz = businesses.filter((b) => b.lat && b.lon);
        if (validBiz.length > 0) {
          const bounds = L.latLngBounds(validBiz.map((b) => [b.lat, b.lon]));
          map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 14, duration: 0.8 });
        } else if (
          Number.isFinite(userLocation?.latitude) &&
          Number.isFinite(userLocation?.longitude)
        ) {
          map.flyTo([userLocation.latitude, userLocation.longitude], 12, { duration: 0.8 });
        } else {
          map.flyTo([-34.6037, -58.3816], 5, { duration: 0.8 });
        }
      } catch (e) {
        // Silently handle — map not ready yet, will retry on next render
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [businesses, userLocation?.latitude, userLocation?.longitude, map]);
  return null;
}

const SkeletonCard = () => (
  <div className="bg-white rounded-none overflow-hidden shadow-[8px_8px_0_0_#0f172a] border-4 border-slate-900 flex flex-col h-full relative animate-pulse opacity-80">
    <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden bg-slate-200 border-b-4 border-slate-900 flex items-center justify-center">
      <div className="w-16 h-16 bg-slate-300 border-4 border-slate-900 transform -rotate-6"></div>
      {/* Simulated map pin badge */}
      <div className="absolute bottom-3 left-3 bg-white border-2 border-slate-900 w-24 h-6"></div>
    </div>
    <div className="p-4 sm:p-5 flex flex-col flex-grow bg-white">
      <div className="h-6 sm:h-7 bg-slate-300 border-2 border-slate-900 w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-200 border-2 border-slate-900 w-1/3 mb-4"></div>
      <div className="mt-auto pt-4">
        <div className="h-10 sm:h-12 bg-slate-300 border-2 border-slate-900 w-full shadow-[4px_4px_0_0_#0f172a]"></div>
      </div>
    </div>
  </div>
);

export default function ClientHub({ onDataReady }) {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const [businesses, setBusinesses] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hoveredBizId, setHoveredBizId] = useState(null);
  const navigate = useNavigate();
  const { userLocation } = useLocationContext();

  useEffect(() => {
    async function fetchAllCategories() {
      const { data } = await getIndustries();
      if (data) {
        setAllCategories(data);
      }
    }
    fetchAllCategories();
  }, []);

  useEffect(() => {
    async function fetchBiz() {
      setLoading(true);
      const { data } = await getExploreOrganizations({
        searchQuery: searchQuery,
        category: activeCategory === "todos" ? null : activeCategory,
        provinceId: userLocation?.provinceId || null,
        cityId: userLocation?.cityId || null,
      });
      setBusinesses(data || []);
      setLoading(false);
      if (initialLoad) {
        setInitialLoad(false);
        onDataReady?.();
      }
    }
    fetchBiz();
  }, [searchQuery, activeCategory, userLocation?.provinceId, userLocation?.cityId]);

  const dynamicCategories = useMemo(() => {
    const getCategoryImage = (label) => {
      const l = label.toLowerCase();
      if (l.includes("peluqueria") || l.includes("barberia")) return "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop";
      if (l.includes("gimnasio") || l.includes("deporte")) return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop";
      if (l.includes("medicina") || l.includes("salud")) return "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&h=200&fit=crop";
      if (l.includes("estetica") || l.includes("spa")) return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop";
      if (l.includes("gastronomia") || l.includes("restaurante") || l.includes("bar")) return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop";
      if (l.includes("mascota") || l.includes("veterinaria")) return "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=200&fit=crop";
      if (l.includes("automotor") || l.includes("taller")) return "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&h=200&fit=crop";
      return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop";
    };

    return allCategories.map((c) => ({
      id: c.id,
      label: c.name,
      image: c.image_url || getCategoryImage(c.name),
    }));
  }, [allCategories]);

  const filteredBusinesses = businesses;

  return (
    <div className="min-h-screen bg-[#f0f3fa] text-slate-900 -mt-24 pt-[104px] pb-16 px-4 md:px-8 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto min-h-screen">
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 mt-0 relative">
          {/* MAIN CONTENT AREA */}
          <div className="flex-1 w-full min-w-0 pb-12">
            {/* CATEGORIES HORIZONTAL SCROLL / WRAP */}
            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mb-6 uppercase">
                Explora por rubro
              </h2>
              <div className="flex flex-nowrap overflow-x-auto sm:flex-wrap justify-start gap-3 sm:gap-4 pb-4 px-1 scrollbar-hide">
                {dynamicCategories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setActiveCategory(
                          cat.id === activeCategory ? "todos" : cat.id,
                        )
                      }
                      className={`min-w-[75px] w-[75px] h-[90px] sm:min-w-[85px] sm:w-[85px] sm:h-[100px] md:min-w-[100px] md:w-[100px] md:h-[115px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 md:gap-3 rounded-none transition-all border-4 shrink-0 ${
                        isActive
                          ? "bg-cyan-400 border-slate-900 translate-y-1 translate-x-1 shadow-none"
                          : "bg-white border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0f172a] cursor-pointer"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-none overflow-hidden border-2 border-slate-900`}
                      >
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
                        />
                      </div>
                      <span
                        className={`text-[9px] sm:text-[11px] md:text-xs font-black tracking-tight text-center leading-tight uppercase text-slate-900`}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SECTIONS & BUSINESS GRID */}
            <section className="space-y-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase">
                  {searchQuery
                    ? `Resultados para "${searchQuery}"`
                    : "Descubrí opciones"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {filteredBusinesses.map((biz, idx) => {
                  const isNew =
                    biz.created_at &&
                    new Date(biz.created_at) >
                      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

                  return (
                    <motion.div
                      key={biz.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -6, x: -6 }}
                      onMouseEnter={() => setHoveredBizId(biz.id)}
                      onMouseLeave={() => setHoveredBizId(null)}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-none overflow-hidden hover:shadow-[12px_12px_0_0_#0f172a] shadow-[8px_8px_0_0_#0f172a] border-4 border-slate-900 transition-all duration-300 group flex flex-col h-full relative"
                    >
                      <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden bg-yellow-400 border-b-4 border-slate-900">
                        {biz.logo_url ? (
                          <img
                            src={biz.logo_url}
                            alt={biz.name}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-900">
                            <Sparkles size={48} strokeWidth={1.5} />
                          </div>
                        )}

                        {/* Promo Badges overlays */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                          {isNew && (
                            <span className="bg-yellow-400 border-2 border-slate-900 text-slate-900 text-[11px] font-black px-2 py-0.5 rounded-none shadow-[2px_2px_0_0_#0f172a] uppercase flex items-center gap-1">
                              <Star size={12} className="fill-slate-900" />{" "}
                              Nuevo
                            </span>
                          )}
                        </div>

                        {/* Location Badge */}
                        <div className="absolute bottom-3 left-3 bg-white border-2 border-slate-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-none text-[10px] sm:text-[11px] font-black tracking-wide text-slate-900 shadow-[3px_3px_0_0_#0f172a] flex flex-row items-center gap-1.5 uppercase z-10">
                          <MapPin size={12} className="text-cyan-600 drop-shadow-sm shrink-0" /> 
                          <span className="truncate max-w-[100px] sm:max-w-[120px]">{biz.cities?.name || "Local"}</span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 flex flex-col flex-grow relative bg-white">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="text-lg sm:text-xl md:text-2xl font-black leading-tight tracking-tight text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2 uppercase">
                            {biz.name}
                          </h3>
                        </div>

                        <div className="mt-auto pt-4 flex flex-col">
                          <button onClick={() => navigate(`/reserva/${biz.slug}`)} className="w-full bg-cyan-400 border-2 border-slate-900 text-slate-900 text-[12px] sm:text-[13px] font-black py-3 sm:py-4 rounded-none transition-all shadow-[4px_4px_0_0_#0f172a] hover:bg-cyan-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none uppercase tracking-widest flex items-center justify-center cursor-pointer">
                            Ver turnos
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {!loading && filteredBusinesses.length === 0 && (
                  <div className="col-span-full">
                    <EmptyState 
                      title="No se encontraron resultados" 
                      description="Intenta con otros términos o cambia la categoría seleccionada."
                    />
                  </div>
                )}
                {loading && (
                  <>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* INTERACTIVE MAP ASIDE */}
          <aside className="w-full xl:w-[480px] hidden xl:block shrink-0 sticky top-28 h-[calc(100vh-140px)] self-start z-0">
            <div className="bg-white border-4 border-slate-900 rounded-none p-5 h-full shadow-[12px_12px_0_0_#0f172a] flex flex-col overflow-hidden relative">
              <div className="flex items-center justify-between mb-4 px-2 shrink-0 border-b-4 border-yellow-400 pb-2 inline-block self-start">
                <h3 className="font-black text-xl uppercase flex items-center gap-2 text-slate-900">
                  <MapIcon className="text-cyan-600" size={24} strokeWidth={3} /> Explorar Mapa
                </h3>
              </div>

              <div className="flex-1 rounded-none relative overflow-hidden bg-slate-100 border-4 border-slate-900 shadow-inner">
                <MapContainer
                  center={[-34.6037, -58.3816]}
                  zoom={5}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                  attributionControl={false}
                >
                  <RecenterMap businesses={filteredBusinesses} userLocation={userLocation} />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  {filteredBusinesses.map((biz) => {
                    if (!biz.lat || !biz.lon) return null;
                    const isHovered = hoveredBizId === biz.id;
                    const markerIcon = L.divIcon({
                      className:
                        "custom-leaflet-marker bg-transparent border-0",
                      html: `<div class="w-8 h-8 rounded-none shadow-[4px_4px_0_0_#0f172a] border-4 border-slate-900 flex items-center justify-center transition-all duration-300 ease-out origin-center ${isHovered ? "bg-yellow-400 scale-[1.3] -rotate-6 z-50" : "bg-cyan-400 scale-100 rotate-3 z-10"}">
                            <span class="text-xs font-black text-slate-900">${biz.name.charAt(0)}</span>
                      </div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                    });

                    return (
                      <Marker
                        key={biz.id}
                        position={[biz.lat, biz.lon]}
                        icon={markerIcon}
                        zIndexOffset={isHovered ? 1000 : 0}
                      >
                        <Tooltip direction="top" offset={[0, -10]} opacity={1} className="brutalist-tooltip bg-white border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0_0_#0f172a] font-black uppercase rounded-none px-2 py-1 text-[10px]">
                          {biz.name}
                        </Tooltip>
                        <Popup
                          className="rounded-none border-0 shadow-none brutalist-popup"
                          closeButton={false}
                        >
                          <div className="text-center p-3 w-56 font-[System-ui] bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] relative -left-3 -top-3">
                            <div className="w-full h-24 mb-3 overflow-hidden border-2 border-slate-900 bg-yellow-400">
                              {biz.logo_url ? (
                                <img
                                  src={biz.logo_url}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                  <Sparkles className="text-slate-900" size={32} />
                                </div>
                              )}
                            </div>
                            <h4 className="font-black text-[16px] mb-1 text-slate-900 leading-tight uppercase">
                              {biz.name}
                            </h4>
                            <p className="text-[11px] text-slate-600 font-bold mb-3 leading-tight line-clamp-2">
                              {biz.cities?.name}
                            </p>
                            <button
                              onClick={() => navigate(`/reserva/${biz.slug}`)}
                              className="w-full bg-cyan-400 border-2 border-slate-900 hover:bg-cyan-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0_0_#0f172a] text-slate-900 text-xs font-black py-2.5 rounded-none transition-all uppercase"
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
        </div>
      </div>
    </div>
  );
}
