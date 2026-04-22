import React, { useContext, useEffect, useState } from 'react';
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import ChoiceSelect from '../reusable/ChoiceSelect.jsx';
import { addRecalculator, CLEAR_T_DATA_FUNC, clearCalculators, useGSSWebsocket, useSocketEvent } from '../dataflow/gssdata.jsx';
import { CONVERSIONS, getSetting, setSetting } from '../dataflow/settings.jsx';
import GSSButton from '../reusable/Button.jsx';
import { DataTestButton } from '../spec/DataTest.jsx';
 
export const handle_unit_translation = (set_units) => {
  switch(set_units) {
      case "METRIC":
          console.log("Converting to metric units...");
          clearCalculators(); // Default is metric so we don't need to add any translators
          // except the default conversions!
          break;
      case "IMPERIAL":
          console.log("Converting to imperial units...");
          clearCalculators();
          ["booster", "sustainer"].forEach((stg) => {
              addRecalculator(`@${stg}/value.barometer_altitude`, CONVERSIONS.METER_TO_FEET);
              addRecalculator(`@${stg}/value.altitude`, CONVERSIONS.METER_TO_FEET);
              addRecalculator(`@${stg}/value.kf_velocity`, CONVERSIONS.METER_TO_FEET);
              addRecalculator(`@${stg}/value.kf_position`, CONVERSIONS.METER_TO_FEET);
          })
          break;
      default:
          clearCalculators() // Use metric by default
  }

  ["booster", "sustainer"].forEach((stg) => {
    addRecalculator(`@${stg}/value.highG_ax`, CONVERSIONS.ACCEL_G_TO_UNIT_CONVERSION);
    addRecalculator(`@${stg}/value.highG_ay`, CONVERSIONS.ACCEL_G_TO_UNIT_CONVERSION);
    addRecalculator(`@${stg}/value.highG_az`, CONVERSIONS.ACCEL_G_TO_UNIT_CONVERSION);
  })
}

