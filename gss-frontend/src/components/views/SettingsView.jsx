import React, { useContext, useEffect, useState } from 'react';
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import ChoiceSelect from '../reusable/ChoiceSelect.jsx';
import { addRecalculator, CLEAR_T_DATA_FUNC, clearCalculators } from '../dataflow/gssdata.jsx';
import { CONVERSIONS, getSetting, setSetting } from '../dataflow/settings.jsx';
import GSSButton from '../reusable/Button.jsx';
 



export function SettingsView() {
  // This view handles user settings
  const [unit_system, setUnitSystem] = useState(getSetting("unit_system"));
  const [accel_unit_type, setAccelUnitType] = useState(getSetting("accel_unit_type"));
  const [display_type, setDisplayType] = useState(getSetting("display_type"));
  const [autosync, setAutosync] = useState(getSetting("autosync"));
  const [global_sync, setGlobalsync] = useState(getSetting("global_sync"));
  const [data_retention, setDataRetention] = useState(getSetting("data_retention"));
  const [retain_on_reload, setRetainOnReload] = useState(getSetting("retain_on_reload"));

  const handle_unit_translation = (set_units) => {
    switch(set_units) {
        case "METRIC":
            console.log("Converting to metric units...");
            clearCalculators(); // Default is metric so we don't need to add any translators
            break;
        case "IMPERIAL":
            console.log("Converting to imperial units...");
            clearCalculators();
            ["booster", "sustainer"].forEach((stg) => {
                addRecalculator(`@${stg}/value.barometer_altitude`, CONVERSIONS.METER_TO_FEET);
                addRecalculator(`@${stg}/value.highG_ax`, CONVERSIONS.METER_TO_FEET);
                addRecalculator(`@${stg}/value.highG_ay`, CONVERSIONS.METER_TO_FEET);
                addRecalculator(`@${stg}/value.highG_az`, CONVERSIONS.METER_TO_FEET);
            })
            break;
        default:
            clearCalculators() // Use metric by default
    }
  }

  let selected_data_retention_choice = "ALL";
  switch(data_retention) {
    case -1:
      break;
    case 100:
      selected_data_retention_choice = "LAST 100";
      break;
    case 50:
      selected_data_retention_choice = "LAST 50";
      break;
    case 15:
      selected_data_retention_choice = "LAST 15";
      break;
    default:
      break;
  }

  return (
    <>
      <div className='telemetry-view'>

        <ValueGroup label={"Display Settings"}>
            <ChoiceSelect text="Unit System" alt_text='Determines what units to use when displaying telemetry' choices={["METRIC", "IMPERIAL"]} onSelect={(c) => {
                setSetting("unit_system", c)
                setUnitSystem(c);
                handle_unit_translation(c);
            }} curchoice={unit_system}/>

            <ChoiceSelect text="Acceleration Unit" alt_text='Determines whether to override the acceleration unit' choices={["Force G", "Unit System"]} onSelect={(c) => {
                setSetting("accel_unit_type", c)
                setAccelUnitType(c);
            }} curchoice={accel_unit_type}/>

            <ChoiceSelect text="Contrast Display" alt_text='Determines which display mode to use (Requires page re-render!)' choices={["LIGHT", "DARK"]} onSelect={(c) => {
              setSetting("display_type", c);
              setDisplayType(c);
            }} curchoice={display_type}/>

        </ValueGroup>

        <ValueGroup label={"Control Settings"}>
          <ChoiceSelect text="Follow Autosync" alt_text='Whether autosync / clear calls made by the sequencer should be followed' choices={["AUTOSYNC", "NO SYNC"]} onSelect={(c) => {
            setSetting("autosync", c === "AUTOSYNC");
            setAutosync(c === "AUTOSYNC");
          }} curchoice={autosync ? "AUTOSYNC" : "NO SYNC"}/>

          <ChoiceSelect text="Global Sync" alt_text='Enables variable syncing (WARNING: Testing only, do not disable.)' choices={["ENABLED", "DISABLE"]} onSelect={(c) => {
            setSetting("global_sync", c === "ENABLED");
            setGlobalsync(c === "ENABLED");
          }} curchoice={global_sync ? "ENABLED" : "DISABLE"}/>

        </ValueGroup>

        <ValueGroup label={"Data Settings"}>
          <ChoiceSelect text="Data Retention" alt_text='Determines how many datapoints to save' choices={["ALL", "LAST 100", "LAST 50", "LAST 15"]} onSelect={(c) => {
            let new_val = -1;
            switch(c) {
              case "ALL":
                break;
              case "LAST 100":
                new_val = 100;
                break;
              case "LAST 50":
                new_val = 50;
                break;
              case "LAST 15":
                new_val = 15;
                break;
              default:
                break;
            }

            setDataRetention(new_val);
            setSetting("data_retention", new_val)

          }} curchoice={selected_data_retention_choice}/>

          <ChoiceSelect text="Retain on reload" alt_text='Attempt to retain telemetry data through reloads' choices={["RETAIN", "DISCARD"]} onSelect={(c) => {
            setSetting("retain_on_reload", c === "RETAIN");
            setRetainOnReload(c === "RETAIN")
          }} curchoice={retain_on_reload ? "RETAIN" : "DISCARD"}/>

          <GSSButton onClick={() => {CLEAR_T_DATA_FUNC()}} variant={"blue"} disabled={false}>Clear Data</GSSButton>
        </ValueGroup>

      </div>
    </>
  )
}
