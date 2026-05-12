import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import {
  getProvinces,
  getCitiesByProvince,
} from "../../supabase/services/locations";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to dynamically recenter the map
function RecenterMap({ lat, lng, zoomLevel }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoomLevel || 15, { duration: 0.8 });
    }
  }, [lat, lng, map, zoomLevel]);
  return null;
}

function MapEvents({ setFormData }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      setFormData((prev) => ({ ...prev, lat: center.lat, lng: center.lng }));
    },
  });
  return null;
}

export default function LocationStep({ formData, setFormData }) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [mapZoom, setMapZoom] = useState(16);
  const [mapCenter, setMapCenter] = useState(null);

  // Local state for the inputs to allow typing
  const [provinceInput, setProvinceInput] = useState("");
  const [cityInput, setCityInput] = useState("");

  useEffect(() => {
    if (formData.provinceId) {
      const p = provinces.find((p) => p.id == formData.provinceId);
      if (p) setProvinceInput(p.name);
    }
  }, [formData.provinceId, provinces]);

  useEffect(() => {
    if (formData.city) {
      setCityInput(formData.city);
    }
  }, [formData.city]);

  // Load Provinces
  useEffect(() => {
    const loadProvinces = async () => {
      const { data } = await getProvinces();
      if (data) setProvinces(data);
      setLoadingProvinces(false);
    };
    loadProvinces();
  }, []);

  // Load Cities when Province changes
  useEffect(() => {
    if (!formData.provinceId) {
      setCities([]);
      return;
    }
    const loadCities = async () => {
      const { data } = await getCitiesByProvince(formData.provinceId);
      if (data) setCities(data);
    };
    loadCities();
  }, [formData.provinceId]);

  // Geocoding logic: runs when address parts change
  useEffect(() => {
    const fetchCoords = async () => {
      const p = provinces.find((prov) => prov.id == formData.provinceId);
      const provinceName = p ? p.name : "";
      const cityName = formData.city || "";
      const street = formData.street || "";
      const number = formData.number || "";

      if (provinceName) {
        try {
          const parts = [];
          if (street) parts.push(`${street} ${number}`.trim());
          if (cityName) parts.push(cityName);
          parts.push(provinceName);
          parts.push("Argentina");

          const query = parts.join(", ");
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            
            // Dynamic zoom logic based on precision
            let newZoom = 13;
            if (street && number) newZoom = 18; // Very close for exact street number
            else if (street) newZoom = 16; // Close for street
            else if (cityName) newZoom = 14; // City view
            else if (provinceName) newZoom = 8; // Province view
            
            setMapZoom(newZoom);
            setMapCenter({ lat, lng });
            setFormData(prev => ({ ...prev, lat, lng }));
          }
        } catch(e) {
          console.error("Geocoding error", e);
        }
      }
    };
    
    // debounce to avoid spamming the geocoder API
    const timeoutId = setTimeout(fetchCoords, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.street, formData.number, formData.city, formData.provinceId, provinces, setFormData]);

  const handleProvinceInputChange = (e) => {
    const val = e.target.value;
    setProvinceInput(val);
    const matched = provinces.find((p) => p.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      setFormData((prev) => ({ ...prev, provinceId: matched.id, cityId: "", city: "" }));
      setCityInput("");
    } else {
      setFormData((prev) => ({ ...prev, provinceId: "", cityId: "", city: "" }));
      setCityInput("");
    }
  };

  const handleProvinceFocus = () => {
    setProvinceInput("");
  };

  const handleProvinceBlur = () => {
    if (formData.provinceId) {
      const p = provinces.find((p) => p.id == formData.provinceId);
      if (p) setProvinceInput(p.name);
    } else {
      setProvinceInput("");
    }
  };

  const handleCityInputChange = (e) => {
    const val = e.target.value;
    setCityInput(val);
    const matched = cities.find((c) => c.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      setFormData((prev) => ({ ...prev, cityId: matched.id, city: matched.name }));
    } else {
      setFormData((prev) => ({ ...prev, cityId: "", city: "" }));
    }
  };

  const handleCityFocus = () => {
    setCityInput("");
  };

  const handleCityBlur = () => {
    if (formData.cityId) {
      const c = cities.find((c) => c.id == formData.cityId);
      if (c) setCityInput(c.name);
    } else {
      setCityInput("");
    }
  };

  const currentLat = formData.lat || -34.6037;
  const currentLng = formData.lng || -58.3816;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col md:flex-row gap-8"
    >
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
            Sede Operativa
          </h2>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-widest bg-cyan-400 border-2 border-slate-900 inline-block px-2 py-1 shadow-[2px_2px_0_0_#0f172a]">
            ¿Dónde se encuentra ubicado tu negocio?
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {/* Provincia Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-yellow-400 border-2 border-slate-900 inline-block px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a]">
                Provincia
              </label>
              <input
                list="provinces-list"
                value={provinceInput}
                onChange={handleProvinceInputChange}
                onFocus={handleProvinceFocus}
                onBlur={handleProvinceBlur}
                disabled={loadingProvinces}
                placeholder={loadingProvinces ? "Cargando..." : "Ej. Buenos Aires"}
                className="w-full bg-white border-4 border-slate-900 px-4 py-3 text-slate-900 font-black uppercase text-sm focus:outline-none focus:shadow-[4px_4px_0_0_#0f172a] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all disabled:opacity-50"
              />
              <datalist id="provinces-list">
                {provinces.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            {/* Ciudad Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-yellow-400 border-2 border-slate-900 inline-block px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a]">
                Ciudad
              </label>
              <input
                list="cities-list"
                value={cityInput}
                onChange={handleCityInputChange}
                onFocus={handleCityFocus}
                onBlur={handleCityBlur}
                disabled={!formData.provinceId}
                placeholder="Ej. La Plata"
                className="w-full bg-white border-4 border-slate-900 px-4 py-3 text-slate-900 font-black uppercase text-sm focus:outline-none focus:shadow-[4px_4px_0_0_#0f172a] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all disabled:opacity-50"
              />
              <datalist id="cities-list">
                {cities.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Calle */}
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-yellow-400 border-2 border-slate-900 inline-block px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a]">
                Calle
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full bg-white border-4 border-slate-900 px-4 py-3 text-slate-900 font-black uppercase text-sm focus:outline-none focus:shadow-[4px_4px_0_0_#0f172a] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all placeholder:text-slate-400 placeholder:font-bold"
                placeholder="Ej. Av. San Martín"
              />
            </div>

            {/* Altura */}
            <div className="col-span-1 space-y-2">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-yellow-400 border-2 border-slate-900 inline-block px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a]">
                Altura
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
                className="w-full bg-white border-4 border-slate-900 px-4 py-3 text-slate-900 font-black uppercase text-sm focus:outline-none focus:shadow-[4px_4px_0_0_#0f172a] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all placeholder:text-slate-400 placeholder:font-bold"
                placeholder="Ej. 1234"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1 min-h-[300px] border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] bg-slate-100 relative overflow-hidden flex flex-col">
        <div className="bg-yellow-400 border-b-4 border-slate-900 px-3 py-2 flex items-center gap-2 z-10">
          <MapPin size={16} strokeWidth={3} className="text-slate-900" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
            Ajustar Ubicación (Mueve el pin)
          </span>
        </div>
        <div className="flex-1 relative z-0">
          <MapContainer
            center={[currentLat, currentLng]}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap"
            />
            {mapCenter && <RecenterMap lat={mapCenter.lat} lng={mapCenter.lng} zoomLevel={mapZoom} />}
            <MapEvents setFormData={setFormData} />
          </MapContainer>
          
          {/* Fixed Center Pin (Uber Style) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[1000] pb-2">
            <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
              <div className="absolute w-6 h-6 bg-yellow-400 border-[3px] border-slate-900 shadow-[3px_3px_0_0_#0f172a] transform -rotate-6 z-10 flex items-center justify-center transition-transform hover:scale-110">
                 <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
              </div>
              <div className="absolute -bottom-1.5 w-2.5 h-2.5 bg-slate-900 rotate-45 z-0"></div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
