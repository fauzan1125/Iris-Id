"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  isSimulated: boolean;
}

// Koordinat Default Kantor Pusat (Jakarta HQ) untuk fallback dev/testing
const DEFAULT_OFFICE_LAT = -6.175392;
const DEFAULT_OFFICE_LON = 106.827153;

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocationState>({
    latitude: DEFAULT_OFFICE_LAT,
    longitude: DEFAULT_OFFICE_LON,
    accuracy: 10,
    error: null,
    loading: true,
    isSimulated: true,
  });

  const setManualOfficeLocation = useCallback(() => {
    setLocation({
      latitude: DEFAULT_OFFICE_LAT,
      longitude: DEFAULT_OFFICE_LON,
      accuracy: 5,
      error: null,
      loading: false,
      isSimulated: true,
    });
  }, []);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: DEFAULT_OFFICE_LAT,
        longitude: DEFAULT_OFFICE_LON,
        accuracy: 10,
        error: "Geolocation tidak didukung oleh browser Anda. Menggunakan koordinat kantor.",
        loading: false,
        isSimulated: true,
      });
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
          isSimulated: false,
        });
      },
      (err) => {
        let errorMsg = "Lokasi GPS belum aktif.";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "Izin GPS ditolak pada browser.";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Waktu GPS habis (menggunakan koordinat kantor).";
        }
        // Fallback agar tombol presensi tidak pernah macet pada laptop/PC
        setLocation({
          latitude: DEFAULT_OFFICE_LAT,
          longitude: DEFAULT_OFFICE_LON,
          accuracy: 15,
          error: `${errorMsg} (Mode Dev: Koordinat Kantor Aktif)`,
          loading: false,
          isSimulated: true,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return { ...location, refreshLocation, setManualOfficeLocation };
}
