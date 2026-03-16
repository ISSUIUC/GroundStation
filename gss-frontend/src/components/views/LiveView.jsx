import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useTelemetry, useTelemetryRaw } from '../dataflow/gssdata.jsx';
import { getUnit, getSetting, CONVERSIONS } from '../dataflow/settings.jsx';
import './LiveView.css';

const TRAIL_UPDATE_MS = 250;

// Champaign, IL - fallback when no origin has been set from rocket GPS
const DEFAULT_LAT = 40.1164;
const DEFAULT_LON = -88.2434;
const DEFAULT_ALT = 0;
const METERS_PER_DEG_LAT = 111320;

// Convert Kalman local position to global lat/lon/alt (interactive_plotter convention: pos_x=altitude, pos_y=east, pos_z=north)
function convertLocalToGPS(launchLatDeg, launchLonDeg, groundAltM, pos_x, pos_y, pos_z) {
  if (pos_x == null || pos_y == null || pos_z == null ||
      Number.isNaN(pos_x) || Number.isNaN(pos_y) || Number.isNaN(pos_z)) return null;
  const metersPerDegLon = METERS_PER_DEG_LAT * Math.cos((launchLatDeg * Math.PI) / 180);
  const lonDeg = launchLonDeg + pos_y / metersPerDegLon;
  const latDeg = launchLatDeg + pos_z / METERS_PER_DEG_LAT;
  const alt = pos_x + groundAltM;
  return { lat: latDeg, lon: lonDeg, alt };
}

function fmt(num, decimals, width) {
  const s = Number(num).toFixed(decimals);
  return width ? s.padStart(width) : s;
}

function fmtGPS(lat, lon, alt, distanceUnit = 'm') {
  return `GPS: ${fmt(lat, 6, 10)} ${fmt(lon, 6, 10)} ${fmt(alt, 0, 7)} ${distanceUnit}`;
}

function fmtKF(lat, lon, alt, distanceUnit = 'm') {
  return `KF:  ${fmt(lat, 6, 10)} ${fmt(lon, 6, 10)} ${fmt(alt, 0, 7)} ${distanceUnit}`;
}

