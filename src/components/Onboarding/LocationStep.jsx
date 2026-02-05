import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProvinces, getCitiesByProvince } from '../../supabase/services/locations';

export default function LocationStep({ formData, setFormData }) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  // 1. Cargar Provincias usando el servicio
  useEffect(() => {
    const loadProvinces = async () => {
      const { data } = await getProvinces();
      if (data) setProvinces(data);
      setLoadingProvinces(false);
    };
    loadProvinces();
  }, []);

  // 2. Cargar Ciudades usando el servicio
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
                        disabled={loadingProvinces}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer disabled:opacity-50"
                    >
                        <option value="">{loadingProvinces ? 'Cargando...' : 'Seleccionar...'}</option>
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
              {/* Calle */}
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