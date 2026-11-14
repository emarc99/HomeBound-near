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
    const angle = Math.atan2(-(activePoint.lat - siteLat), activePoint.lng - siteLng);
    pinX = 280 + Math.cos(angle) * 124;
    pinY = 140 + Math.sin(angle) * 108;
  }

  const accent = inside ? "#2f7a4a" : "#b3261e";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
          {hasLive && (
            <button
              type="button"
              onClick={() => setPreset("live")}
              className={`cursor-pointer rounded-[2px] border px-2.5 py-1 uppercase transition ${
                preset === "live"
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-paper text-muted hover:text-ink"
              }`}
            >
              Active Stage EXIF
            </button>
          )}
          <button
            type="button"
            onClick={() => setPreset("lintel-pass")}
            className={`cursor-pointer rounded-[2px] border px-2.5 py-1 uppercase transition ${
              preset === "lintel-pass"
                ? "border-leaf bg-mint text-leaf"
                : "border-line bg-paper text-muted hover:text-ink"
            }`}
          >
            Akobo Sample (15m · PASS)
          </button>
          <button
            type="button"
            onClick={() => setPreset("lagos-spoof")}
            className={`cursor-pointer rounded-[2px] border px-2.5 py-1 uppercase transition ${
              preset === "lagos-spoof"
                ? "border-crimson bg-crimson/12 text-crimson"
                : "border-line bg-paper text-muted hover:text-ink"
            }`}
          >
            Lagos Spoof (121.6 km · BLOCK)
          </button>
        </div>

        <span
          className={`rounded-[2px] border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase ${
            inside ? "border-leaf/35 bg-mint text-leaf" : "border-crimson/35 bg-crimson/10 text-crimson"
          }`}
        >
          {inside ? `Inside ${radiusMeters}m Fence` : "Geofence Violation"}
        </span>
      </div>

      <div className="overflow-hidden border border-line bg-paper">
        <svg viewBox="0 0 560 280" className="block h-auto w-full select-none" role="img" aria-label="Plot IB-04 Geofence Radar">
          <defs>
            <radialGradient id="radarStoneGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
              <stop offset="70%" stopColor={accent} stopOpacity="0.05" />
              <stop offset="100%" stopColor="#edece8" stopOpacity="0" />
            </radialGradient>
            <pattern id="cadStoneGrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#111110" strokeOpacity="0.09" strokeWidth="0.7" />
            </pattern>
          </defs>

          <rect width="560" height="280" fill="url(#cadStoneGrid)" />
          <g stroke="#111110" strokeOpacity="0.22" strokeWidth="1" fill="none">
            <path d="M 0 182 Q 150 165 280 140 T 560 95" strokeWidth="1.6" />
            <path d="M 190 0 L 235 280" strokeDasharray="3 3" />
            <path d="M 355 0 L 320 280" strokeDasharray="3 3" />
            <rect x="242" y="108" width="76" height="64" stroke="#f04600" strokeOpacity="0.5" strokeDasharray="3 2" />
          </g>

          <text x="16" y="22" fill="#6b6a64" fontSize="9.5" fontFamily="monospace" letterSpacing="1.2">
            FIG. 2 · AKOBO PLOT IB-04 GEOFENCE RADAR
          </text>
          <text x="430" y="22" fill="#6b6a64" fontSize="9.5" fontFamily="monospace">
            RADIUS: {radiusMeters}M
          </text>

          <circle cx="280" cy="140" r={maxVisualR} fill="url(#radarStoneGlow)" />
          <circle cx="280" cy="140" r="35" fill="none" stroke="#111110" strokeOpacity="0.18" strokeWidth="1" />
          <circle cx="280" cy="140" r="70" fill="none" stroke="#111110" strokeOpacity="0.18" strokeDasharray="3 3" strokeWidth="1" />
          <circle cx="280" cy="140" r={maxVisualR} fill="none" stroke={accent} strokeWidth="1.6" />

          <line x1="150" y1="140" x2="410" y2="140" stroke="#111110" strokeOpacity="0.18" strokeWidth="0.9" />
          <line x1="280" y1="22" x2="280" y2="258" stroke="#111110" strokeOpacity="0.18" strokeWidth="0.9" />

          <circle cx="280" cy="140" r="3.5" fill="#f04600" />
          <text x="288" y="152" fill="#f04600" fontSize="8.5" fontFamily="monospace" fontWeight="600">
            PLOT CENTER
          </text>

          <line
            x1="280"
            y1="140"
            x2={pinX}
            y2={pinY}
            stroke={accent}
            strokeWidth="1.6"
            strokeDasharray={inside ? "2 2" : "5 3"}
          />

          <circle cx={pinX} cy={pinY} r="10" fill={accent} fillOpacity="0.2" />
          <circle cx={pinX} cy={pinY} r="4.5" fill={accent} stroke="#f5f4f0" strokeWidth="1.5" />

          <rect
            x={inside ? Math.min(346, pinX + 10) : 14}
            y={inside ? Math.max(36, pinY - 30) : 230}
            width={inside ? 196 : 264}
            height="34"
            fill="#f5f4f0"
            stroke={accent}
            strokeWidth="1"
          />
          <text
            x={inside ? Math.min(354, pinX + 18) : 22}
            y={inside ? Math.max(50, pinY - 16) : 244}
            fill="#111110"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="600"
          >
            {inside ? `${formatDistance(distance)} FROM SITE` : `${formatDistance(distance)} OFF-PLOT`}
          </text>
          <text
            x={inside ? Math.min(354, pinX + 18) : 22}
            y={inside ? Math.max(62, pinY - 4) : 256}
            fill="#6b6a64"
            fontSize="8.5"
            fontFamily="monospace"
          >
            {activePoint.lat.toFixed(4)}°N, {activePoint.lng.toFixed(4)}°E
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted uppercase">
        <span>Pin: {activePoint.label}</span>
        <span>Distance: {formatDistance(distance)} / Limit {radiusMeters}m</span>
      </div>
    </div>
  );
}
