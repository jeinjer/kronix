import React, { useState, useEffect, useRef } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { LogOut, User, ChevronRight, MapPin, Search, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { isSuperAdminUser } from "@/utils/superAdmin";
import { getProvinces, getCitiesByProvince } from "@/supabase/services/locations";
import { getExploreOrganizations } from "@/supabase/services/organizations";

export default function Header() {
  const {
    session,
    user,
    perfil,
    logout,
    isSuperAdmin,
    isBusiness,
    isBusinessLoading,
  } = useAuth();
  const isSuperAdminEffective = Boolean(
    isSuperAdmin || isSuperAdminUser({ user, profile: perfil }),
  );
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isClientOnly =
    !isSuperAdminEffective && !isBusiness && !isBusinessLoading;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { userLocation, setManualLocation, clearLocation } = useLocationContext();
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef(null);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  useEffect(() => {
    if (isLocationDropdownOpen && provinces.length === 0) {
      const loadProvinces = async () => {
        setLoadingProvinces(true);
        const { data } = await getProvinces();
        if (data) setProvinces(data);
        setLoadingProvinces(false);
      };
      loadProvinces();
    }
  }, [isLocationDropdownOpen]);

  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      const { data } = await getCitiesByProvince(selectedProvinceId);
      if (data) setCities(data);
    };

    loadCities();
  }, [selectedProvinceId]);

  useEffect(() => {
    if (userLocation) {
      setSelectedProvinceId(userLocation.provinceId || "");
      setSelectedCityId(userLocation.cityId || "");
    }
  }, [userLocation]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setIsLocationDropdownOpen(false);
      }
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Definimos si estamos en una página de autenticación o negocios
  const isAuthPage = location.pathname.includes("/login") || location.pathname.includes("/registro");
  const isBusinessPage = location.pathname.startsWith("/negocios");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleApplyLocation = () => {
    const prov = provinces.find(p => p.id === parseInt(selectedProvinceId));
    const cit = cities.find(c => c.id === parseInt(selectedCityId));
    setManualLocation(
      selectedProvinceId,
      selectedCityId,
      prov ? prov.name : "",
      cit ? cit.name : ""
    );
    setIsLocationDropdownOpen(false);
  };

  const [searchParams] = useSearchParams();
  const [searchHeader, setSearchHeader] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDropdownRef = useRef(null);

  useEffect(() => {
    setSearchHeader(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchHeader.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await getExploreOrganizations({
            searchQuery: searchHeader.trim(),
            provinceId: userLocation?.provinceId || null,
            cityId: userLocation?.cityId || null,
          });
          setSearchResults(data || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchHeader, userLocation]);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    setShowResults(false);
    if (searchHeader.trim()) {
      navigate(`/?q=${encodeURIComponent(searchHeader.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  const handleSelectResult = (slug) => {
    setShowResults(false);
    navigate(`/reserva/${slug}`);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-200 shadow-sm py-2 px-4 transition-colors duration-300">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-y-3 gap-x-4 h-full min-h-[56px]">
        {/* LEFT COMPONENT: LOGO + LOCATION */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            to={
              user
                ? isClientOnly
                  ? "/"
                  : isSuperAdminEffective
                    ? "/admin"
                    : "/dashboard"
                : "/"
            }
            className="flex items-center gap-1.5 group"
          >
            <img
              src="/kronix.png"
              alt="Logo"
              className="w-8 h-8 transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-black tracking-tight text-slate-800 uppercase italic leading-none pt-1">
              Kronix
            </span>
          </Link>

        </div>

        {/* CENTER COMPONENT: SEARCH BAR */}
        {isClientOnly && !isAuthPage && (
          <div className="flex-1 max-w-3xl hidden md:block mx-8 relative" ref={searchDropdownRef}>
            <form onSubmit={handleGlobalSearch} className="relative w-full flex items-center bg-[#f5f5f5] rounded-full border border-transparent focus-within:bg-white focus-within:border-cyan-500/50 focus-within:shadow-sm transition-all h-11 z-20">
              
              {/* LOCATION DROPDOWN INSIDE SEARCHBAR */}
              <div className="relative pl-4 pr-3 border-r border-slate-300 h-full flex items-center" ref={locationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 text-[13px] font-bold tracking-tight transition-colors"
                >
                  <MapPin size={15} className="shrink-0" />
                  <span className="max-w-[110px] truncate leading-none pt-0.5">
                    {userLocation?.cityName || userLocation?.provinceName || "Todo el país"}
                  </span>
                </button>

                {/* Location Popover */}
                {isLocationDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] left-0 w-72 md:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 z-50">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
                      <MapPin size={16} className="text-cyan-600" /> Dónde querés buscar?
                    </h4>
                    
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provincia</label>
                        <select
                          value={selectedProvinceId}
                          onChange={(e) => {
                            setSelectedProvinceId(e.target.value);
                            setSelectedCityId("");
                          }}
                          disabled={loadingProvinces}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                        >
                          <option value="">{loadingProvinces ? "Cargando..." : "Todas las provincias"}</option>
                          {provinces.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ciudad</label>
                        <select
                          value={selectedCityId}
                          onChange={(e) => setSelectedCityId(e.target.value)}
                          disabled={!selectedProvinceId}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Todas las ciudades</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                       <button
                        type="button"
                        onClick={() => {
                          clearLocation();
                          setIsLocationDropdownOpen(false);
                          setSelectedProvinceId("");
                          setSelectedCityId("");
                        }}
                        className="flex-1 text-xs text-slate-500 font-bold hover:text-slate-700 hover:bg-slate-100 rounded-lg py-2 flex items-center justify-center transition-colors border border-transparent"
                      >
                         Restablecer
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyLocation}
                        className="flex-1 text-xs text-white bg-cyan-600 font-bold hover:bg-cyan-500 rounded-lg py-2 flex items-center justify-center gap-1 transition-colors"
                      >
                         Aplicar filtro
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={searchHeader}
                onChange={(e) => {
                  setSearchHeader(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => {
                  if (searchHeader.trim().length >= 2) setShowResults(true);
                }}
                placeholder="Buscar locales"
                className="flex-1 bg-transparent pl-4 pr-12 py-2 font-medium text-[14px] tracking-tight text-slate-800 outline-none placeholder:text-slate-400 h-full"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center hover:bg-cyan-500 transition-colors shadow-sm"
              >
                <Search size={14} strokeWidth={3} />
              </button>
            </form>

            {/* SEARCH AUTOCOMPLETE RESULTS */}
            {showResults && searchHeader.trim().length >= 2 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {isSearching ? (
                  <div className="p-4 text-center text-sm font-bold text-slate-500 animate-pulse">
                    Buscando coincidencias...
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {searchResults.map((res) => (
                      <li
                        key={res.id}
                        onClick={() => handleSelectResult(res.slug)}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {res.logo_url ? (
                            <img src={res.logo_url} alt={res.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                              {res.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-slate-900 text-sm truncate">{res.name}</span>
                          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest truncate">{res.industry}</span>
                        </div>
                        {res.cities?.name && (
                          <div className="shrink-0 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                            <MapPin size={10} /> {res.cities.name}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm font-bold text-slate-500">
                    No se encontraron locales.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RIGHT COMPONENT: PROFILE */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 cursor-pointer group px-3 py-2 rounded-full hover:bg-slate-50 border border-slate-200 transition-colors"
                aria-label="Perfil de usuario"
              >
                <User
                  size={18}
                  className="text-slate-500 group-hover:text-cyan-600 transition-colors"
                />
                <span className="hidden sm:block text-sm font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">
                  {perfil?.full_name?.split(" ")[0] || "Mi Perfil"}
                </span>
                <ChevronRight
                  size={14}
                  className="rotate-90 text-slate-400 group-hover:text-cyan-600 transition-colors"
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-5 py-3 border-b border-slate-100 mb-1 bg-slate-50">
                    {perfil?.full_name && (
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {perfil.full_name}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>

                  {!isClientOnly && (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Mi Negocio
                    </Link>
                  )}
                  <Link
                    to="/mis-turnos"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Mis Turnos
                  </Link>

                  <div className="px-3 pt-2 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shadow-sm"
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isAuthPage && (
              <div className="flex items-center gap-2 sm:gap-3 ml-2">
                <Link
                  to={isBusinessPage ? "/" : "/negocios"}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-cyan-600 transition-all shadow-sm"
                >
                  {isBusinessPage ? <User size={14} /> : <Briefcase size={14} />}
                  <span className="hidden sm:inline">
                    {isBusinessPage ? "Soy Cliente" : "Soy Negocio"}
                  </span>
                </Link>

                <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-1"></div>

                <Link
                  to={isBusinessPage ? "/negocios/login" : "/login"}
                  className="text-sm font-bold text-slate-700 hover:text-cyan-600 transition-colors px-2 hidden sm:block"
                >
                  Ingresar
                </Link>
                <Link
                  to={isBusinessPage ? "/negocios/registro" : "/registro"}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md whitespace-nowrap"
                >
                  Registrarme
                </Link>
              </div>
            )
          )}
        </div>

        {/* MOBILE SEARCH BAR */}
        {isClientOnly && !isAuthPage && (
          <div className="w-full md:hidden mt-1 pb-1">
            <form onSubmit={handleGlobalSearch} className="relative w-full">
              <input
                type="text"
                value={searchHeader}
                onChange={(e) => setSearchHeader(e.target.value)}
                placeholder="Buscar locales"
                className="w-full pl-5 pr-12 py-2.5 rounded-full bg-[#f5f5f5] border border-transparent focus:bg-white focus:border-cyan-500/50 transition-all text-sm outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center hover:bg-cyan-500"
              >
                <Search size={14} strokeWidth={3} />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
