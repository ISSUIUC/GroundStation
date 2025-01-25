import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSetGlobalVar, useSyncGlobalVars, useTelemetry, useTelemetryHistory } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';
import { Graph, TelemetryGraph } from '../reusable/Graph.jsx';
import { getUnit } from '../dataflow/settings.jsx';


export function FullTelemetryView() {

  // More efficient to just get all the data at once
  const tvalues = useTelemetry("/value");

  console.log("tvalues", tvalues);

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

                <SingleValue label={"Stage State"} value={"BOOST"} unit={""} />

                <MultiValue
                    label={"Tracking"}
                    titles={["LAT", "LONG", "ALT (GPS)"]}
                    values={[0, 0, 0]}
                    units={["°", "°", getUnit("distance")]}
                />
              
                <SingleValue label={"Tracking Distance"} value={0} unit={getUnit("distance")} />
              
            </ValueGroup>
          </div>

          
        </div>




      </div>
    </>
  )
}
