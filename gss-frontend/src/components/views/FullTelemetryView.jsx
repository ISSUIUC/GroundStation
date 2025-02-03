import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSyncGlobalVars, useTelemetry, useTelemetryHistory } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';
import { TelemetryGraph } from '../reusable/Graph.jsx';
import { getUnit } from '../dataflow/settings.jsx';
import { state_int_to_state_name } from '../dataflow/midasconversion.jsx';
import { PositionDataProvider, useGPSPosition } from '../dataflow/positioning.jsx';

import haversine from 'haversine';
import { options } from 'preact';

export function DistanceTracker({ rocket_lat, rocket_long }) {
  const [loc_available, loc_data] = useGPSPosition()

  if(rocket_lat == 0 && rocket_long == 0) {
    <>
      <SingleValue label={"Tracking Distance"} value={"Missing Rocket Location"} unit={""} />
    </>
  }

  if(!loc_available) {
    return (
      <>
        <SingleValue label={"Tracking Distance"} value={"User location unavailable"} unit={""} />
      </>
    );
  }

  let user_lat = loc_data.latitude;
  let user_long = loc_data.longitude;

  let point1 = {"latitude": user_lat, "longitude": user_long}
  let point2 = {"latitude": rocket_lat, "longitude": rocket_long}

  const unit = getUnit("distance") == "m" ? "km" : "mi"
  let distance = haversine(point1, point2, {
    unit: unit
  })

  return (
    <>
      <SingleValue label={"Tracking Distance"} value={distance.toFixed(4)} unit={unit} />
    </>
  );

} 

export function FullTelemetryView() {

  // More efficient to just get all the data at once
  const fsm_state = useTelemetry("/value.FSM_State") || null;

  const gps_lat = useTelemetry("/value.latitude") || 0;
  const gps_long = useTelemetry("/value.longitude") || 0;

  return (
    <>
      <div className='telemetry-view'>
        <div className='aspect-warning'>
          <p>WARNING: This view is not optimized for smaller screens</p>
        </div>
        <FlightCountTimer />


        <div className='gss-horizontal-group gss-horizontal-large-restack'>

          <div className='gss-horizontal-group-elem-75 gss-horizontal-group-elem-restack'>
            <ValueGroup label={"Telemetry Graphs"}>
              <div className='h-graph-group g-container-3'>
                <TelemetryGraph telem_channels={{
                  "/value.barometer_altitude": {name: "Altitude (B)", color: "#d97400"}
                }} yaxis_label='Barometer Altitude' yaxis_unit={"distance"} />

                <TelemetryGraph telem_channels={{
                  "/value.highG_ax": {name: "X", color: "#cc0000"},
                  "/value.highG_ay": {name: "Y", color: "#00cc00"},
                  "/value.highG_az": {name: "Z", color: "#0000cc"}
                  
                }} yaxis_label='KX Acceleration' yaxis_unit={"acceleration"} />

                <TelemetryGraph telem_channels={{
                  "/value.RSSI": {name: "RSSI", color: "#d97400"}
                }} yaxis_label='Signal Strength' yaxis_unit={"power"} />
              </div>
              <div className='h-graph-group g-container-3'>
                <TelemetryGraph telem_channels={{
                  "/value.tilt_angle": {name: "Tilt Angle", color: "#d97400"}
                }} yaxis_label='Angle (deg)' />

                <TelemetryGraph telem_channels={{
                  "/value.altitude": {name: "Altitude (G)", color: "#d97400"}
                }} yaxis_label='GPS Altitude' yaxis_unit={"distance"} />

                <TelemetryGraph telem_channels={{
                  "/value.battery_voltage": {name: "Battery Voltage", color: "#d97400"}
                }} yaxis_label='Voltage (V)' />
              </div>
            </ValueGroup>
          </div>

          <div className='gss-horizontal-group-elem-25 gss-horizontal-group-elem-restack'>
            <ValueGroup label={"Telemetry Data"} hidden={false} use_smaller_labels={true}>
                <MultiValue
                    label={"Gyroscopic"}
                    titles={["Tilt", "Tilt @ Burnout", "Roll Rate"]}
                    values={[0, 0, 0]}
                    units={["°", "°", "°/s"]}
                />

                <MultiValue
                    label={"Dynamics"}
                    titles={["Altitude (Baro)", "Velocity", "Acceleration (Mag)"]}
                    values={[0, 0, 0]}
                    units={[getUnit("distance"), getUnit("velocity"), "G"]}
                />

                <SingleValue label={"Dynamic Pressure"} value={0} unit={getUnit("pressure")} />

                <MultiValue
                    label={"Acceleration"}
                    titles={["X", "Y", "Z"]}
                    values={[0, 0, 0]}
                    label_colors={["#ff0000", "#00ff00", "#0000ff"]}
                    units={[getUnit("acceleration"), getUnit("acceleration"), getUnit("acceleration")]}
                />

                <MultiValue
                    label={"Comms"}
                    titles={["RSSI", "Frequency", "SUSTAINER Flag"]}
                    values={[0, 0, 0]}
                    units={[getUnit("power"), "MHz", ""]}
                />

                <SingleValue label={"Stage State"} value={fsm_state==null ? "NO_DATA" : state_int_to_state_name(fsm_state)} unit={""} />

                <MultiValue
                    label={"Tracking"}
                    titles={["LAT", "LONG", "ALT (GPS)"]}
                    values={[0, 0, 0]}
                    units={["°", "°", getUnit("distance")]}
                />

                <PositionDataProvider>
                  <DistanceTracker rocket_lat={gps_lat} rocket_long={gps_long} />
                </PositionDataProvider>

            </ValueGroup>
          </div>

          
        </div>




      </div>
    </>
  )
}
