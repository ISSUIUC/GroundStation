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
import { DistanceTracker } from './FullTelemetryView.jsx';
import { getUnit } from '../dataflow/settings.jsx';

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
  let velocity = useTelemetry("/value.kf_velocity") || 0;
  let angle = (useTelemetry("/value.tilt_angle") || 0);
  let latitude = (useTelemetry("/value.latitude") || 0);
  let longitude = (useTelemetry("/value.longitude") || 0);
  const has_telem = useTelemetry("/src") != null;

  return (
    <>
      <div className='telemetry-view'>
      <FlightCountTimer />
        <div className='gss-horizontal-group gss-horizontal-large-restack'>
          <div className='gss-horizontal-group-elem-33 gss-horizontal-group-elem-restack'>
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
              <MultiValue
                  label={"Dynamics"}
                  titles={["Altitude (Baro)", "Altitude (GPS)", "Velocity"]}
                  values={[baro_alt, altitude, velocity]}
                  units={[getUnit("distance"), getUnit("distance"), getUnit("velocity")]}
              />
              
              <TelemetryGraph telem_channels={{
                "/value.barometer_altitude": {name: "Altitude", color: "#d97400"}
              }} yaxis_label='Baro Altitude' yaxis_unit={"distance"} />
            </ValueGroup>
            <ValueGroup label={"Distance from Rocket"}>
              <PositionDataProvider>
                <DistanceTracker rocket_lat={latitude} rocket_long={longitude} />
              </PositionDataProvider>
            </ValueGroup>

          </div>
          <div className='gss-horizontal-group-elem-66 gss-horizontal-group-elem-restack'>
            <ValueGroup label={"Map position"}>
              <MapView/>
            </ValueGroup>
            
          </div> 
        </div>
      </div>  
    </>
  )
}