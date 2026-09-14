// Location context — manages active café location
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locationQueries } from '../services/queries.js';
import { settingsQueries } from '../services/queries.js';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [activeLocation, setActiveLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [sessionOpenedAt, setSessionOpenedAt] = useState(null);

  const refreshLocations = useCallback(() => {
    const locs = locationQueries.getActive();
    setLocations(locs);
    return locs;
  }, []);

  useEffect(() => {
    refreshLocations();

    // Restore active location from session
    const savedLoc = sessionStorage.getItem('makna_location');
    const savedOpenedAt = sessionStorage.getItem('makna_opened_at');
    if (savedLoc) {
      try {
        const loc = JSON.parse(savedLoc);
        setActiveLocation(loc);
        if (savedOpenedAt) {
          setSessionOpenedAt(savedOpenedAt);
        }
      } catch {
        sessionStorage.removeItem('makna_location');
      }
    }
  }, [refreshLocations]);

  const selectLocation = useCallback((location) => {
    const now = new Date().toISOString();
    setActiveLocation(location);
    setSessionOpenedAt(now);
    sessionStorage.setItem('makna_location', JSON.stringify(location));
    sessionStorage.setItem('makna_opened_at', now);
  }, []);

  const clearLocation = useCallback(() => {
    setActiveLocation(null);
    setSessionOpenedAt(null);
    sessionStorage.removeItem('makna_location');
    sessionStorage.removeItem('makna_opened_at');
  }, []);

  const addLocation = useCallback((name, address, extra = {}) => {
    const newId = locationQueries.create(name, address, extra);
    refreshLocations();
    return newId;
  }, [refreshLocations]);

  const updateLocation = useCallback((id, name, address, extra = {}) => {
    locationQueries.update(id, name, address, extra);
    refreshLocations();
    // Update active if changed
    if (activeLocation && activeLocation.id === id) {
      const updated = locationQueries.getById(id) || { ...activeLocation, name, address, ...extra };
      setActiveLocation(updated);
      sessionStorage.setItem('makna_location', JSON.stringify(updated));
    }
  }, [activeLocation, refreshLocations]);

  const deleteLocation = useCallback((id) => {
    locationQueries.delete(id);
    if (activeLocation && activeLocation.id === id) {
      clearLocation();
    }
    refreshLocations();
  }, [activeLocation, clearLocation, refreshLocations]);

  return (
    <LocationContext.Provider value={{
      activeLocation,
      locations,
      sessionOpenedAt,
      selectLocation,
      clearLocation,
      addLocation,
      updateLocation,
      deleteLocation,
      refreshLocations,
      hasLocation: !!activeLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}

export default LocationContext;
