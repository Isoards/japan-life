"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { MapSpot, SpotCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<SpotCategory, string> = {
  food: "#ef4444",
  sightseeing: "#f59e0b",
  shopping: "#8b5cf6",
  daily: "#10b981",
  work: "#3b82f6",
  other: "#6b7280",
};

const CATEGORY_LABELS: Record<SpotCategory, string> = {
  food: "F",
  sightseeing: "S",
  shopping: "SH",
  daily: "D",
  work: "W",
  other: "?",
};

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

function createMarkerIcon(category: SpotCategory): string {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="14" r="8" fill="white" fill-opacity="0.3"/><text x="14" y="14" text-anchor="middle" dominant-baseline="central" fill="white" font-size="9" font-weight="bold" font-family="Arial,sans-serif">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createTempMarkerIcon(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#ef4444" stroke="white" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const CATEGORY_EMOJI: Record<SpotCategory, string> = {
  food: "🍜",
  sightseeing: "⛩️",
  shopping: "🛍️",
  daily: "🏪",
  work: "💼",
  other: "📌",
};

interface GoogleMapViewProps {
  center: { lat: number; lng: number };
  spots: MapSpot[];
  onMapClick?: (lat: number, lng: number) => void;
  clickedPosition?: { lat: number; lng: number } | null;
}

export default function GoogleMapView({ center, spots, onMapClick, clickedPosition }: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const tempMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }, []);

  const addSpotMarkers = useCallback((map: google.maps.Map, spotsToMark: MapSpot[]) => {
    clearMarkers();
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
    const iw = infoWindowRef.current;

    spotsToMark.forEach((spot) => {
      const marker = new google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lng },
        map,
        title: spot.name,
        icon: {
          url: createMarkerIcon(spot.category),
          scaledSize: new google.maps.Size(28, 40),
          anchor: new google.maps.Point(14, 40),
        },
      });

      marker.addListener("click", () => {
        const emoji = CATEGORY_EMOJI[spot.category];
        iw.setContent(
          `<div style="color:#1a1a2e;font-family:sans-serif;max-width:200px">` +
          `<div style="font-weight:600;font-size:14px;margin-bottom:4px">${emoji} ${spot.name}</div>` +
          (spot.memo ? `<div style="font-size:12px;color:#555;margin-bottom:2px">${spot.memo}</div>` : "") +
          (spot.date ? `<div style="font-size:11px;color:#888">${spot.date}</div>` : "") +
          (spot.address ? `<div style="font-size:11px;color:#888;margin-top:2px">${spot.address}</div>` : "") +
          `</div>`
        );
        iw.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [clearMarkers]);

  // Initialize map
  useEffect(() => {
    if (!apiKey || apiKey === "사용자_API_키" || !mapRef.current) return;

    setOptions({ key: apiKey, v: "weekly" });

    importLibrary("maps").then(() => {
      if (!mapRef.current) return;
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        styles: DARK_MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      if (onMapClick) {
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          onMapClick(e.latLng.lat(), e.latLng.lng());
        });
      }

      setMapReady(true);
    }).catch((err: Error) => {
      console.error("Google Maps load error:", err);
      setError(err.message || "Google Maps API 로드 실패");
    });

    return () => {
      clearMarkers();
      tempMarkerRef.current?.setMap(null);
      mapInstanceRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Update center when area changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(center);
    }
  }, [center]);

  // Update markers when spots change or map becomes ready
  useEffect(() => {
    if (mapReady && mapInstanceRef.current) {
      addSpotMarkers(mapInstanceRef.current, spots);
    }
  }, [spots, addSpotMarkers, mapReady]);

  // Show/update temp marker for clicked position
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (clickedPosition) {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setPosition(clickedPosition);
      } else {
        tempMarkerRef.current = new google.maps.Marker({
          position: clickedPosition,
          map: mapInstanceRef.current,
          icon: {
            url: createTempMarkerIcon(),
            scaledSize: new google.maps.Size(20, 20),
            anchor: new google.maps.Point(10, 10),
          },
          zIndex: 999,
        });
      }
    } else {
      tempMarkerRef.current?.setMap(null);
      tempMarkerRef.current = null;
    }
  }, [clickedPosition]);

  if (!apiKey || apiKey === "사용자_API_키") {
    return (
      <div className="rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-white/5" style={{ height: "450px" }}>
        <div className="text-center p-6">
          <p className="text-gray-400 mb-2">Google Maps API 키가 설정되지 않았습니다</p>
          <p className="text-gray-500 text-sm">
            <code className="bg-white/10 px-2 py-0.5 rounded">.env.local</code> 파일에{" "}
            <code className="bg-white/10 px-2 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>를 설정하세요
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 overflow-hidden flex items-center justify-center bg-red-500/5" style={{ height: "450px" }}>
        <div className="text-center p-6">
          <p className="text-red-400 mb-2">Google Maps 로드 실패</p>
          <p className="text-red-400/70 text-sm mb-3">{error}</p>
          <p className="text-gray-500 text-xs">Google Cloud Console에서 Maps JavaScript API가 활성화되어 있는지 확인하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="rounded-xl border border-white/10 overflow-hidden"
      style={{ height: "450px", width: "100%" }}
    />
  );
}
