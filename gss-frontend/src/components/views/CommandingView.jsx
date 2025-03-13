import React, { useEffect, useState } from 'react';
import { requestCommandFeedback, useChannel, useGSSMQTTCMD, useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata.jsx'
import { ValueGroup } from '../reusable/ValueDisplay.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';
import { state_int_to_state_name } from '../dataflow/midasconversion.jsx';
import { getSetting } from '../dataflow/settings.jsx';

function getUnixTimestamp(year, month, day, hours, minutes, seconds) {
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  const timestampInMilliseconds = date.getTime();
  return timestampInMilliseconds;
}


export function CommandingView() {
  // Taken from breadcrumb.jsx to set pyro visibility in LOS/no-LOS
  const t_published = useTelemetry("/time_published", true);
  const [isLOS, setisLOS] = useState(false);
  const [has_pass, set_has_pass] = useState(false);

  const current_channel = useChannel();
  const send_mqtt = useGSSMQTTCMD();

  const cont_channels = Math.round(useTelemetry("/value.pyro_a") || 0);
  const fsm_state = Math.round(useTelemetry("/value.FSM_State") || 0);
  const is_pyro_test = (fsm_state == 1)

  // getUnixTimestamp(2025, 3, 12, 14, 30, 0)

  useEffect(() => {

    let user_pin_pass = +prompt("[pin input] Input commanding pin");

    // lol.
    if(user_pin_pass == 4455) {
      set_has_pass(true);
    } else {
      set_has_pass(false);
    }

  }, [])

  if(!has_pass) {
    return <>Unauthorized</>;
  }


  const send_telem_cmd = (raw_cmd) => {
    // Determine which channel to send it to
    let channel = "_dump";
    if(current_channel === "sustainer") {
      channel = "Control-Sustainer";
    } else if(current_channel === "booster") {
      channel = "Control-Booster";
    }

    send_mqtt(channel, {"type": "telemetry_command", "raw": raw_cmd})
  }

  useEffect(() => {
      if(t_published == null) {
        setisLOS(true);
        return;
      }
      setisLOS(false);
      let los_check = setTimeout(() => {
          setisLOS(true);
      }, 2000);

      return () => {
          clearTimeout(los_check);
      }
  }, [t_published])

  // Timer setup
  const [tvalue, set_timer_val] = useState(0);
  const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
  const sync_vars = useSyncGlobalVars();

  const set_timer = (time_s) => {
    const d = time_s*1000
    const cur_time = Date.now();
    set_timer_val(d);
    sync_vars({"countdown_t0": cur_time + d, "countdown_t0_paused": true, "countdown_t0_paused_value": d});
    
  }

  const toggle_pause = () => {
    const cur_time = Date.now();

    let pv = true;
    if(timer_paused != null) {
      pv = !timer_paused;
    }

    sync_vars({"countdown_t0": cur_time + tvalue, "countdown_t0_paused_value": tvalue, "countdown_t0_paused": pv});
  }

  const allow_pyro_always = getSetting("allow_no_cont_pyro");
  let pyro_en = ( (cont_channels > 0) || allow_pyro_always ) && is_pyro_test;
  // let pyro_en = allow_pyro_always;

  return (
    <>
      <div className='telemetry-view'>
        <FlightCountTimer set_callback={set_timer_val} />

        <ValueGroup label={"Launch Abort"} hidden={isLOS} hidden_label_text='NO CONNECTION'>
          <GSSButton variant={"red"} onClick={() => {
            send_telem_cmd("SAFE");
            sync_vars({"countdown_t0":  Date.now(), "countdown_t0_paused": true, "countdown_t0_paused_value": 0});
            requestCommandFeedback("ABORT");
          }} disabled={isLOS}>
            ABORT
          </GSSButton>
        </ValueGroup>

        <ValueGroup label={"MIDAS Pyro"} hidden={isLOS} hidden_label_text='NO CONNECTION'>
        <span className='shrink-text'>WARNING: Ensure area is clear before initiating pyro test</span>
          <div className='gss-horizontal-group-sb gss-horizontal-small-restack'>
            <div className='gss-horizontal-group'>
              <GSSButton variant={"blue"} onClick={() => {
                send_telem_cmd("SAFE");
                requestCommandFeedback("SAFE");
              }}>
                FORCE SAFE
              </GSSButton>

              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("PT");
                requestCommandFeedback("PYRO_TEST");
              }}>
                PYRO TEST
              </GSSButton>
            </div>

            <div className='gss-horizontal-group'>
              <div>
                <div className='gss-center-text gss-text-dim'>
                  Channels:
                </div>
                <GSSButton variant={"red"} disabled={!pyro_en} onClick={() => {
                  send_telem_cmd("PA");
                  requestCommandFeedback("FIRE A");
                }}>
                  Fire A
                </GSSButton>
              </div>

              <div>
                <div className='gss-center-text gss-text-dim'>
                {cont_channels}
                </div>
                <GSSButton variant={"red"} disabled={!pyro_en} onClick={() => {
                  send_telem_cmd("PB");
                  requestCommandFeedback("FIRE B");
                }}>
                  Fire B
                </GSSButton>
              </div>

              <div>
                <div className='gss-center-text gss-text-dim'>
                  State:
                </div>
                <GSSButton variant={"red"} disabled={!pyro_en} onClick={() => {
                  send_telem_cmd("PC");
                  requestCommandFeedback("FIRE C");
                }}>
                  Fire C
                </GSSButton>
              </div>

              <div>
                <div className='gss-center-text gss-text-dim'>
                  {fsm_state}
                </div>
                <GSSButton variant={"red"} disabled={!pyro_en} onClick={() => {
                  send_telem_cmd("PD");
                  requestCommandFeedback("FIRE D");
                }}>
                  Fire D
                </GSSButton>
              </div>
            </div>
          </div>
        </ValueGroup>

        <ValueGroup label={"MIDAS Control"} hidden={isLOS} hidden_label_text='NO CONNECTION'>
          <div className='gss-horizontal-group-sb gss-horizontal-small-restack'>
            <div className='gss-horizontal-group'>
              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("RESET_KF");
                requestCommandFeedback("RESET KF");
              }}>
                RESET KF
              </GSSButton>

              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("CAMON");
                requestCommandFeedback("CAM: ON");
              }}>
                CAM ON
              </GSSButton>

              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("CAMOFF");
                requestCommandFeedback("CAM: OFF");
              }}>
                CAM OFF
              </GSSButton>

              <GSSButton variant={"blue"} onClick={() => {
                send_telem_cmd("VMUXT");
                requestCommandFeedback("TOGGLE VMUX");
              }}>
                CAM OFF
              </GSSButton>
            </div>

            <div className='gss-horizontal-group'>
              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("SAFE");
                requestCommandFeedback("SAFE");
              }}>
                FORCE SAFE
              </GSSButton>
              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("IDLE");
                requestCommandFeedback("PAD");
              }}>
                FORCE PAD
              </GSSButton>
              <GSSButton variant={"red"} disabled={true} onClick={() => {
                let launch_confirm = confirm("ARE YOU SURE ABOUT THIS?\n\n(OK) - Initiate Launch Sequencing\n(CANCEL) - Cancel Operation");
                if(launch_confirm) {
                  send_telem_cmd("IDLE");
                  requestCommandFeedback("PAD");

                  // For stargazer we will use T-1:00
                  const cur_time = Date.now();
                  const t0_time = cur_time + (60*1000)
                  sync_vars({"countdown_t0": t0_time, "countdown_t0_paused": false, "countdown_t0_paused_value": t0_time});
                }
              }}>
                INITIATE LAUNCH SEQUENCE
              </GSSButton>
            </div>
          </div>

        </ValueGroup>

        <ValueGroup label={"Timer Control"}>
          <div className='gss-horizontal-group'>

            <GSSButton variant={"yellow"} onClick={toggle_pause}>
              Toggle Pause / Unpause
            </GSSButton>

            <GSSButton onClick={() => {
              sync_vars({"countdown_t0": Date.now(), "countdown_t0_paused": false, "countdown_t0_paused_value": Date.now()});
            }}>
              0:00 (NO PAUSE)
            </GSSButton>

            <GSSButton onClick={() => {set_timer(30)}}>
              0:30
            </GSSButton>

            <GSSButton onClick={() => {set_timer(90)}}>
              1:00
            </GSSButton>

            <GSSButton onClick={() => {set_timer(90)}}>
              5:00
            </GSSButton>

            <GSSButton onClick={() => {
              let time_input = +prompt("[time input] Input countdown clock setting in SECONDS.");
              set_timer(time_input);
            }}>
              CUSTOM
            </GSSButton>

            <GSSButton onClick={() => {
              let time_input = +prompt("[time input] Enter amount in seconds. Timer will be set to T-0, + the value entered");
              sync_vars({"countdown_t0": getUnixTimestamp(2025, 3, 15, 8, 0, 0) + time_input*1000, "countdown_t0_paused": false, "countdown_t0_paused_value": getUnixTimestamp(2025, 3, 15, 8, 0, 0) + time_input*1000});
            }}>
              Set T-0 CUSTOM
            </GSSButton>

            <GSSButton onClick={() => {
              sync_vars({"countdown_t0": getUnixTimestamp(2025, 3, 15, 8, 0, 0), "countdown_t0_paused": false, "countdown_t0_paused_value": getUnixTimestamp(2025, 3, 15, 8, 0, 0)});
            }}>
              Set T-0 ACTUAL
            </GSSButton>

          </div>
        </ValueGroup>


      </div>
    </>
  )
}