const ds_field_style = { display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' };
const ds_label_style = { minWidth: 60, fontSize: 13, opacity: 0.8 };
const ds_input_style = { flex: 1, padding: '6px 8px', border: '1px solid #444', background: '#1a1a1a', color: '#eee', borderRadius: 3 };

export function SettingsView() {
  // This view handles user settings
  const [unit_system, setUnitSystem] = useState(getSetting("unit_system"));
  const [accel_unit_type, setAccelUnitType] = useState(getSetting("accel_unit_type"));
  const [display_type, setDisplayType] = useState(getSetting("display_type"));
  const [autosync, setAutosync] = useState(getSetting("autosync"));
  const [global_sync, setGlobalsync] = useState(getSetting("global_sync"));
  const [data_retention, setDataRetention] = useState(getSetting("data_retention"));
  const [retain_on_reload, setRetainOnReload] = useState(getSetting("retain_on_reload"));
  const [allow_nocont_pyro, setAllownocontPyro] = useState(getSetting("allow_no_cont_pyro"));

  // Data source — the local backend's MQTT broker. Source of truth is
  // /app/config/data_source.json; we mirror to localStorage just so the form
  // renders immediately on load before the WS response arrives.
  const [ds_host, setDsHost] = useState(getSetting("data_source_host"));
  const [ds_port, setDsPort] = useState(getSetting("data_source_port"));
  const [ds_eff_host, setDsEffHost] = useState("");
  const [ds_eff_port, setDsEffPort] = useState(1884);
  const [ds_connected, setDsConnected] = useState(false);
  const [ds_degraded, setDsDegraded] = useState(false);
  const [ds_status, setDsStatus] = useState("idle"); // idle | applying | error

  const send_get_ds = useGSSWebsocket("get_datasource");
  const send_update_ds = useGSSWebsocket("update_datasource");

  useSocketEvent("datasource_state", (payload) => {
    try {
      const ds = JSON.parse(payload);
      setDsHost(ds.host || "localhost");
      setDsPort(Number(ds.port) || 1884);
      setDsEffHost(ds.effective_host || "");
      setDsEffPort(Number(ds.effective_port) || 1884);
      setDsConnected(!!ds.connected);
      setDsDegraded(!!ds.degraded);
      setDsStatus("idle");
      setSetting("data_source_host", ds.host || "localhost");
      setSetting("data_source_port", Number(ds.port) || 1884);
    } catch (e) { /* ignore malformed */ }
  });

  useSocketEvent("mqtt_status", (payload) => {
    try {
      const s = JSON.parse(payload);
      setDsConnected(!!s.connected);
      setDsEffHost(s.effective_host || "");
      setDsEffPort(Number(s.effective_port) || 1884);
      setDsDegraded(!!s.degraded);
    } catch (e) { /* ignore malformed */ }
  });

  useSocketEvent("datasource_updated", (payload) => {
    try {
      const r = JSON.parse(payload);
      setDsStatus(r.status === "restarting" ? "applying" : "error");
    } catch (e) {
      setDsStatus("error");
    }
  });

  // Re-fetch on every socket connect (including reconnect after backend restart).
  // Mount-only useEffect wouldn't re-fire when the socket comes back up.
  useSocketEvent("connect", () => {
    send_get_ds("");
  });

  useEffect(() => {
    send_get_ds("");
  }, []);

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

        <ChoiceSelect text="Always allow pyro" alt_text='Whether pyro commands can be sent without continuity' choices={["YES", "NO"]} onSelect={(c) => {
            setSetting("allow_no_cont_pyro", c === "YES");
            setAllownocontPyro(c === "YES");
          }} curchoice={allow_nocont_pyro ? "YES" : "NO"}/>

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
          <DataTestButton />
        </ValueGroup>

        <ValueGroup label={"Data Source"}>
          {ds_degraded && (
            <div style={{
              padding: "8px 12px",
              margin: "4px 0 10px 0",
              border: "1px solid #c93",
              background: "#3a2b0c",
              color: "#fca",
              borderRadius: 3,
              fontSize: 13
            }}>
              Configured broker was unreachable at startup. Backend fell back to the
              local broker. Fix the host/port and click Connect to retry.
            </div>
          )}

          <div style={ds_field_style}>
            <label style={ds_label_style}>Host</label>
            <input
              style={ds_input_style}
              value={ds_host}
              placeholder="localhost"
              onChange={(e) => {
                setDsHost(e.target.value);
                setSetting("data_source_host", e.target.value);
              }}
            />
          </div>
          <div style={ds_field_style}>
            <label style={ds_label_style}>Port</label>
            <input
              style={ds_input_style}
              type="number"
              value={ds_port}
              onChange={(e) => {
                const n = Number(e.target.value) || 1884;
                setDsPort(n);
                setSetting("data_source_port", n);
              }}
            />
          </div>

          <div style={ds_field_style}>
            <label style={ds_label_style}>Status</label>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: ds_status === "applying"
                  ? '#ca3'
                  : ds_connected ? '#4c4' : '#c44',
                flexShrink: 0
              }}/>
              <span style={{ fontSize: 13, opacity: 0.9 }}>
                {ds_status === "applying"
                  ? "Connecting..."
                  : ds_connected
                    ? `Connected to ${ds_eff_host}:${ds_eff_port}`
                    : "Disconnected"}
              </span>
            </div>
          </div>

          <GSSButton
            variant={"blue"}
            disabled={ds_status === "applying"}
            onClick={() => {
              setDsStatus("applying");
              send_update_ds(JSON.stringify({ host: ds_host, port: ds_port }));
            }}
          >
            {ds_status === "applying" ? "Connecting..." : "Connect"}
          </GSSButton>
          {ds_status === "error" && <div style={{color: "#f55", marginTop: 8}}>Update failed — check backend logs.</div>}
        </ValueGroup>

      </div>
    </>
  )
}
