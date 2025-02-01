import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';
import { PositionDataProvider, useGPSPosition } from '../dataflow/positioning.jsx';
import { MapView } from './MapView.jsx';
import { TelemetryGraph } from '../reusable/Graph.jsx';

function Thingy() {

  const [pos_available, position] = useGPSPosition();

  const c = pos_available ? <p>{JSON.stringify(position)}</p> : <b>not available : {JSON.stringify(position)}</b>
  return <>
    {c}
  </>
}

export function RecoveryView() {
  let baro_alt = useTelemetry("/value.barometer_altitude") || 0;
  let altitude = useTelemetry("/value.altitude") || 0;
  let angle = (useTelemetry("/value.tilt_angle") || 0) * (180/64);
  let latitude = (useTelemetry("/value.latitude") || 0);
  let longitude = (useTelemetry("/value.longitude") || 0);
  const has_telem = useTelemetry("/src") != null;

  //Haversine formula - Calculates distance from rocket around earth
  let original_lat = 41.49116
  let original_long = -89.50192
  let phi_1 = original_lat * (Math.PI / 180);
  let phi_2 = latitude * (Math.PI / 180);
  let lambda_1 = original_long * (Math.PI / 180);
  let lambda_2 = longitude * (Math.PI / 180);
  let delta_phi = phi_1 - phi_2;
  let delta_lambda = lambda_1 - lambda_2;
  let a = Math.pow(Math.sin( delta_phi/2 ), 2 ) + Math.cos(phi_1) * Math.cos(phi_2) * Math.pow( Math.sin(delta_lambda/2) , 2 );
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  let R = 6371000 // In meters
  let distance = R * c
  return (
    <>
      <div className='telemetry-view'>
        <div style= {{width: '100%', textAlign:'center'}}>
          <FlightCountTimer />
          <PositionDataProvider>
            <Thingy />
          </PositionDataProvider>
          <div>
            <button>
                <a href="/map" style={{ color: 'inherit', textDecoration: 'none'}}>
                  Full Screen Map View
                </a>
            </button>
          </div>
        </div>
        <div style = {{ display: 'flex', flex: 1, justifyContent: 'space-between' }}>
          <div style= {{ flex: 1, padding: '20px'}}>
            <ValueGroup label={"Rocket Tilt"}>
              <div className='str-angle-visualaid'>
                <div>
                  <AngleGauge angle={angle} limit={22} />
                </div>
                <div className='str-angle-visualaid-stat'>
                  <span className='shrink-text'>Motor Ignition Criteria</span>
                  <StatusDisplay label={"Liftoff"} status={"STBY"}></StatusDisplay>
                  <StatusDisplayWithValue label={"Burnout"} status={"N/A"} value={"no data"}></StatusDisplayWithValue>
                  <StatusDisplayWithValue label={"Angle"} status={has_telem ? (angle < 22 ? "GO" : "NOGO") : "N/A"} value={has_telem ? `${angle.toFixed(1)}<22°` : "no data"}></StatusDisplayWithValue>
                  <StatusDisplayWithValue label={"Continuity"} status={"N/A"} value={"no data"}></StatusDisplayWithValue>
                  <StatusDisplayWithValue label={"Coast"} status={"N/A"} value={""}></StatusDisplayWithValue>
                </div>
              </div>
            </ValueGroup>
            <ValueGroup label={"Altitude"}>
              <StatusDisplayWithValue label={"Altitude (Baro)"} status={"N/A"} value={has_telem ? `${baro_alt}` : "no data"}></StatusDisplayWithValue>
              <StatusDisplayWithValue label={"Altitude (Altimeter)"} status={"N/A"} value={has_telem ? `${altitude}` : "no data"}></StatusDisplayWithValue>
              <TelemetryGraph telem_channels={{
                "/value.altitude": {name: "Altitude (G)", color: "#d97400"}
              }} yaxis_label='GPS Altitude' yaxis_unit={"distance"} />
            </ValueGroup>
            <ValueGroup label={"Distance from Rocket"}>
              <div style={{ textAlign: 'center' }}>
                <h1>{distance} m</h1>
              </div>
            </ValueGroup>

          </div>
          <div style = {{flex: 2, padding: '20px', maxHeight:'80vh', overflowY: 'auto'}}>
            <MapView/>
          </div> 
        </div>
      </div>  
    </>
  )
}