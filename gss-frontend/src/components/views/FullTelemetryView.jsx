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

  return (
    <>
      <div className='telemetry-view'>
        <FlightCountTimer />


        <div className='gss-horizontal-group gss-horizontal-large-restack'>

          <div className='gss-horizontal-group-elem-75 gss-horizontal-group-elem-restack'>
            <ValueGroup label={"Telemetry Graphs"}>
              <div className='h-graph-group g-container-3'>
                <TelemetryGraph telem_channels={{
                  "/value.barometer_altitude": {name: "Altitude", color: "#d97400"}
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
            </ValueGroup>
          </div>

          <div className='gss-horizontal-group-elem-25 gss-horizontal-group-elem-restack'>
            <ValueGroup label={"Telemetry Data"} hidden={false} use_smaller_labels={true}>
                <MultiValue
                    label={"Gyroscopic"}
                    titles={["Tilt", "Roll Rate"]}
                    values={[0, 0]}
                    units={["°", "°/s"]}
                />

                <MultiValue
                    label={"Dynamics"}
                    titles={["Altitude (Baro)", "Velocity", "Acceleration"]}
                    values={[0, 0, 0]}
                    units={[getUnit("distance"), getUnit("velocity"), "G"]}
                />

                <SingleValue label={"Dynamic Pressure"} value={0} unit={getUnit("pressure")} />

            </ValueGroup>
          </div>

          
        </div>




      </div>
    </>
  )
}
