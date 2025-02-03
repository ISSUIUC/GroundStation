import React, { useContext, useEffect } from 'react';
import { GSSDataProvider, useTelemetry } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import { CONVERSIONS, getSetting, getUnit } from '../dataflow/settings.jsx';

export function StructuresView() {
  // This view handles all telemetry needs for the structures-based view of the rocket.
  const accel_unit_type = getSetting("accel_unit_type");
  const force_gs = (accel_unit_type == "Force G");
  const is_imperial = getSetting("unit_system") == "IMPERIAL";
  const imperial_cancel = (is_imperial && force_gs) ? CONVERSIONS.FEET_TO_METERS(1) : 1 // Cancels out imperial system recalc if we force Gs

  const accel_multiplier = (force_gs ? 1*imperial_cancel : 9.81);
  const accel_unit = force_gs ? "G" : getUnit("acceleration");

  let angle = (useTelemetry("/value.tilt_angle") || 0);
  let accel_x = (useTelemetry("/value.highG_ax") || 0) * accel_multiplier;
  let accel_y = (useTelemetry("/value.highG_ay") || 0) * accel_multiplier;
  let accel_z = (useTelemetry("/value.highG_az") || 0) * accel_multiplier;
  let baro_alt = (useTelemetry("/value.barometer_altitude") || 0);
  const has_telem = useTelemetry("/src") != null;



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
                units={[getUnit("distance"), getUnit("velocity"), accel_unit]}
            />

            <SingleValue label={"Dynamic Pressure"} value={0} unit={getUnit("pressure")} />

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
