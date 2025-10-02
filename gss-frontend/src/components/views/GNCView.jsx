import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSyncGlobalVars, useTelemetry, useTelemetryHistory, useTelemetryRaw } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import { TelemetryGraph } from '../reusable/Graph.jsx';
import { getSetting, getUnit } from '../dataflow/settings.jsx';
import { fix_type_int_to_fix_type_name, state_int_to_state_name } from '../dataflow/midasconversion.jsx';
import { PositionDataProvider, useGPSPosition } from '../dataflow/positioning.jsx';

import { time_series } from '../dataflow/derivatives.jsx';


export function GNCView() {
  const fsm_state = useTelemetry("/value.FSM_State") || -1;
  const kf_pos = [useTelemetry("/value.kf_px") || 0, useTelemetry("/value.kf_py") || 0, useTelemetry("/value.kf_pz") || 0]
  const kf_vel = [useTelemetry("/value.kf_vx") || 0, useTelemetry("/value.kf_vy") || 0, useTelemetry("/value.kf_vz") || 0]
  const kf_acc = [useTelemetry("/value.kf_ax") || 0, useTelemetry("/value.kf_ay") || 0, useTelemetry("/value.kf_az") || 0]
  const kf_alt = useTelemetry("/value.kf_altitude") || 0;

  const r_acc = [useTelemetry("/value.r_ax") || 0, useTelemetry("/value.r_ay") || 0, useTelemetry("/value.r_az") || 0]
  const r_angle = [useTelemetry("/value.r_pitch") || 0, useTelemetry("/value.r_roll") || 0, useTelemetry("/value.r_yaw") || 0]

  const tilt_angle = useTelemetry("/value.r_tilt");
  

  const accel_unit = getUnit("acceleration")
  const vel_unit = getUnit("velocity")
  const pos_unit = getUnit("distance")




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
                  "/value.kf_px": {name: "X", color: "#cc0000"},
                  "/value.kf_py": {name: "Y", color: "#00cc00"},
                  "/value.kf_pz": {name: "Z", color: "#0000cc"}
                  
                }} yaxis_label='KF Position' yaxis_unit={getUnit("position")} />

                <TelemetryGraph telem_channels={{
                  "/value.kf_vx": {name: "X", color: "#cc0000"},
                  "/value.kf_vy": {name: "Y", color: "#00cc00"},
                  "/value.kf_vz": {name: "Z", color: "#0000cc"}
                  
                }} yaxis_label='KF Velocity' yaxis_unit={getUnit("velocity")} />

                <TelemetryGraph telem_channels={{
                  "/value.kf_ax": {name: "X", color: "#cc0000"},
                  "/value.kf_ay": {name: "Y", color: "#00cc00"},
                  "/value.kf_az": {name: "Z", color: "#0000cc"}
                  
                }} yaxis_label='KF Acceleration' yaxis_unit={getUnit("acceleration")} />

              </div>
              <div className='h-graph-group g-container-3'>

                <TelemetryGraph telem_channels={{
                  "/value.r_ax": {name: "X", color: "#cc0000"},
                  "/value.r_ay": {name: "Y", color: "#00cc00"},
                  "/value.r_az": {name: "Z", color: "#0000cc"}
                  
                }} yaxis_label='Sensor Acceleration' yaxis_unit={getUnit("acceleration")} />

                <TelemetryGraph telem_channels={{
                  "/value.r_pitch": {name: "Pitch", color: "#cc0000"},
                  "/value.r_roll": {name: "Roll", color: "#00cc00"},
                  "/value.r_yaw": {name: "Yaw", color: "#0000cc"}
                  
                }} yaxis_label='Sensor Angles' yaxis_unit={getUnit("acceleration")} />

                <TelemetryGraph telem_channels={{
                  "/value.tilt_angle": {name: "Tilt Angle", color: "#d97400"}
                }} yaxis_label='Angle (deg)' />

              </div>


            </ValueGroup>

          </div>

          <div className='gss-horizontal-group-elem-25 gss-horizontal-group-elem-restack'>
            <ValueGroup label={"Raw Values"} hidden={false} use_smaller_labels={true}>
                <SingleValue label={"Stage State"} value={fsm_state==null ? "NO_DATA" : state_int_to_state_name(fsm_state)} unit={""} />

                <MultiValue
                    label={"KF Position"}
                    titles={["X", "Y", "Z"]}
                    values={[kf_pos[0].toFixed(2), kf_pos[1].toFixed(2), kf_pos[2].toFixed(2)]}
                    label_colors={["#ff0000", "#00ff00", "#0000ff"]}
                    units={[pos_unit, pos_unit, pos_unit]}
                />

                <MultiValue
                    label={"KF Velocity"}
                    titles={["X", "Y", "Z"]}
                    values={[kf_vel[0].toFixed(2), kf_vel[1].toFixed(2), kf_vel[2].toFixed(2)]}
                    label_colors={["#ff0000", "#00ff00", "#0000ff"]}
                    units={[vel_unit, vel_unit, vel_unit]}
                />

                <MultiValue
                    label={"KF Acceleration"}
                    titles={["X", "Y", "Z"]}
                    values={[kf_acc[0].toFixed(2), kf_acc[1].toFixed(2), kf_acc[2].toFixed(2)]}
                    label_colors={["#ff0000", "#00ff00", "#0000ff"]}
                    units={["m/s^2", "m/s^2", "m/s^2"]}
                />

                <SingleValue label={"KF Altitude"} value={kf_alt} unit={"m"} />

                <MultiValue
                    label={"Raw Acceleration"}
                    titles={["X", "Y", "Z"]}
                    values={[r_acc[0].toFixed(2), r_acc[1].toFixed(2), r_acc[2].toFixed(2)]}
                    label_colors={["#ff0000", "#00ff00", "#0000ff"]}
                    units={[accel_unit, accel_unit, accel_unit]}
                />

                <MultiValue
                    label={"Raw Angles"}
                    titles={["Pitch", "Roll", "Yaw"]}
                    values={[r_angle[0].toFixed(2), r_angle[1].toFixed(2), r_angle[2].toFixed(2)]}
                    label_colors={["#ff0000", "#00ff00", "#0000ff"]}
                    units={["°", "°", "°"]}
                />

                <SingleValue label={"OR Tilt"} value={tilt_angle} unit={"°"} />


            </ValueGroup>
          </div>

          
        </div>




      </div>
    </>
  )
}
