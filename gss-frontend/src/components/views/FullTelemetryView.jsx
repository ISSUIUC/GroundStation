import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSyncGlobalVars, useTelemetry, useTelemetryHistory, useTelemetryRaw } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';
import { TelemetryGraph } from '../reusable/Graph.jsx';
import { getSetting, getUnit } from '../dataflow/settings.jsx';
import { state_int_to_state_name } from '../dataflow/midasconversion.jsx';
import { PositionDataProvider, useGPSPosition } from '../dataflow/positioning.jsx';

import standardAtmosphere from "standard-atmosphere"

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
  const data = useTelemetry("/value");

  const data_num = (key) => {
    if(!data) { return 0; }
    return data[key] == null ? 0 : data[key];
  }

  const fsm_state = data_num("FSM_State");

  const gps_lat = data_num("latitude");
  const gps_long = data_num("longitude");

  const tilt_angle = data_num("tilt_angle");
  
  const pyro_cont = [data_num("pyro_a"), data_num("pyro_b"), data_num("pyro_c"), data_num("pyro_d")]
  
  const rssi = data_num("RSSI")
  const freq = data_num("frequency")
  const is_sus = data_num("is_sustainer")

  const accel_unit = getUnit("acceleration")

  // Translated units need to be gotten directly :(, this is a limitation of the telemetry hook system :(
  const altitude_gps = useTelemetry("/value.altitude") || 0;
  const altitude_baro = useTelemetry("/value.barometer_altitude") || 0;
  const accel = [useTelemetry("/value.highG_ax") || 0, useTelemetry("/value.highG_ay") || 0, data_num("/value.highG_az") || 0]
  const kf_velocity = useTelemetry("/value.kf_velocity") || 0;

  const accel_magnitude = Math.sqrt(accel[0]*accel[0] + accel[1]+accel[1] + accel[2]+accel[2])

  // Atmosphere calcs
  const altitude_baro_raw = useTelemetryRaw("/value.barometer_altitude") || 0;
  const velocity_raw = useTelemetryRaw("/value.kf_velocity");
  const { density, ssound, temperature } = standardAtmosphere(altitude_baro_raw, true);
  const mach_number = velocity_raw/ssound;
  const dynamic_pressure = (1/2)*density*(velocity_raw*velocity_raw) * (0.000145038) // pascal to psi conversion

  const stag_temp = (temperature*(1 + (mach_number**2 * (1.4 - 1)/2))) - 273.15 // K to C

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
                  
                }} yaxis_label='KX Acceleration' yaxis_unit={getUnit("acceleration")} />

                <TelemetryGraph telem_channels={{
                  "/value.RSSI": {name: "RSSI", color: "#d97400"}
                }} yaxis_label='Signal Strength' yaxis_unit={"power"} />
              </div>
              <div className='h-graph-group g-container-3'>
                <TelemetryGraph telem_channels={{
                  "/value.tilt_angle": {name: "Tilt Angle", color: "#d97400"}
                }} yaxis_label='Angle (deg)' />

                <TelemetryGraph telem_channels={{
                  "/value.kf_velocity": {name: "Velocity", color: "#d97400"}
                }} yaxis_label='Velocity' yaxis_unit={"velocity"} />

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
                    values={[tilt_angle.toFixed(1), tilt_angle.toFixed(1), "ND"]}
                    units={["°", "°", "°/s"]}
                />

                <MultiValue
                    label={"Dynamics"}
                    titles={["Altitude (Baro)", "Velocity", "Acceleration"]}
                    values={[altitude_baro.toFixed(2), kf_velocity.toFixed(2), accel_magnitude.toFixed(2)]}
                    units={[getUnit("distance"), getUnit("velocity"), accel_unit]}
                />

                <MultiValue
                    label={""}
                    titles={["Mach", "Dynamic Pressure", "Stag Temp"]}
                    values={[mach_number.toFixed(2), dynamic_pressure.toFixed(2), stag_temp.toFixed(0)]}
                    units={["", getUnit("pressure"), "°C"]}
                />

                <MultiValue
                    label={"Acceleration"}
                    titles={["X", "Y", "Z"]}
                    values={[accel[0].toFixed(2), accel[1].toFixed(2), accel[2].toFixed(2)]}
                    label_colors={["#ff0000", "#00ff00", "#0000ff"]}
                    units={[accel_unit, accel_unit, accel_unit]}
                />

                <MultiValue
                    label={"Comms"}
                    titles={["RSSI", "Frequency", "SUSTAINER Flag"]}
                    values={[rssi.toFixed(0), freq.toFixed(2), is_sus]}
                    units={[getUnit("power"), "MHz", ""]}
                />

                <SingleValue label={"Stage State"} value={fsm_state==null ? "NO_DATA" : state_int_to_state_name(fsm_state)} unit={""} />

                {/* Lol. Only have this for SG1.4 fr */}
                <MultiValue
                    label={"Pyro"}
                    titles={["Channels", "Abs Current", "Exp Current", "BUSV"]}
                    values={[Math.round(pyro_cont[0]).toFixed(0), pyro_cont[1].toFixed(3), pyro_cont[2].toFixed(3), pyro_cont[3].toFixed(2)]}
                    units={["", "A", "A", "V"]}
                />

                <MultiValue
                    label={"Tracking"}
                    titles={["LAT", "LONG", "ALT (GPS)"]}
                    values={[gps_lat.toFixed(6), gps_long.toFixed(6), altitude_gps.toFixed(1)]}
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
