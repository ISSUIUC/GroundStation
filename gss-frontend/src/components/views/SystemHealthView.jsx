import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useTelemetry, useFCRoster, useFCSources, useFCAliases, formatSN } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue, GenericDisplay } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'

// Tick once per second so the Reporting Sources "last seen" age stays current
// even when no new packets land.
function useNowTick(intervalMs = 1000) {
    const [now, setNow] = useState(() => Date.now() / 1000);
    useEffect(() => {
        const iv = setInterval(() => setNow(Date.now() / 1000), intervalMs);
        return () => clearInterval(iv);
    }, [intervalMs]);
    return now;
}

const SOURCE_STALE_S = 5;   // older than this and we caution-color the row
const SOURCE_DEAD_S = 15;   // older than this and we error-color the row

function FCAliasRow({ sn, alias, setAlias }) {
    const [draft, setDraft] = useState(alias ?? "");
    useEffect(() => { setDraft(alias ?? ""); }, [alias]);

    const commit = () => {
        if ((draft ?? "") !== (alias ?? "")) setAlias(sn, draft);
    };

    return (
        <div style={{display: "flex", alignItems: "center", gap: 12, padding: "6px 10px"}}>
            <span style={{fontFamily: "monospace", minWidth: 100}}>MIDAS {formatSN(sn)}</span>
            <input
                type="text"
                placeholder="(no alias)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.05)",
                    color: "#e0e0e0",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontFamily: "monospace",
                    fontSize: "0.9em",
                }}
            />
        </div>
    );
}

function FCSourceRow({ sourceId, info, now }) {
    const safeInfo = (info && typeof info === 'object') ? info : {};
    const age = safeInfo.time_published != null ? (now - safeInfo.time_published) : null;
    let ageColor = "#888";
    let ageText = "—";
    if (age != null) {
        if (age >= SOURCE_DEAD_S) ageColor = "#e06060";
        else if (age >= SOURCE_STALE_S) ageColor = "#e0c060";
        else ageColor = "#60c060";
        ageText = `${age.toFixed(1)}s ago`;
    }
    const reported = (Array.isArray(safeInfo.serials) ? safeInfo.serials : []).filter(s => s != null).map(formatSN);
    return (
        <div style={{display: "flex", alignItems: "center", gap: 12, padding: "6px 10px", fontFamily: "monospace", fontSize: "0.9em"}}>
            <span style={{flex: 1, overflow: "hidden", textOverflow: "ellipsis"}}>{sourceId}</span>
            <span style={{color: "#aaa"}}>SNs: {reported.length ? reported.join(", ") : "(none)"}</span>
            <span style={{color: ageColor, minWidth: 90, textAlign: "right"}}>{ageText}</span>
        </div>
    );
}

function FlightComputerSection() {
    const rosterRaw = useFCRoster();
    const sourcesRaw = useFCSources();
    const [aliasesRaw, setAlias] = useFCAliases();
    const now = useNowTick(1000);

    const roster = Array.isArray(rosterRaw) ? rosterRaw : [];
    const sources = (sourcesRaw && typeof sourcesRaw === 'object') ? sourcesRaw : {};
    const aliases = (aliasesRaw && typeof aliasesRaw === 'object') ? aliasesRaw : {};

    const sourceIds = Object.keys(sources).sort();

    return (
        <ValueGroup label={"MIDAS"}>
            <ValueGroup label={"Active"} use_smaller_labels>
                {roster.length === 0
                    ? <div style={{padding: "8px 10px", color: "#888"}}>No MIDAS reported active.</div>
                    : roster.map(sn => (
                        <FCAliasRow key={sn} sn={sn} alias={aliases[sn]} setAlias={setAlias} />
                    ))
                }
            </ValueGroup>
            <ValueGroup label={"Reporting Sources"} use_smaller_labels>
                {sourceIds.length === 0
                    ? <div style={{padding: "8px 10px", color: "#888"}}>No standalone processes reporting.</div>
                    : sourceIds.map(id => (
                        <FCSourceRow key={id} sourceId={id} info={sources[id]} now={now} />
                    ))
                }
            </ValueGroup>
        </ValueGroup>
    );
}

