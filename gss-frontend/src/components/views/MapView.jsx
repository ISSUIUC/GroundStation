import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../dataflow/gssdata.jsx';
import * as Cesium from "cesium";

const STAGE_CHANNELS = [
  { name: "Booster", channel: "booster", color: Cesium.Color.FIREBRICK },
  { name: "Sustainer", channel: "sustainer", color: Cesium.Color.DODGERBLUE },
];

const TRAIL_UPDATE_MS = 100;
const PULSE_CYCLE_MS = 2500;

function createDiscTexture(cssColor) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
  ctx.fillStyle = cssColor;
  ctx.fill();
  return canvas;
}

function fmt(num, decimals, width) {
  const s = Number(num || 0).toFixed(decimals);
  return width ? s.padStart(width) : s;
}

function formatCompact(stage) {
  if (!stage || !stage.latest) return "---";
  const { lat, lon, alt } = stage.latest;
  return `${fmt(lat, 4)}  ${fmt(lon, 4)}  ${fmt(alt, 0)}m`;
}

export default function LivePlotter({ overlay = false, trackIndex = null, orbitSpeed = 0.0006, pitch = -45, distance = 10000, adaptive = false, useKF = false, labelOverrides = {} }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  const boosterData = useTelemetry("@booster/value");
  const sustainerData = useTelemetry("@sustainer/value");

  const stageStateRef = useRef(
    STAGE_CHANNELS.map(() => ({
      latest: null,
      normAlt: null,
      fired: false,
      lastTrailUpdate: 0,
      trailPositions: [],
      pointEntity: null,
      trailLine: null,
      lastGpsLat: null,
      lastGpsLon: null,
      kfTailStart: 0,
    }))
  );

  const [trackedStageIndex, setTrackedStageIndex] = useState(null);
  const [stageSnapshot, setStageSnapshot] = useState(
    STAGE_CHANNELS.map(() => ({ latest: null }))
  );

  useEffect(() => {
    if (!containerRef.current) return;

    if (import.meta.env.VITE_CESIUM_ION_TOKEN) {
      Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    }

    const creditContainer = document.createElement("div");
    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      creditContainer,
    });

    viewerRef.current = viewer;

    viewer.resolutionScale = window.devicePixelRatio || 1;
    viewer.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-87.51416, 40.388527, distance),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0,
      },
    });

    const stages = stageStateRef.current;

    STAGE_CHANNELS.forEach((cfg, index) => {
      const ovr = labelOverrides[index] || {};
      const labelName = ovr.name || cfg.name;
      const pointColor = ovr.color ? Cesium.Color.fromCssColorString(ovr.color) : cfg.color;
      const pointEntity = viewer.entities.add({
        name: labelName,
        position: Cesium.Cartesian3.fromDegrees(-87.51416, 40.388527, 0),
        point: {
          pixelSize: 10,
          color: pointColor,
        },
        label: {
          text: labelName,
          font: "28px monospace",
          scale: 0.65,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 4,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        },
      });

      const trailCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
      const trailLine = trailCollection.add({
        positions: [],
        width: 2,
        material: Cesium.Material.fromType('Color', {
          color: pointColor.withAlpha(0.85),
        }),
      });

      let pulseEntity = null;
      if (overlay) {
        const discImage = createDiscTexture(pointColor.toCssColorString());
        pulseEntity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(-87.51416, 40.388527, 0),
          billboard: {
            image: discImage,
            scale: new Cesium.CallbackProperty(() => {
              const t = (Date.now() % PULSE_CYCLE_MS) / PULSE_CYCLE_MS;
              return 0.15 + t * 0.45;
            }, false),
            color: new Cesium.CallbackProperty(() => {
              const t = (Date.now() % PULSE_CYCLE_MS) / PULSE_CYCLE_MS;
              return pointColor.withAlpha(0.5 * (1 - t));
            }, false),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            eyeOffset: new Cesium.Cartesian3(0, 0, 1),
          },
        });
      }

      stages[index].pointEntity = pointEntity;
      stages[index].trailLine = trailLine;
      stages[index].pulseEntity = pulseEntity;
    });

    if (overlay) {
      let headingRad = 0;
      let currentDistance = distance;
      const pitchRad = Cesium.Math.toRadians(pitch);
      const orbitCallback = () => {
        if (viewer.isDestroyed()) return;
        headingRad += orbitSpeed;
        const idx = trackIndex;
        if (idx != null && stages[idx] && stages[idx].latest) {
          const s = stages[idx];
          const displayAlt = (s.latest.alt || 0) - (s.normAlt || 0);
          const target = Cesium.Cartesian3.fromDegrees(s.latest.lon, s.latest.lat, displayAlt);

          let targetDistance = distance;
          if (adaptive) {
            const fsm = s.latest.fsm;
            const pts = s.trailPositions;
            const bs = Cesium.BoundingSphere.fromPoints(pts);
            if (fsm <= 2) { // before launch
              targetDistance = 1500;
            } else if (fsm <= 6) { // before apogee
              
              if (pts.length >= 2) {
                targetDistance = Math.max(bs.radius * 5, 1500);
              } else {
                targetDistance = 1500;
              }
            } else if (fsm <= 8) { // drogue
              targetDistance = targetDistance = Math.max(bs.radius * 3.5, 1500);;
            } else if (fsm <= 10) {
              targetDistance = 1000;
            } else {
              targetDistance = 500;
            }
          }
          currentDistance += (targetDistance - currentDistance) * 0.04;
          viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(headingRad, pitchRad, currentDistance));
        }
      };
      viewer.scene.preRender.addEventListener(orbitCallback);
    }

    return function cleanup() {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const channelData = [boosterData, sustainerData];
    const stages = stageStateRef.current;
    const now = Date.now();

    STAGE_CHANNELS.forEach((cfg, index) => {
      const val = channelData[index];
      if (!val) return;

      const lat = Number(val.latitude);
      const lon = Number(val.longitude);
      if (isNaN(lat) || isNaN(lon)) return;
      const fsm = Number(val.FSM_State || 0);
      const kfAlt = Number(val.kf_positionX || 0);
      const kfActive = useKF && kfAlt !== 0 && fsm <= 6;
      const alt = kfActive ? kfAlt : Number(val.altitude || 0);

      const stage = stages[index];
      stage.latest = { lat, lon, alt, fsm, timestamp: now };

      if (!stage.fired) {
        stage.normAlt = alt;
        if (fsm > 2) stage.fired = true;
      }

      const displayAlt = alt - (stage.normAlt || 0);
      const pos = Cesium.Cartesian3.fromDegrees(lon, lat, displayAlt);
      stage.pointEntity.position = pos;
      if (stage.pulseEntity) stage.pulseEntity.position = pos;

      if (stage.fired && (now - stage.lastTrailUpdate > TRAIL_UPDATE_MS || stage.trailPositions.length === 0)) {
        stage.lastTrailUpdate = now;

        if (kfActive) {
          const gpsAlt = Number(val.altitude || 0) - (stage.normAlt || 0);
          const gpsChanged = stage.lastGpsLat !== null &&
            (lat !== stage.lastGpsLat || lon !== stage.lastGpsLon);

          if (gpsChanged) {
            // New GPS fix: discard KF tail, add GPS-only point as confirmed
            stage.trailPositions.length = stage.kfTailStart;
            stage.trailPositions.push(Cesium.Cartesian3.fromDegrees(lon, lat, gpsAlt));
            stage.kfTailStart = stage.trailPositions.length;
            stage.lastGpsLat = lat;
            stage.lastGpsLon = lon;
          } else if (stage.lastGpsLat === null) {
            stage.lastGpsLat = lat;
            stage.lastGpsLon = lon;
          }
          // Append KF tail point (stale GPS lat/lon + live KF altitude)
          stage.trailPositions.push(Cesium.Cartesian3.fromDegrees(lon, lat, displayAlt));
        } else {
          // GPS-only mode: flush any leftover KF tail first
          if (stage.kfTailStart < stage.trailPositions.length) {
            stage.trailPositions.length = stage.kfTailStart;
          }
          stage.trailPositions.push(pos);
          stage.kfTailStart = stage.trailPositions.length;
        }
        stage.trailLine.positions = stage.trailPositions.slice();
      }
    });

    setStageSnapshot(stages.map((s) => ({ latest: s.latest ? { ...s.latest } : null })));
  }, [boosterData, sustainerData]);

  const effectiveTrackIndex = trackIndex ?? trackedStageIndex;

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || overlay) return;

    if (
      effectiveTrackIndex != null &&
      stageStateRef.current[effectiveTrackIndex] &&
      stageStateRef.current[effectiveTrackIndex].pointEntity
    ) {
      viewer.trackedEntity = stageStateRef.current[effectiveTrackIndex].pointEntity;
    } else {
      viewer.trackedEntity = undefined;
    }
  }, [effectiveTrackIndex]);

  return (
    <div style={{ position: "relative", width: "100%", ...(overlay ? { height: "100%" } : { flex: 1 }), minHeight: 0, overflow: "hidden" }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
      />

      {!overlay && (
        <>
          {/* subtle vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 5,
              boxShadow: "inset 0 0 60px rgba(0, 0, 0, 0.35)",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              zIndex: 10,
              background: "rgba(10, 10, 10, 0.65)",
              backdropFilter: "blur(8px)",
              color: "#e0e0e0",
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontFamily: "monospace",
              fontSize: "0.75em",
              display: "flex",
              alignItems: "center",
              gap: 14,
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
              letterSpacing: "0.02em",
            }}
          >
            <select
              value={trackedStageIndex == null ? "" : trackedStageIndex}
              onChange={(e) => setTrackedStageIndex(e.target.value === "" ? null : Number(e.target.value))}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#e0e0e0",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 4,
                padding: "2px 6px",
                fontFamily: "monospace",
                fontSize: "1em",
              }}
            >
              <option value="">No tracking</option>
              {STAGE_CHANNELS.map((cfg, i) => (
                <option key={cfg.name} value={i}>{cfg.name}</option>
              ))}
            </select>

            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>|</span>

            {STAGE_CHANNELS.map((cfg, i) => (
              <span key={cfg.name} style={{ opacity: stageSnapshot[i]?.latest ? 1 : 0.4 }}>
                <span style={{ color: cfg.color.toCssColorString() }}>{cfg.name[0]}</span>
                <span style={{ color: "rgba(255, 255, 255, 0.35)", margin: "0 3px" }}>/</span>
                <span>{formatCompact(stageSnapshot[i])}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function StreamMapOverlay() {
  const params = new URLSearchParams(window.location.search);
  const track = params.get("track");
  const trackIndex = track === "b" ? 0 : track === "s" ? 1 : null;
  const orbitSpeed = parseFloat(params.get("orbitspeed")) || 0.0006;
  const pitch = parseFloat(params.get("pitch")) || -45;
  const distance = parseFloat(params.get("distance")) || 10000;
  const adaptive = params.get("adaptive") === "1";
  const useKF = params.get("usekf") === "1";

  const labelOverrides = {};
  const labelName = params.get("labelname");
  const labelColor = params.get("labelcolor");
  if (trackIndex != null && (labelName || labelColor)) {
    labelOverrides[trackIndex] = {};
    if (labelName) labelOverrides[trackIndex].name = labelName;
    if (labelColor) labelOverrides[trackIndex].color = labelColor.startsWith("#") ? labelColor : `#${labelColor}`;
  }

  return <LivePlotter overlay trackIndex={trackIndex} orbitSpeed={orbitSpeed} pitch={pitch} distance={distance} adaptive={adaptive} useKF={useKF} labelOverrides={labelOverrides} />;
}

export function MapView() {



  return (
    <><LivePlotter />
    </>);
}
