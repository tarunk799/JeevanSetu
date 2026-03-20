"use client";

import { useState } from "react";

interface Hospital {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  rating?: number;
}

export default function HospitalFinder() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  function handleFindHospitals() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);
    setHospitals([]);
    setSearched(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `/api/hospitals?lat=${latitude}&lng=${longitude}`
          );
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(
              body.error || `Request failed with status ${res.status}`
            );
          }
          const data = await res.json();
          setHospitals(data.hospitals ?? []);
          setSearched(true);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch nearby hospitals."
          );
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(
              "Location permission denied. Please allow location access and try again."
            );
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case geoError.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred while getting your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <section
      aria-labelledby="em-hospitals"
      className="bg-blue-900/30 border border-blue-800 rounded-xl p-5"
    >
      <h2
        id="em-hospitals"
        className="text-lg font-bold text-blue-400 uppercase tracking-wide mb-3"
      >
        Nearby Hospitals
      </h2>

      <button
        onClick={handleFindHospitals}
        disabled={loading}
        aria-label="Find nearby hospitals using your current location"
        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-emergency-bg"
      >
        {loading ? "Searching..." : "Find Nearby Hospitals"}
      </button>

      {/* Live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && "Searching for nearby hospitals..."}
        {error && `Error: ${error}`}
        {searched &&
          !error &&
          hospitals.length === 0 &&
          "No hospitals found nearby."}
        {searched &&
          hospitals.length > 0 &&
          `Found ${hospitals.length} nearby hospitals.`}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div
            className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"
            aria-hidden="true"
          />
          <span className="ml-3 text-gray-400">
            Getting your location and searching...
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {searched && !error && hospitals.length === 0 && (
        <p className="mt-4 text-gray-400 text-center">
          No hospitals found nearby. Try expanding your search area.
        </p>
      )}

      {hospitals.length > 0 && (
        <ul className="mt-4 space-y-3" aria-label="List of nearby hospitals">
          {hospitals.map((hospital, index) => (
            <li
              key={index}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-white truncate">
                    {hospital.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {hospital.address}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {hospital.rating != null && (
                      <span
                        className="text-yellow-400 text-sm"
                        aria-label={`Rating: ${hospital.rating} out of 5`}
                      >
                        {"★"} {hospital.rating.toFixed(1)}
                      </span>
                    )}
                    {hospital.phone && (
                      <a
                        href={`tel:${hospital.phone}`}
                        className="text-green-400 hover:text-green-300 text-sm underline transition-colors"
                        aria-label={`Call ${hospital.name} at ${hospital.phone}`}
                      >
                        {hospital.phone}
                      </a>
                    )}
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Get directions to ${hospital.name}`}
                  className="flex-shrink-0 bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-emergency-bg"
                >
                  Directions
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