function formatLastUpdated(timestampUnixSec) {
  if (timestampUnixSec == null) return 'Last: --';
  const nowSec = Date.now() / 1000;
  const ageSec = nowSec - timestampUnixSec;
  if (ageSec < 60) return `Last: ${Math.round(ageSec)}s ago`;
  const d = new Date(timestampUnixSec * 1000);
  return `Last: ${d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

export function LiveView() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const stagesRef = useRef(null);
  const trackedStageRef = useRef(null);

  const [headingValue, setHeadingValue] = useState(0);
  const [pitchValue, setPitchValue] = useState(-30);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [sceneMode3D, setSceneMode3D] = useState(true);
  const [showBoosterGps, setShowBoosterGps] = useState(true);
  const [showBoosterKalman, setShowBoosterKalman] = useState(false);
  const [showSustainerGps, setShowSustainerGps] = useState(true);
  const [showSustainerKalman, setShowSustainerKalman] = useState(false);
  const [gpsBooster, setGpsBooster] = useState('Waiting...');
  const [gpsSustainer, setGpsSustainer] = useState('Waiting...');
  const [kfBooster, setKfBooster] = useState('Waiting...');
  const [kfSustainer, setKfSustainer] = useState('Waiting...');

  // Kalman origin (lat, lon, alt) — set via "Set origin from current GPS" button
  const [originLat, setOriginLat] = useState(DEFAULT_LAT);
  const [originLon, setOriginLon] = useState(DEFAULT_LON);
  const [originAlt, setOriginAlt] = useState(DEFAULT_ALT);

  const boosterLat = useTelemetry('@booster/value.latitude');
  const boosterLon = useTelemetry('@booster/value.longitude');
  const boosterGpsAlt = useTelemetry('@booster/value.altitude');
  const boosterFsm = useTelemetry('@booster/value.FSM_State');
  const boosterLastUpdate = useTelemetry('@booster/time_published', true);
  const boosterGpsAltRaw = useTelemetryRaw('@booster/value.altitude');
  const boosterKfPx = useTelemetry('@booster/value.kf_px');
  const boosterKfPy = useTelemetry('@booster/value.kf_py');
  const boosterKfPz = useTelemetry('@booster/value.kf_pz');

  const sustainerLat = useTelemetry('@sustainer/value.latitude');
  const sustainerLon = useTelemetry('@sustainer/value.longitude');
  const sustainerGpsAlt = useTelemetry('@sustainer/value.altitude');
  const sustainerFsm = useTelemetry('@sustainer/value.FSM_State');
  const sustainerLastUpdate = useTelemetry('@sustainer/time_published', true);
  const sustainerGpsAltRaw = useTelemetryRaw('@sustainer/value.altitude');
  const sustainerKfPx = useTelemetry('@sustainer/value.kf_px');
  const sustainerKfPy = useTelemetry('@sustainer/value.kf_py');
  const sustainerKfPz = useTelemetry('@sustainer/value.kf_pz');

  const boosterKfVelocity = useTelemetry('@booster/value.kf_velocity');
  const sustainerKfVelocity = useTelemetry('@sustainer/value.kf_velocity');
  const velocityUnit = getUnit('velocity');
  const distanceUnit = getUnit('distance');

  const [showBooster, setShowBooster] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      sceneMode: Cesium.SceneMode.SCENE3D,
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      useDefaultRenderLoop: true,
    });

    // Replace default imagery with OpenStreetMap (like live_plotter terrain map)
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        maximumLevel: 19,
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        credit: new Cesium.Credit('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'),
      })
    );

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(DEFAULT_LON, DEFAULT_LAT, 15000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0,
      },
    });

    const STAGE_CONFIG = [
      { name: 'Booster', color: Cesium.Color.FIREBRICK, kfColor: Cesium.Color.ORANGE },
      { name: 'Sustainer', color: Cesium.Color.BLUE, kfColor: Cesium.Color.CYAN },
    ];

    const stages = {};
    STAGE_CONFIG.forEach((config, index) => {
      const basePos = Cesium.Cartesian3.fromDegrees(DEFAULT_LON, DEFAULT_LAT, DEFAULT_ALT);
      const gpsEntity = viewer.entities.add({
        position: basePos.clone(),
        point: { pixelSize: 10, color: config.color },
        label: { text: config.name + ' GPS', font: '12px monospace', pixelOffset: new Cesium.Cartesian2(0, -18) },
        show: true,
      });
      const gpsTrail = viewer.entities.add({
        polyline: { positions: [], width: 2, material: config.color.withAlpha(0.8), clampToGround: false },
        show: true,
      });
      const kfPositionProperty = new Cesium.ConstantPositionProperty(basePos.clone());
      const kfEntity = viewer.entities.add({
        position: kfPositionProperty,
        point: { pixelSize: 8, color: config.kfColor },
        label: { text: config.name + ' KF', font: '12px monospace', pixelOffset: new Cesium.Cartesian2(0, -18) },
        show: false,
      });
      const kfTrail = viewer.entities.add({
        polyline: { positions: [], width: 1.5, material: config.kfColor.withAlpha(0.8), clampToGround: false },
        show: false,
      });
      stages[index] = {
        gpsEntity,
        gpsTrail,
        kfEntity,
        kfTrail,
        kfPositionProperty,
        gpsNormAlt: null,
        gpsFired: false,
        gpsPositions: [],
        gpsLastUpdate: 0,
        kfFired: false,
        kfPositions: [],
        kfLastUpdate: 0,
      };
    });

    viewerRef.current = viewer;
    stagesRef.current = stages;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      stagesRef.current = null;
      trackedStageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    const stages = stagesRef.current;
    if (!viewer || !stages) return;

    const updateGpsStage = (stageIndex, lat, lon, alt, fsm, setGps) => {
      const stage = stages[stageIndex];
      if (!stage || lat == null || lon == null || alt == null) return;
      const altVal = alt;
      const fsmVal = fsm != null ? fsm : 0;
      if (!stage.gpsFired) {
        stage.gpsNormAlt = altVal;
        if (fsmVal > 2) stage.gpsFired = true;
      }
      const normAlt = stage.gpsNormAlt ?? 0;
      const pos = Cesium.Cartesian3.fromDegrees(lon, lat, altVal - normAlt);
      stage.gpsEntity.position = pos;
      setGps(fmtGPS(lat, lon, altVal, distanceUnit));
      const timestamp = Date.now();
      if (stage.gpsFired && fsmVal > 2 && (timestamp - stage.gpsLastUpdate > TRAIL_UPDATE_MS || stage.gpsPositions.length === 0)) {
        stage.gpsPositions.push(pos);
        stage.gpsTrail.polyline.positions = stage.gpsPositions;
        stage.gpsLastUpdate = timestamp;
      }
    };

    const updateKfStage = (stageIndex, kf_px, kf_py, kf_pz, fsm, setKf) => {
      const stage = stages[stageIndex];
      const gps = convertLocalToGPS(originLat, originLon, originAlt, kf_px, kf_py, kf_pz);
      if (!stage || !gps) return;
      const fsmVal = fsm != null ? fsm : 0;
      if (!stage.kfFired && fsmVal > 2) stage.kfFired = true;
      const pos = Cesium.Cartesian3.fromDegrees(gps.lon, gps.lat, gps.alt);
      stage.kfPositionProperty.setValue(pos);
      const altDisplay = getSetting('unit_system') === 'IMPERIAL' ? CONVERSIONS.METER_TO_FEET(gps.alt) : gps.alt;
      setKf(fmtKF(gps.lat, gps.lon, altDisplay, distanceUnit));
      const timestamp = Date.now();
      if (stage.kfFired && fsmVal > 2 && (timestamp - stage.kfLastUpdate > TRAIL_UPDATE_MS || stage.kfPositions.length === 0)) {
        stage.kfPositions.push(pos.clone());
        stage.kfTrail.polyline.positions = stage.kfPositions;
        stage.kfLastUpdate = timestamp;
      }
    };

    if (showBooster && boosterLat != null && boosterLon != null && boosterGpsAlt != null) {
      updateGpsStage(0, boosterLat, boosterLon, boosterGpsAlt, boosterFsm, setGpsBooster);
    }
    if (sustainerLat != null && sustainerLon != null && sustainerGpsAlt != null) {
      updateGpsStage(1, sustainerLat, sustainerLon, sustainerGpsAlt, sustainerFsm, setGpsSustainer);
    }
    if (showBooster && boosterKfPx != null && boosterKfPy != null && boosterKfPz != null) {
      updateKfStage(0, boosterKfPx, boosterKfPy, boosterKfPz, boosterFsm, setKfBooster);
    }
    if (sustainerKfPx != null && sustainerKfPy != null && sustainerKfPz != null) {
      updateKfStage(1, sustainerKfPx, sustainerKfPy, sustainerKfPz, sustainerFsm, setKfSustainer);
    }
    viewer.scene.requestRender();
  }, [
    boosterLat,
    boosterLon,
    boosterGpsAlt,
    boosterFsm,
    boosterKfPx,
    boosterKfPy,
    boosterKfPz,
    sustainerLat,
    sustainerLon,
    sustainerGpsAlt,
    sustainerFsm,
    sustainerKfPx,
    sustainerKfPy,
    sustainerKfPz,
    originLat,
    originLon,
    originAlt,
    showBooster,
    distanceUnit,
  ]);

  useEffect(() => {
    const stages = stagesRef.current;
    if (!stages || !stages[0] || !stages[1]) return;
    const showB = showBooster;
    stages[0].gpsEntity.show = showB && showBoosterGps;
    stages[0].gpsTrail.show = showB && showBoosterGps;
    stages[0].kfEntity.show = showB && showBoosterKalman;
    stages[0].kfTrail.show = showB && showBoosterKalman;
    stages[1].gpsEntity.show = showSustainerGps;
    stages[1].gpsTrail.show = showSustainerGps;
    stages[1].kfEntity.show = showSustainerKalman;
    stages[1].kfTrail.show = showSustainerKalman;
  }, [showBoosterGps, showBoosterKalman, showSustainerGps, showSustainerKalman, showBooster]);

  useEffect(() => {
    if (!showBooster && viewerRef.current && trackedStageRef.current) {
      const stages = stagesRef.current;
      if (stages && (trackedStageRef.current === stages[0].gpsEntity || trackedStageRef.current === stages[0].kfEntity)) {
        viewerRef.current.trackedEntity = null;
        trackedStageRef.current = null;
        setControlsVisible(true);
      }
    }
  }, [showBooster]);

  // When origin changes, clear KF trails and update KF entity positions so they use the new origin.
  // (If KF telemetry exists, the main effect will also run and set the correct position; this handles the case when no KF data yet.)
  useEffect(() => {
    const viewer = viewerRef.current;
    const stages = stagesRef.current;
    if (!viewer || !stages) return;
    const originCartesian = Cesium.Cartesian3.fromDegrees(originLon, originLat, originAlt);
    stages[0].kfPositions = [];
    stages[0].kfTrail.polyline.positions = [];
    stages[0].kfPositionProperty.setValue(originCartesian.clone());
    stages[1].kfPositions = [];
    stages[1].kfTrail.polyline.positions = [];
    stages[1].kfPositionProperty.setValue(originCartesian.clone());
    viewer.scene.requestRender();
  }, [originLat, originLon, originAlt]);

  const handleHeadingInput = (e) => {
    if (trackedStageRef.current) return;
    const heading = Number(e.target.value);
    const pitch = Cesium.Math.toRadians(pitchValue);
    setHeadingValue(heading);
    if (viewerRef.current) {
      viewerRef.current.camera.setView({
        destination: viewerRef.current.camera.positionWC,
        orientation: {
          heading: Cesium.Math.toRadians(heading),
          pitch,
          roll: 0,
        },
      });
    }
  };

  const handlePitchInput = (e) => {
    if (trackedStageRef.current) return;
    const pitch = Number(e.target.value);
    setPitchValue(pitch);
    if (viewerRef.current) {
      viewerRef.current.camera.setView({
        destination: viewerRef.current.camera.positionWC,
        orientation: {
          heading: Cesium.Math.toRadians(headingValue),
          pitch: Cesium.Math.toRadians(pitch),
          roll: 0,
        },
      });
    }
  };

  const handleTrack = (stageIndex) => {
    const stages = stagesRef.current;
    if (!viewerRef.current || !stages || !stages[stageIndex]) return;
    const stage = stages[stageIndex];
    const entity = (stageIndex === 0 && showBoosterGps) || (stageIndex === 1 && showSustainerGps)
      ? stage.gpsEntity
      : ((stageIndex === 0 && showBoosterKalman) || (stageIndex === 1 && showSustainerKalman) ? stage.kfEntity : stage.gpsEntity);
    trackedStageRef.current = stage;
    viewerRef.current.trackedEntity = entity;
    setControlsVisible(false);
  };

  const handleStopTracking = () => {
    trackedStageRef.current = null;
    if (viewerRef.current) viewerRef.current.trackedEntity = null;
    setControlsVisible(true);
  };

  const handleSetOriginFromCurrentGps = () => {
    if (sustainerLat != null && sustainerLon != null) {
      setOriginLat(sustainerLat);
      setOriginLon(sustainerLon);
      const altRaw = sustainerGpsAltRaw != null ? sustainerGpsAltRaw : originAlt;
      setOriginAlt(altRaw);
    } else if (boosterLat != null && boosterLon != null) {
      setOriginLat(boosterLat);
      setOriginLon(boosterLon);
      const altRaw = boosterGpsAltRaw != null ? boosterGpsAltRaw : originAlt;
      setOriginAlt(altRaw);
    }
  };

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.scene.mode = sceneMode3D ? Cesium.SceneMode.SCENE3D : Cesium.SceneMode.COLUMBUS_VIEW;
  }, [sceneMode3D]);

  return (
    <div className="live-view-container">
      <div ref={containerRef} className="live-view-cesium-container" />

      {controlsVisible && (
        <div id="live-view-controls" className="live-view-controls">
          <label>
            Heading: <span id="live-view-heading-value">{headingValue}</span>°
          </label>
          <br />
          <input
            type="range"
            id="live-view-heading-slider"
            min="0"
            max="360"
            value={headingValue}
            onInput={handleHeadingInput}
          />
          <br />
          <label>
            Pitch: <span id="live-view-pitch-value">{pitchValue}</span>°
          </label>
          <br />
          <input
            type="range"
            id="live-view-pitch-slider"
            min="-90"
            max="0"
            value={pitchValue}
            onInput={handlePitchInput}
          />
        </div>
      )}

      {(boosterKfVelocity != null || sustainerKfVelocity != null) && (
        <div id="live-view-kf-velocity" className="live-view-kf-velocity-panel">
          <div className="live-view-kf-velocity-title">KF VelX</div>
          {boosterKfVelocity != null && (
            <div className="live-view-kf-velocity-row">
              <span className="live-view-kf-velocity-label">Booster:</span>
              <span className="live-view-kf-velocity-value">
                {Number(boosterKfVelocity).toFixed(2)} {velocityUnit}
              </span>
            </div>
          )}
          {sustainerKfVelocity != null && (
            <div className="live-view-kf-velocity-row">
              <span className="live-view-kf-velocity-label">Sustainer:</span>
              <span className="live-view-kf-velocity-value">
                {Number(sustainerKfVelocity).toFixed(2)} {velocityUnit}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="live-view-track-buttons">
        <button type="button" onClick={handleStopTracking}>
          Stop Tracking
        </button>
        {showBooster && (
          <button type="button" onClick={() => handleTrack(0)} data-stage="0">
            Track Booster
          </button>
        )}
        <button type="button" onClick={() => handleTrack(1)} data-stage="1">
          Track Sustainer
        </button>
        <div className="live-view-booster-toggle">
          <label className="live-view-checkbox-label">
            <input type="checkbox" checked={showBooster} onChange={(e) => setShowBooster(e.target.checked)} />
            Show booster
          </label>
        </div>
        <div className="live-view-mode-toggle">
          <span className="live-view-mode-label">View:</span>
          <button
            type="button"
            className={sceneMode3D ? 'live-view-mode-active' : ''}
            onClick={() => setSceneMode3D(true)}
          >
            3D Globe
          </button>
          <button
            type="button"
            className={!sceneMode3D ? 'live-view-mode-active' : ''}
            onClick={() => setSceneMode3D(false)}
          >
            2D Map
          </button>
        </div>
        <div className="live-view-hint">Drag to rotate · Scroll to zoom</div>
        <div className="live-view-origin-row">
          <button
            type="button"
            className="live-view-origin-button"
            onClick={handleSetOriginFromCurrentGps}
            disabled={(boosterLat == null || boosterLon == null) && (sustainerLat == null || sustainerLon == null)}
            title="Use current rocket GPS position as Kalman origin (sustainer preferred, else booster)"
          >
            Set origin from current GPS
          </button>
          <span className="live-view-origin-label">
            KF origin: {fmt(originLat, 5, 0)}, {fmt(originLon, 5, 0)} ({fmt(getSetting('unit_system') === 'IMPERIAL' ? CONVERSIONS.METER_TO_FEET(originAlt) : originAlt, 0, 0)} {distanceUnit})
          </span>
        </div>
        <div className="live-view-source-toggles">
          {showBooster && (
            <div className="live-view-source-row">
              <span className="live-view-source-label">Booster:</span>
              <label className="live-view-checkbox-label">
                <input type="checkbox" checked={showBoosterGps} onChange={(e) => setShowBoosterGps(e.target.checked)} />
                GPS
              </label>
              <label className="live-view-checkbox-label">
                <input type="checkbox" checked={showBoosterKalman} onChange={(e) => setShowBoosterKalman(e.target.checked)} />
                Kalman
              </label>
            </div>
          )}
          <div className="live-view-source-row">
            <span className="live-view-source-label">Sustainer:</span>
            <label className="live-view-checkbox-label">
              <input type="checkbox" checked={showSustainerGps} onChange={(e) => setShowSustainerGps(e.target.checked)} />
              GPS
            </label>
            <label className="live-view-checkbox-label">
              <input type="checkbox" checked={showSustainerKalman} onChange={(e) => setShowSustainerKalman(e.target.checked)} />
              Kalman
            </label>
          </div>
        </div>
      </div>

      <div id="live-view-gps-overlay" className="live-view-gps-overlay">
        {showBooster && (
          <div className="live-view-stage">
            <span className="live-view-stage-name">Booster:</span>
            <div className="live-view-stage-data">
              {showBoosterGps && <span id="live-view-stage1-gps">{gpsBooster}</span>}
              {showBoosterKalman && <span className="live-view-kf-line">{kfBooster}</span>}
              <span className="live-view-last-updated">{formatLastUpdated(boosterLastUpdate)}</span>
            </div>
          </div>
        )}
        <div className="live-view-stage">
          <span className="live-view-stage-name">Sustainer:</span>
          <div className="live-view-stage-data">
            {showSustainerGps && <span id="live-view-stage2-gps">{gpsSustainer}</span>}
            {showSustainerKalman && <span className="live-view-kf-line">{kfSustainer}</span>}
            <span className="live-view-last-updated">{formatLastUpdated(sustainerLastUpdate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
