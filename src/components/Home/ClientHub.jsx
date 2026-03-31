import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Map as MapIcon,
  Star,
  Filter,
  Sparkles,
  Navigation,
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

function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], map.getZoom(), { animate: true });
    }
  }, [lat, lon, map]);
  return null;
}

export default function ClientHub() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const [businesses, setBusinesses] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }
    fetchBiz();
  }, [searchQuery, activeCategory, userLocation?.provinceId, userLocation?.cityId]);

  const dynamicCategories = useMemo(() => {
    const defaultImage =
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop";

    return allCategories.map((c) => ({
      id: c.id,
      label: c.name,
      image: c.image_url || defaultImage,
    }));
  }, [allCategories]);

  const filteredBusinesses = businesses;

  return (
    <div className="min-h-screen bg-white text-slate-900 -mt-24 pt-[104px] pb-16 px-4 md:px-8 font-sans transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto min-h-screen">
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 mt-0 relative">
          {/* MAIN CONTENT AREA */}
          <div className="flex-1 w-full min-w-0 pb-12">
            {/* CATEGORIES HORIZONTAL SCROLL / WRAP */}
            <section className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-[28px] font-black tracking-tight text-slate-900 mb-4">
                Explora por rubro
              </h2>
              <div className="flex flex-wrap justify-start gap-4 pb-4 px-1">
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
                      className={`min-w-[85px] w-[85px] h-[100px] md:min-w-[100px] md:w-[100px] md:h-[115px] flex flex-col items-center justify-center gap-2 md:gap-3 rounded-[1.2rem] shadow-sm transition-all border ${
                        isActive
                          ? "bg-slate-100 border-transparent scale-95 opacity-80"
                          : "bg-white border-slate-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shadow-sm border-2 ${isActive ? "border-cyan-500" : "border-slate-100"}`}
                      >
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className={`text-[11px] md:text-xs font-black tracking-tight text-center leading-tight ${isActive ? "text-cyan-600" : "text-slate-800"}`}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SECTIONS & BUSINESS GRID */}
            <section className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl md:text-[28px] font-black tracking-tight text-slate-900">
                  {searchQuery
                    ? `Resultados para "${searchQuery}"`
                    : "Descubrí estas opciones"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-x-6 md:gap-y-8">
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
                      whileHover={{ y: -4 }}
                      onMouseEnter={() => setHoveredBizId(biz.id)}
                      onMouseLeave={() => setHoveredBizId(null)}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-[1.2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col h-full relative"
                    >
                      <div className="relative h-40 md:h-44 overflow-hidden bg-slate-100">
                        {biz.logo_url ? (
                          <img
                            src={biz.logo_url}
                            alt={biz.name}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Sparkles size={40} />
                          </div>
                        )}

                        {/* Promo Badges overlays */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                          {isNew && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-sm shadow-sm uppercase flex items-center gap-1">
                              <Star size={10} className="fill-emerald-800" />{" "}
                              Nuevo
                            </span>
                          )}
                        </div>

                        {/* Location Badge */}
                        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide text-slate-800 shadow-sm flex flex-row items-center gap-1.5 uppercase z-10">
                          <MapPin size={12} className="text-cyan-600 drop-shadow-sm" /> 
                          <span className="truncate max-w-[120px]">{biz.cities?.name || "Local"}</span>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-grow relative bg-white">

                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="text-base md:text-[18px] font-black leading-tight tracking-tight text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                            {biz.name}
                          </h3>
                        </div>

                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-3 pt-0.5">
                          {biz.industry || "Servicio"}
                        </p>

                        <div className="mt-auto pt-4 flex flex-col">
                          <button onClick={() => navigate(`/reserva/${biz.slug}`)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-[13px] font-black py-3 rounded-xl transition-all shadow-sm active:scale-95 duration-200 uppercase tracking-widest flex items-center justify-center cursor-pointer">
                            Ver turnos
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {!loading && filteredBusinesses.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold mb-2">
                      No se encontraron resultados
                    </h3>
                    <p>
                      Intenta con otros términos o cambia la categoría
                      seleccionada.
                    </p>
                  </div>
                )}
                {loading && (
                  <div className="col-span-full py-20 text-center text-slate-500 animate-pulse font-bold">
                    Cargando locales...
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* INTERACTIVE MAP ASIDE */}
          <aside className="w-full xl:w-[420px] hidden xl:block shrink-0 sticky top-24 h-[calc(100vh-120px)] self-start z-0">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-4 h-full shadow-sm flex flex-col overflow-hidden relative drop-shadow-sm">
              <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <MapIcon className="text-cyan-600" /> Vista en Mapa
                </h3>
              </div>

              <div className="flex-1 rounded-[1.2rem] relative overflow-hidden bg-slate-100 border border-slate-200">
                <MapContainer
                  center={
                    businesses.length > 0 && businesses[0].lat && businesses[0].lon
                      ? [businesses[0].lat, businesses[0].lon]
                      : [-34.6037, -58.3816]
                  }
                  zoom={13}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                >
                  {businesses.length > 0 && businesses[0].lat && businesses[0].lon && (
                    <RecenterMap
                      lat={businesses[0].lat}
                      lon={businesses[0].lon}
                    />
                  )}
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
                      html: `<div class="w-6 h-6 rounded-full shadow-md border-2 border-white flex items-center justify-center transition-all duration-300 ease-out origin-center ${isHovered ? "bg-cyan-500 scale-[1.3]" : "bg-cyan-600 scale-100"}"></div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    });

                    return (
                      <Marker
                        key={biz.id}
                        position={[biz.lat, biz.lon]}
                        icon={markerIcon}
                        zIndexOffset={isHovered ? 1000 : 0}
                      >
                        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                          <span className="font-bold font-sans tracking-tight">{biz.name}</span>
                        </Tooltip>
                        <Popup
                          className="rounded-2xl border-0 shadow-xl"
                          closeButton={false}
                        >
                          <div className="text-center p-2 w-48 font-sans">
                            <div className="w-16 h-16 rounded-xl mx-auto mb-3 overflow-hidden shadow-sm border border-slate-100">
                              {biz.logo_url ? (
                                <img
                                  src={biz.logo_url}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                  <Sparkles className="text-slate-300" />
                                </div>
                              )}
                            </div>
                            <h4 className="font-black text-[15px] mb-0.5 text-slate-900 leading-tight">
                              {biz.name}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                              {biz.industry}
                            </p>
                            <p className="text-[11px] text-slate-600 font-medium mb-3 leading-tight line-clamp-2">
                              {biz.cities?.name}
                            </p>
                            <button
                              onClick={() => navigate(`/reserva/${biz.slug}`)}
                              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-sm active:scale-95"
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
