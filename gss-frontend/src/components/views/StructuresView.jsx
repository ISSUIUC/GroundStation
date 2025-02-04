import React, { useContext, useEffect } from 'react';
import { GSSDataProvider, useTelemetry, useTelemetryRaw } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import { CONVERSIONS, getSetting, getUnit } from '../dataflow/settings.jsx';
import standardAtmosphere from 'standard-atmosphere';
import { state_int_to_state_name } from '../dataflow/midasconversion.jsx';

export function StructuresView() {
  // This view handles all telemetry needs for the structures-based view of the rocket.


  let angle = (useTelemetry("/value.tilt_angle") || 0);
  let accel_x = (useTelemetry("/value.highG_ax") || 0);
  let accel_y = (useTelemetry("/value.highG_ay") || 0);
  let accel_z = (useTelemetry("/value.highG_az") || 0);
  let baro_alt = (useTelemetry("/value.barometer_altitude") || 0);
  const has_telem = useTelemetry("/src") != null;
  const motor_cont = useTelemetry("/value.pyro_c") || 0;

  const velocity = useTelemetry("/value.kf_velocity") || 0;

  let fsm_state = useTelemetry("/value.FSM_State");
  if(fsm_state == null) {
    fsm_state = -1;
  }

  const accel_norm = Math.sqrt(accel_x*accel_x + accel_y*accel_y + accel_z*accel_z);

  // Atmosphere calcs
  const altitude_baro_raw = useTelemetryRaw("/value.barometer_altitude") || 0;
  const velocity_raw = useTelemetryRaw("/value.kf_velocity") || 0;
  const { density, ssound, temperature } = standardAtmosphere(altitude_baro_raw, true);
  const mach_number = velocity_raw/ssound;
  const dynamic_pressure = (1/2)*density*(velocity_raw*velocity_raw) * (0.000145038) // pascal to psi conversion

  const stag_temp = (temperature*(1 + (mach_number**2 * (1.4 - 1)/2))) - 273.15 // K to C

  const liftoff_status = fsm_state==-1 ? "N/A" : (fsm_state > 2 ? "GO" : "STBY");
  const burnout_status = fsm_state==-1 ? "N/A" : (fsm_state > 3 ? "GO" : "STBY");
  const cont_status = motor_cont > 3 ? "GO" : "NOGO"

  // TODO
  const coast_status = fsm_state==-1 ? "N/A" : (fsm_state == 3 ? "STBY" : "N/A")

  return (
    <>
      <div className='telemetry-view'>
        <FlightCountTimer />

        <ValueGroup label={"Telemetry Data"} hidden={!has_telem}>
            <SingleValue label={"State"} value={state_int_to_state_name(fsm_state)} unit={""}></SingleValue>
            <MultiValue
                label={"Gyroscopic"}
                titles={["Tilt", "Tilt @ burnout", "Roll Rate"]}
                values={[angle.toFixed(2), angle.toFixed(2), "ND"]}
                units={["°", "°", "°/s"]}
            />

            <MultiValue
                label={"Dynamics"}
                titles={["Altitude (Baro)", "Velocity", "Acceleration"]}
                values={[baro_alt.toFixed(1), velocity.toFixed(2), accel_norm.toFixed(2)]}
                units={[getUnit("distance"), getUnit("velocity"), getUnit("acceleration")]}
            />

            <MultiValue
                label={""}
                titles={["Mach", "Dynamic Pressure", "Stag Temp"]}
                values={[mach_number.toFixed(2), dynamic_pressure.toFixed(2), stag_temp.toFixed(0)]}
                units={["", getUnit("pressure"), "°C"]}
            />

            <ValueGroup label={"Rocket Tilt"}>

              <div className='str-angle-visualaid'>
                <div>
                  <AngleGauge angle={angle} limit={22} />
                </div>
                <div className='str-angle-visualaid-stat'>
                  <span className='shrink-text'>Motor Ignition Criteria</span>
                  <StatusDisplay label={"Liftoff"} status={liftoff_status}></StatusDisplay>
                  <StatusDisplay label={"Burnout"} status={burnout_status}></StatusDisplay>
                  <StatusDisplayWithValue label={"Angle"} status={has_telem ? (angle < 22 ? "GO" : "NOGO") : "N/A"} value={has_telem ? `${angle.toFixed(1)}<22°` : "no data"}></StatusDisplayWithValue>
                  <StatusDisplayWithValue label={"Continuity"} status={cont_status} value={motor_cont.toFixed(2) + "V"}></StatusDisplayWithValue>
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