const health_to_percent = (health_telem) => {
  if(!health_telem) {
    return 0;
  }
  let total = health_telem.success + health_telem.fail + health_telem.waiting;
  let health = health_telem.success / total;

  return health * 100;
}

const health_to_status = (health_telem) => {
  if(!health_telem) {
    return "N/A"
  }
  let health = health_to_percent(health_telem);

  if(health < 20) {
    return "ERR"
  } else if(health < 50) {
    return "WARN"
  } else if(health < 80) {
    return "CAUT"
  } else {
    return "OK"
  }
}

const parse_health = (health_telem) => {
  if(!health_telem) {
    return {success: 0, fail: 0, waiting: 0, percent: 0, status: "N/A"};
  }
  return {success: health_telem.success, 
    fail: health_telem.fail, 
    waiting: health_telem.waiting, 
    percent: health_to_percent(health_telem), 
    status: health_to_status(health_telem)};
}

export function SystemHealthView() {
  // This view handles backend system health

  //For latency data
  const [last_booster_tvalue, setLastBoosterTValue] = React.useState(0);
  const [last_sustainer_tvalue, setLastSustainerTValue] = React.useState(0);
  const [last_booster_latency, setLastBoosterLatency] = React.useState(0);
  const [last_sustainer_latency, setLastSustainerLatency] = React.useState(0);
  const [booster_is_los, setBoosterIsLOS] = React.useState(false);
  const [sustainer_is_los, setSustainerIsLOS] = React.useState(false);

  let mqtt_health = useTelemetry("@gss_combiner/mqtt.MQTT main");
  let sus_telem_health_sources = useTelemetry("@gss_combiner/sustainer_telem");
  let boo_telem_health_sources = useTelemetry("@gss_combiner/booster_telem");

  // Generate data for sustainer and booster telemetry sources
  if(sus_telem_health_sources != null) {
    let temp = []
    Object.keys(sus_telem_health_sources).forEach((key) => {
      let health = parse_health(sus_telem_health_sources[key]);
      health["name"] = key;
      temp.push(health);
    })
    sus_telem_health_sources = temp;
  } else {
    sus_telem_health_sources = [];
  }

  if(boo_telem_health_sources != null) {
    let temp = []
    Object.keys(boo_telem_health_sources).forEach((key) => {
      let health = parse_health(boo_telem_health_sources[key]);
      health["name"] = key;
      temp.push(health);
    })
    boo_telem_health_sources = temp;
  } else {
    boo_telem_health_sources = [];
  }

  const mqtt_health_status = parse_health(mqtt_health);

  // Generate latency data
  const booster_t_published = useTelemetry("@booster/time_published", true);
  const sustainer_t_published = useTelemetry("@sustainer/time_published", true);
  const booster_rssi = useTelemetry("@booster/value.RSSI") || 0;
  const sustainer_rssi = useTelemetry("@sustainer/value.RSSI") || 0;

  const booster_has_telem = (booster_t_published != null);
  const sustainer_has_telem = (sustainer_t_published != null);

  useEffect(() => {
      if(booster_t_published != last_booster_tvalue) {
          const t_pubished_js = Math.floor(booster_t_published*1000)
          const deltatime = Math.abs(Date.now() - t_pubished_js)
          setLastBoosterLatency(deltatime);
      }

      if(booster_t_published != null) {
        setBoosterIsLOS(false);
      }

      let los_check = setTimeout(() => {
        setBoosterIsLOS(true);
      }, 2000);

      return () => {
          clearTimeout(los_check);
      }
  }, [booster_t_published])

  useEffect(() => {
      if(sustainer_t_published != last_sustainer_tvalue) {
          const t_pubished_js = Math.floor(sustainer_t_published*1000)
          const deltatime = Math.abs(Date.now() - t_pubished_js)
          setLastSustainerLatency(deltatime);
      }

      if(sustainer_t_published != null) {
        setSustainerIsLOS(false);
      }
      
      let los_check = setTimeout(() => {
        setSustainerIsLOS(true);
      }, 2000);

      return () => {
          clearTimeout(los_check);
      }
  }, [sustainer_t_published])

  let booster_comm_status = (booster_is_los || !booster_has_telem) ? "LOS" : (last_booster_latency < 200 ? "OK" : "CAUT");
  let booster_rssi_status = "N/A";
  if(!booster_is_los && booster_has_telem) {

    if(booster_rssi < -80) {
      booster_rssi_status = "CAUT";
    }

    if(booster_rssi < -115) {
      booster_rssi_status = "WARN";
    }

    if(booster_rssi < 0) {
      booster_rssi_status = "OK"
    }
  }
  
  let sustainer_comm_status = (sustainer_is_los || !sustainer_has_telem) ? "LOS" : (last_sustainer_latency < 200 ? "OK" : "CAUT");
  let sustainer_rssi_status = "N/A";
  if(!sustainer_is_los && sustainer_has_telem) {
    if(sustainer_rssi < -80) {
      sustainer_rssi_status = "CAUT";
    }

    if(sustainer_rssi < -115) {
      sustainer_rssi_status = "WARN";
    }

    if(sustainer_rssi < 0) {
      sustainer_rssi_status = "OK"
    }
  }

  return (
    <>
      <div className='telemetry-view'>

        <FlightComputerSection />

        <ValueGroup label={"Communication"} hidden={booster_t_published === null && sustainer_t_published === null}>

          <ValueGroup label={"Booster"}>
            <StatusDisplay label={"Booster Signal"} status={(booster_is_los || !booster_has_telem) ? "LOS" : "OK"} />
            <StatusDisplayWithValue label={"Latency"} status={booster_comm_status} value={(booster_is_los || !booster_has_telem) ? "LOS" : last_booster_latency + "ms"} />
            <StatusDisplayWithValue label={"RSSI"} status={booster_rssi_status} value={booster_rssi} />
          </ValueGroup>

          <ValueGroup label={"Sustainer"}>
            <StatusDisplay label={"Sustainer Signal"} status={(sustainer_is_los || !sustainer_has_telem) ? "LOS" : "OK"} />
            <StatusDisplayWithValue label={"Latency"} status={sustainer_comm_status} value={(sustainer_is_los || !sustainer_has_telem) ? "LOS" : last_sustainer_latency + "ms"} />
            <StatusDisplayWithValue label={"RSSI"} status={sustainer_rssi_status} value={sustainer_rssi} />
          </ValueGroup>


        </ValueGroup>

        <ValueGroup label={"MQTT"} hidden={mqtt_health === null}>
          <StatusDisplayWithValue label={"System Health (overall)"} status={mqtt_health_status.status} value={mqtt_health_status.percent.toFixed(1) + "%"} />

            <MultiValue
                label={"Health Breakdown"}
                titles={['Success', 'Failure', 'Waiting']}
                values={[mqtt_health_status.success, mqtt_health_status.fail, mqtt_health_status.waiting]}
                units={["", "", ""]}
                label_colors={["#00aa00", "#aa0000", "#aaaa00"]}
            />
            
        </ValueGroup>

        {sus_telem_health_sources.map((health_status) => {
          return (
            <ValueGroup label={health_status.name}>
              <StatusDisplayWithValue label={"Telem Source Health"} status={health_status.status} value={health_status.percent.toFixed(1) + "%"} />

              <MultiValue
                  label={"Health Breakdown"}
                  titles={['Success', 'Failure', 'Waiting']}
                  values={[health_status.success, health_status.fail, health_status.waiting]}
                  units={["", "", ""]}
                  label_colors={["#00aa00", "#aa0000", "#aaaa00"]}
              />
            </ValueGroup>
          )
        })}

        {boo_telem_health_sources.map((health_status) => {
          return (
            <ValueGroup label={health_status.name}>
              <StatusDisplayWithValue label={"Telem Source Health"} status={health_status.status} value={health_status.percent.toFixed(1) + "%"} />

              <MultiValue
                  label={"Health Breakdown"}
                  titles={['Success', 'Failure', 'Waiting']}
                  values={[health_status.success, health_status.fail, health_status.waiting]}
                  units={["", "", ""]}
                  label_colors={["#00aa00", "#aa0000", "#aaaa00"]}
              />
            </ValueGroup>
          )
        })}

      </div>
    </>
  )
}
