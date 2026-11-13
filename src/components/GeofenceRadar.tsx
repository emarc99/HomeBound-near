"use client";

import { useState } from "react";

type RadarPreset = "live" | "lintel-pass" | "lagos-spoof";

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function GeofenceRadar({
  siteLat = 7.437,
  siteLng = 3.947,
  radiusMeters = 150,
  photoLat,
  photoLng,
  photoLabel,
  takenAt,
}: {
  siteLat?: number;
  siteLng?: number;
  radiusMeters?: number;
  photoLat?: number | null;
  photoLng?: number | null;
  photoLabel?: string | null;
  takenAt?: string | null;
}) {
  const hasLive = photoLat != null && photoLng != null;
  const [preset, setPreset] = useState<RadarPreset>(hasLive ? "live" : "lintel-pass");

  const activePoint =
    preset === "live" && hasLive
      ? { lat: photoLat, lng: photoLng, label: photoLabel ?? "Latest submission", time: takenAt }
      : preset === "lagos-spoof"
        ? {
            lat: 6.4474,
            lng: 3.4722,
            label: "Lagos spoof test (off-site)",
            time: "2026-11-03T14:10:00Z",
          }
        : {
            lat: 7.4371,
            lng: 3.9471,
            label: "Akobo Plot IB-04 sample",
            time: "2026-11-04T13:45:00Z",
          };

  const distance = haversineMeters(siteLat, siteLng, activePoint.lat, activePoint.lng);
  const inside = distance <= radiusMeters;

  // Map lat/lng delta onto radar SVG centered at (280, 140), outer ring r=105 => radiusMeters.
  let pinX = 280;
  let pinY = 140;
  const maxVisualR = 105;
  if (inside) {
    const scale = maxVisualR / radiusMeters;
    const dxMeters = (activePoint.lng - siteLng) * 111_320 * Math.cos((siteLat * Math.PI) / 180);
    const dyMeters = (activePoint.lat - siteLat) * 110_540;
    pinX = Math.max(185, Math.min(375, 280 + dxMeters * scale));
    pinY = Math.max(45, Math.min(235, 140 - dyMeters * scale));
  } else {
    // Clamp off-site vector onto outer warning perimeter along true bearing
    const angle = Math.atan2(-(activePoint.lat - siteLat), activePoint.lng - siteLng);
    pinX = 280 + Math.cos(angle) * 124;
    pinY = 140 + Math.sin(angle) * 108;
  }

  const accent = inside ? "#10b981" : "#ef4444";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
          {hasLive && (
            <button
              type="button"
              onClick={() => setPreset("live")}
              className={`cursor-pointer rounded border px-2.5 py-1 transition ${
                preset === "live"
                  ? "border-pepper bg-pepper/20 text-[#f4f0e8]"
                  : "border-blueprint-line bg-blueprint-card text-[#a7b3c2] hover:text-white"
              }`}
            >
              Active Stage EXIF
            </button>
          )}
          <button
            type="button"
            onClick={() => setPreset("lintel-pass")}
            className={`cursor-pointer rounded border px-2.5 py-1 transition ${
              preset === "lintel-pass"
                ? "border-radar bg-radar/20 text-mint"
                : "border-blueprint-line bg-blueprint-card text-[#a7b3c2] hover:text-white"
            }`}
          >
            Akobo Sample (15m · PASS)
          </button>
          <button
            type="button"
            onClick={() => setPreset("lagos-spoof")}
            className={`cursor-pointer rounded border px-2.5 py-1 transition ${
              preset === "lagos-spoof"
                ? "border-red-400 bg-red-500/20 text-red-200"
                : "border-blueprint-line bg-blueprint-card text-[#a7b3c2] hover:text-white"
            }`}
          >
            Lagos Spoof (121.6 km · BLOCK)
          </button>
        </div>

        <span
          className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase ${
            inside ? "bg-radar/20 text-mint" : "bg-red-500/20 text-red-200"
          }`}
        >
          {inside ? `Inside ${radiusMeters}m Fence` : "Geofence Violation"}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-blueprint-line bg-[#09111c]">
        <svg viewBox="0 0 560 280" className="block h-auto w-full" role="img" aria-label="Plot IB-04 Geofence Radar">
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
              <stop offset="70%" stopColor={accent} stopOpacity="0.06" />
              <stop offset="100%" stopColor="#09111c" stopOpacity="0" />
            </radialGradient>
            <pattern id="cadGrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#18273c" strokeWidth="0.7" />
            </pattern>
          </defs>

          {/* Background CAD grid & Akobo road vectors */}
          <rect width="560" height="280" fill="url(#cadGrid)" />
          <g stroke="#20324a" strokeWidth="1.2" fill="none" opacity="0.85">
            <path d="M 0 182 Q 150 165 280 140 T 560 95" strokeWidth="2.4" stroke="#283d58" />
            <path d="M 190 0 L 235 280" />
            <path d="M 355 0 L 320 280" />
            <path d="M 70 85 C 165 72, 230 118, 340 102 S 470 55, 560 72" strokeDasharray="4 4" />
            <rect x="242" y="108" width="76" height="64" rx="2" stroke="#d4882a" strokeWidth="1" strokeDasharray="3 2" opacity="0.65" />
          </g>

          <text x="16" y="22" fill="#71849c" fontSize="9.5" fontFamily="monospace" letterSpacing="1.2">
            AKOBO, IBADAN · PLOT IB-04 TELEMETRY RADAR
          </text>
          <text x="410" y="22" fill="#71849c" fontSize="9.5" fontFamily="monospace">
            RADIUS: {radiusMeters}M
          </text>

          {/* Radar glow & concentric geofence circles */}
          <circle cx="280" cy="140" r={maxVisualR} fill="url(#radarGlow)" />
          <circle cx="280" cy="140" r="35" fill="none" stroke="#28415e" strokeWidth="1" />
          <circle cx="280" cy="140" r="70" fill="none" stroke="#28415e" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="280" cy="140" r={maxVisualR} fill="none" stroke={accent} strokeWidth="1.5" opacity="0.85" />

          {/* Crosshair axes */}
          <line x1="150" y1="140" x2="410" y2="140" stroke="#243852" strokeWidth="0.9" />
          <line x1="280" y1="22" x2="280" y2="258" stroke="#243852" strokeWidth="0.9" />

          {/* Plot center target */}
          <circle cx="280" cy="140" r="3.5" fill="#d4882a" />
          <text x="288" y="152" fill="#d4882a" fontSize="8.5" fontFamily="monospace">
            SITE CENTER
          </text>

          {/* Distance vector from center to EXIF coordinate pin */}
          <line
            x1="280"
            y1="140"
            x2={pinX}
            y2={pinY}
            stroke={accent}
            strokeWidth="1.5"
            strokeDasharray={inside ? "2 2" : "5 3"}
          />

          {/* Active EXIF pin */}
          <circle cx={pinX} cy={pinY} r="11" fill={accent} opacity="0.22" />
          <circle cx={pinX} cy={pinY} r="4.5" fill={accent} stroke="#09111c" strokeWidth="1.5" />

          {/* Callout pill on SVG */}
          <rect
            x={inside ? Math.min(350, pinX + 10) : 14}
            y={inside ? Math.max(36, pinY - 30) : 230}
            width={inside ? 186 : 254}
            height="34"
            rx="4"
            fill="#0f1d2d"
            stroke={accent}
            strokeWidth="1"
          />
          <text
            x={inside ? Math.min(358, pinX + 18) : 22}
            y={inside ? Math.max(50, pinY - 16) : 244}
            fill="#f4f0e8"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {activePoint.lat.toFixed(4)}°N, {activePoint.lng.toFixed(4)}°E
          </text>
          <text
            x={inside ? Math.min(358, pinX + 18) : 22}
            y={inside ? Math.max(62, pinY - 4) : 257}
            fill={accent}
            fontSize="8.5"
            fontFamily="monospace"
          >
            {formatDistance(distance)} FROM SITE · {inside ? "VERIFIED" : "REJECTED"}
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-blueprint-line bg-blueprint-card/60 px-3 py-2 font-mono text-[10px]">
        <div>
          <span className="block text-[#8c9ab0]">SITE COORDS</span>
          <span className="text-[#f4f0e8]">{siteLat.toFixed(4)}°N, {siteLng.toFixed(4)}°E</span>
        </div>
        <div>
          <span className="block text-[#8c9ab0]">DELTA FROM PLOT</span>
          <span className={inside ? "font-semibold text-mint" : "font-semibold text-red-300"}>
            {formatDistance(distance)} (max {radiusMeters}m)
          </span>
        </div>
        <div>
          <span className="block text-[#8c9ab0]">SOURCE</span>
          <span className="truncate block text-[#f4f0e8]">{activePoint.label}</span>
        </div>
      </div>
    </div>
  );
}
