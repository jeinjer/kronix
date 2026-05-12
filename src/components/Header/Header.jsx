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
      cit ? cit.name : "",
      cit?.latitude || null,
      cit?.longitude || null
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

  // Do not render brutalist header on auth pages if they have their own, but since we're replacing globally, let's just make it look good.
  return (
    <header className="fixed top-0 w-full z-50 bg-[#f0f3fa] border-b-4 border-slate-900 shadow-[0_4px_0_0_#0f172a] py-2 px-4 transition-colors duration-300 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-y-3 gap-x-4 h-full min-h-[56px]">
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
            className="flex items-center group isolate relative w-24 sm:w-32 h-10 sm:h-12"
          >
            <img src="/logo.png" alt="Kronix Logo" className="absolute left-0 top-1/2 -translate-y-1/2 w-[100px] sm:w-[130px] max-w-none h-auto object-contain" />
          </Link>
        </div>

        {/* CENTER COMPONENT: SEARCH BAR OR BUSINESS LINKS */}
        {isBusinessPage && location.pathname === "/negocios" ? (
          <div className="hidden md:flex flex-1 justify-center space-x-10">
            <a href="#features" className="text-[13px] font-black text-slate-900 hover:text-cyan-500 transition-colors uppercase tracking-widest">Características</a>
            <a href="#client-hub" className="text-[13px] font-black text-slate-900 hover:text-cyan-500 transition-colors uppercase tracking-widest">Portal</a>
            <a href="#whatsapp" className="text-[13px] font-black text-slate-900 hover:text-cyan-500 transition-colors uppercase tracking-widest">Kronia Bot</a>
            <a href="#pricing" className="text-[13px] font-black text-slate-900 hover:text-cyan-500 transition-colors uppercase tracking-widest">Planes</a>
          </div>
        ) : isClientOnly && !isAuthPage && (
          <div className="flex-1 max-w-2xl hidden md:block mx-8 relative" ref={searchDropdownRef}>
            <form onSubmit={handleGlobalSearch} className="relative w-full flex items-center bg-white border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] focus-within:-translate-y-0.5 focus-within:-translate-x-0.5 focus-within:shadow-[6px_6px_0_0_#0f172a] transition-all h-12 z-20 rounded-none">
              
              {/* LOCATION DROPDOWN INSIDE SEARCHBAR */}
              <div className="relative pl-4 pr-3 border-r-4 border-slate-900 h-full flex items-center bg-cyan-300" ref={locationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  className="flex items-center gap-1.5 text-slate-900 hover:text-white text-[13px] font-black tracking-widest uppercase transition-colors"
                >
                  <MapPin size={16} className="shrink-0" strokeWidth={3} />
                  <span className="max-w-[110px] truncate leading-none pt-0.5">
                    {userLocation?.cityName || userLocation?.provinceName || "Todo el país"}
                  </span>
                </button>

                {/* Location Popover */}
                {isLocationDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-[-4px] w-72 md:w-80 bg-white border-4 border-slate-900 rounded-none shadow-[8px_8px_0_0_#0f172a] p-4 animate-in fade-in slide-in-from-top-2 z-50">
                    <h4 className="text-sm font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2">
                       Dónde buscas?
                    </h4>
                    
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Provincia</label>
                        <select
                          value={selectedProvinceId}
                          onChange={(e) => {
                            setSelectedProvinceId(e.target.value);
                            setSelectedCityId("");
                          }}
                          disabled={loadingProvinces}
                          className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-2 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 appearance-none cursor-pointer"
                        >
                          <option value="">{loadingProvinces ? "Cargando..." : "Todas las provincias"}</option>
                          {provinces.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ciudad</label>
                        <select
                          value={selectedCityId}
                          onChange={(e) => setSelectedCityId(e.target.value)}
                          disabled={!selectedProvinceId}
                          className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-2 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Todas las ciudades</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                       <button
                        type="button"
                        onClick={() => {
                          clearLocation();
                          setIsLocationDropdownOpen(false);
                          setSelectedProvinceId("");
                          setSelectedCityId("");
                        }}
                        className="flex-1 text-[11px] uppercase tracking-widest text-slate-900 font-black border-2 border-slate-900 hover:bg-slate-100 rounded-none py-2 flex items-center justify-center transition-colors shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                      >
                         Restablecer
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyLocation}
                        className="flex-1 text-[11px] uppercase tracking-widest text-slate-900 bg-yellow-400 border-2 border-slate-900 font-black hover:bg-yellow-300 rounded-none py-2 flex items-center justify-center gap-1 transition-colors shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
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
                className="flex-1 bg-transparent pl-4 pr-12 py-2 font-black text-[14px] tracking-tight text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-bold border-none h-full"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 border-l-4 border-slate-900 bg-cyan-400 text-slate-900 flex items-center justify-center hover:bg-cyan-300 transition-colors"
              >
                <Search size={18} strokeWidth={3} />
              </button>
            </form>

            {/* SEARCH AUTOCOMPLETE RESULTS */}
            {showResults && searchHeader.trim().length >= 2 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border-4 border-slate-900 rounded-none shadow-[8px_8px_0_0_#0f172a] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {isSearching ? (
                  <div className="p-4 text-center text-sm font-black text-slate-500 uppercase tracking-widest">
                    Buscando coincidencias...
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="divide-y-2 divide-slate-200 max-h-80 overflow-y-auto">
                    {searchResults.map((res) => (
                      <li
                        key={res.id}
                        onClick={() => handleSelectResult(res.slug)}
                        className="flex items-center gap-3 p-3 hover:bg-cyan-100 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 bg-slate-100 border-2 border-slate-900 overflow-hidden shrink-0">
                          {res.logo_url ? (
                            <img src={res.logo_url} alt={res.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-900 font-black text-sm">
                              {res.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-black uppercase tracking-tight text-slate-900 text-sm truncate leading-tight">{res.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{res.industry}</span>
                        </div>
                        {res.cities?.name && (
                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase text-slate-900 bg-yellow-400 border-2 border-slate-900 px-2 py-1 shadow-[2px_2px_0_0_#0f172a]">
                            <MapPin size={10} /> {res.cities.name}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm font-black uppercase tracking-widest text-slate-500">
                    No se encontraron locales.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RIGHT COMPONENT: PROFILE */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
              {session ? (
                <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 border-2 border-slate-900 bg-white hover:bg-cyan-100 transition-colors shadow-[2px_2px_0_0_#0f172a] active:shadow-none active:translate-y-0.5 active:translate-x-0.5"
                  aria-label="Perfil de usuario"
                >
                  <User
                    size={16}
                    strokeWidth={3}
                    className="text-slate-900 group-hover:text-cyan-600 transition-colors"
                  />
                  <span className="hidden sm:block text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-cyan-600 transition-colors">
                    {perfil?.full_name?.split(" ")[0] || "Mi Perfil"}
                  </span>
                  <ChevronRight
                    size={14}
                    strokeWidth={3}
                    className="rotate-90 text-slate-900 group-hover:text-cyan-600 transition-colors"
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-[120%] right-0 w-56 bg-white border-4 border-slate-900 rounded-none shadow-[6px_6px_0_0_#0f172a] overflow-hidden py-0 animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-5 py-3 border-b-4 border-slate-900 mb-1 bg-yellow-400 text-slate-900">
                      {perfil?.full_name && (
                        <p className="text-sm font-black uppercase truncate">
                          {perfil.full_name}
                        </p>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-widest truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    {isSuperAdminEffective ? (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-cyan-100 transition-colors border-b-2 border-slate-200"
                      >
                        Panel de Admin
                      </Link>
                    ) : (
                      <>
                        {isClientOnly ? (
                          <Link
                            to="/mis-turnos"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-cyan-100 transition-colors border-b-2 border-slate-200"
                          >
                            Mis Turnos
                          </Link>
                        ) : (
                          <Link
                            to="/dashboard"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-cyan-100 transition-colors border-b-2 border-slate-200"
                          >
                            Panel de Negocios
                          </Link>
                        )}
                      </>
                    )}

                    <div className="p-3 bg-slate-50">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-center flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-rose-400 text-slate-900 hover:bg-rose-300 shadow-[2px_2px_0_0_#0f172a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
                </>
              ) : (
                !isAuthPage && (
                  <div className="flex items-center gap-3">
                    <Link
                      to={isBusinessPage ? "/" : "/negocios"}
                      className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest border-2 border-slate-900 text-slate-900 bg-white hover:bg-cyan-100 transition-colors shadow-[2px_2px_0_0_#0f172a] active:shadow-none active:-translate-x-[-1px] active:-translate-y-[-1px]"
                    >
                      {isBusinessPage ? <User size={14} strokeWidth={3} /> : <Briefcase size={14} strokeWidth={3} />}
                      <span className="hidden sm:inline">
                        {isBusinessPage ? "Soy Cliente" : "Soy Negocio"}
                      </span>
                    </Link>

                    <Link
                      to={isBusinessPage ? "/negocios/login" : "/login"}
                      className="px-4 py-2 bg-yellow-400 border-2 border-slate-900 text-slate-900 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_0_#0f172a] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0_0_#0f172a] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all whitespace-nowrap"
                    >
                      Ingresar
                    </Link>
                  </div>
                )
              )}
          </div>
        </div>

        {/* MOBILE SEARCH BAR */}
        {isClientOnly && !isAuthPage && (
          <div className="w-full md:hidden mt-2 pb-2">
            <form onSubmit={handleGlobalSearch} className="relative w-full border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] bg-white">
              <input
                type="text"
                value={searchHeader}
                onChange={(e) => setSearchHeader(e.target.value)}
                placeholder="Buscar locales"
                className="w-full pl-4 pr-12 py-3 bg-transparent border-none focus:outline-none font-black text-sm outline-none placeholder:text-slate-400 uppercase tracking-widest"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 border-l-4 border-slate-900 bg-cyan-400 text-slate-900 flex items-center justify-center hover:bg-cyan-300"
              >
                <Search size={16} strokeWidth={3} />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
