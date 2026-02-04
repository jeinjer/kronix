import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- DATOS SIMULADOS (MOCK DATA) ---
const MOCK_PROVINCES = [
  { id: 1, name: 'Buenos Aires' },
  { id: 2, name: 'Catamarca' },
  { id: 3, name: 'Chaco' },
  { id: 4, name: 'Chubut' },
  { id: 5, name: 'CABA' },
  { id: 6, name: 'Córdoba' },
  { id: 7, name: 'Corrientes' },
  { id: 8, name: 'Entre Ríos' },
  { id: 9, name: 'Formosa' },
  { id: 10, name: 'Jujuy' },
  { id: 11, name: 'La Pampa' },
  { id: 12, name: 'La Rioja' },
  { id: 13, name: 'Mendoza' },
  { id: 14, name: 'Misiones' },
  { id: 15, name: 'Neuquén' },
  { id: 16, name: 'Río Negro' },
  { id: 17, name: 'Salta' },
  { id: 18, name: 'San Juan' },
  { id: 19, name: 'San Luis' },
  { id: 20, name: 'Santa Cruz' },
  { id: 21, name: 'Santa Fe' },
  { id: 22, name: 'Santiago del Estero' },
  { id: 23, name: 'Tierra del Fuego' },
  { id: 24, name: 'Tucumán' }
];

const MOCK_CITIES = [
  // Córdoba (ID 6)
  { id: 101, province_id: 6, name: 'Córdoba Capital' },
  { id: 102, province_id: 6, name: 'Villa Carlos Paz' },
  { id: 103, province_id: 6, name: 'Villa María' },
  { id: 104, province_id: 6, name: 'Río Cuarto' },
  { id: 105, province_id: 6, name: 'Alta Gracia' },
  
  // Buenos Aires (ID 1)
  { id: 201, province_id: 1, name: 'La Plata' },
  { id: 202, province_id: 1, name: 'Mar del Plata' },
  { id: 203, province_id: 1, name: 'Bahía Blanca' },

  // CABA (ID 5)
  { id: 301, province_id: 5, name: 'Capital Federal' },

  // Santa Fe (ID 21)
  { id: 401, province_id: 21, name: 'Rosario' },
  { id: 402, province_id: 21, name: 'Santa Fe Capital' },
];

export default function LocationStep({ formData, setFormData }) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  // 1. Cargar Provincias
  useEffect(() => {
    setProvinces(MOCK_PROVINCES);
  }, []);

  // 2. Filtrar Ciudades cuando cambia la Provincia
  useEffect(() => {
    if (!formData.provinceId) {
        setCities([]);
        return;
    }
    const filteredCities = MOCK_CITIES.filter(c => c.province_id === parseInt(formData.provinceId));
    setCities(filteredCities);
  }, [formData.provinceId]);

  // Handler de cambio de ciudad
  const handleCityChange = (e) => {
      const cityId = e.target.value;
      const selectedCity = cities.find(c => c.id === parseInt(cityId));
      
      setFormData({ 
          ...formData, 
          cityId: cityId, 
          city: selectedCity ? selectedCity.name : '' 
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col gap-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Sede Operativa</h2>
        <p className="text-slate-400">¿Dónde se encuentra ubicado tu negocio?</p>
      </div>

      <div className="space-y-5">
          
          <div className="grid grid-cols-2 gap-5">
              {/* Provincia Dropdown */}
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provincia</label>
                  <div className="relative">
                    <select 
                        value={formData.provinceId || ''}
                        onChange={(e) => setFormData({...formData, provinceId: e.target.value, cityId: '', city: ''})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                    >
                        <option value="">Seleccionar...</option>
                        {provinces.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-4 pointer-events-none text-slate-500 text-xs">▼</div>
                  </div>
              </div>

              {/* Ciudad Dropdown */}
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ciudad</label>
                  <div className="relative">
                    <select 
                        value={formData.cityId || ''}
                        onChange={handleCityChange}
                        disabled={!formData.provinceId}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer disabled:opacity-50"
                    >
                        <option value="">Seleccionar...</option>
                        {cities.length > 0 ? (
                            cities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))
                        ) : (
                            <option disabled>Selecciona una provincia</option>
                        )}
                    </select>
                    <div className="absolute right-3 top-4 pointer-events-none text-slate-500 text-xs">▼</div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
              {/* Calle (Texto Libre) */}
              <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calle</label>
                  <input 
                    type="text" 
                    value={formData.street}
                    onChange={(e) => setFormData({...formData, street: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-700"
                    placeholder="Ej. Av. San Martín"
                  />
              </div>

              {/* Altura */}
              <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Altura</label>
                  <input 
                      type="text" 
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                      placeholder="Ej. 1234"
                  />
              </div>
          </div>

      </div>
    </motion.div>
  );
}