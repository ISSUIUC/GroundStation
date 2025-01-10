import React, { useContext, useEffect } from 'react';
import { GSSDataProvider, useTelemetry } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';

export function StructuresView() {
  // This view handles all telemetry needs for the structures-based view of the rocket.

  let angle = useTelemetry("/value.tilt_angle") * (180/64);
  let accel_x = useTelemetry("/value.highG_ax") * 9.81;
  let accel_y = useTelemetry("/value.highG_ay") * 9.81;
  let accel_z = useTelemetry("/value.highG_az") * 9.81;
  let baro_alt = useTelemetry("/value.barometer_altitude");
  const has_telem = useTelemetry("/src") != null;

  if(!has_telem) {
    accel_x = 0;
    accel_y = 0;
    accel_z = 0;
    baro_alt = 0;
    angle = 0;
  }

  const accel_norm = Math.sqrt(accel_x*accel_x + accel_y*accel_y + accel_z*accel_z);

  return (
    <>
      <div className='telemetry-view'>
        <FlightCountTimer />

        <ValueGroup label={"Telemetry Data"} hidden={!has_telem}>
            <MultiValue
                label={"Gyroscopic"}
                titles={["Tilt", "Roll Rate"]}
                values={[angle.toFixed(1), 0]}
                units={["°", "°/s"]}
            />

            <MultiValue
                label={"Dynamics"}
                titles={["Altitude (Baro)", "Velocity", "Acceleration"]}
                values={[baro_alt.toFixed(1), 0, accel_norm.toFixed(2)]}
                units={["m", "m/s", "m/s^2"]}
            />

            <SingleValue label={"Dynamic Pressure"} value={0} unit={"psi"} />

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
            

        </ValueGroup>

        <Timer 
            mode="t-"
            targetTime={Date.now() + 15000}
            neg_t_text={"in "}
            pos_t_text={"+  "}
            timer_name={"Sustainer Ignition"}
            hidden={!has_telem}
        />


      </div>
    </>
  )
}
