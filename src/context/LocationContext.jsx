import React, { createContext, useContext, useState, useEffect } from "react";

const LocationContext = createContext({});

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null);

  // Load from local storage on mount
  useEffect(() => {
    const storedLoc = localStorage.getItem("kronix_user_location_v2");
    if (storedLoc) {
      try {
        setUserLocation(JSON.parse(storedLoc));
      } catch (e) {
        console.error("Error parsing stored location:", e);
      }
    }
  }, []);

  const saveLocation = (locationObj) => {
    setUserLocation(locationObj);
    localStorage.setItem("kronix_user_location_v2", JSON.stringify(locationObj));
  };

  const clearLocation = () => {
    setUserLocation(null);
    localStorage.removeItem("kronix_user_location_v2");
  };

  const setManualLocation = (provinceId, cityId, provinceName, cityName) => {
    if (!provinceId && !cityId) {
      clearLocation();
      return;
    }
    saveLocation({ provinceId, cityId, provinceName, cityName });
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        setManualLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocationContext = () => useContext(LocationContext);
