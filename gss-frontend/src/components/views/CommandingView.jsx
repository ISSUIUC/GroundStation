import React, { useEffect, useState } from 'react';
import { useChannel, useGSSMQTTRaw, useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata.jsx'
import { ValueGroup } from '../reusable/ValueDisplay.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';
import { state_int_to_state_name } from '../dataflow/midasconversion.jsx';


export function CommandingView() {
  // Taken from breadcrumb.jsx to set pyro visibility in LOS/no-LOS
  const t_published = useTelemetry("/time_published", true);
  const [isLOS, setisLOS] = useState(false);

  const current_channel = useChannel();
  const send_mqtt = useGSSMQTTRaw();

  const cont_channels = Math.round(useTelemetry("/value.pyro_a") || 0);
  const fsm_state = Math.round(useTelemetry("/value.FSM_State") || 0);
  const is_pyro_test = (fsm_state == 1)
  const pyro_en = (cont_channels > 0) && is_pyro_test;



  const send_telem_cmd = (raw_cmd) => {
    // Determine which channel to send it to
    let channel = "_dump";
    if(current_channel === "sustainer") {
      channel = "Control-Sustainer";
    } else if(current_channel === "booster") {
      channel = "Control-Booster";
    }

    send_mqtt(channel, {"type": "telemetry_command", "raw": `${raw_cmd} \n`})
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


  return (
    <>
      <div className='telemetry-view'>
        <FlightCountTimer set_callback={set_timer_val} />

        <ValueGroup label={"Launch Abort"} hidden={isLOS} hidden_label_text='NO CONNECTION'>
          <GSSButton variant={"red"} onClick={() => {
            send_telem_cmd("SAFE");
            sync_vars({"countdown_t0":  Date.now(), "countdown_t0_paused": true, "countdown_t0_paused_value": 0});
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
              }}>
                FORCE SAFE
              </GSSButton>

              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("PT");
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
              }}>
                RESET KF
              </GSSButton>

              <GSSButton variant={"yellow"} disabled={true} onClick={() => {
                // this doesn't do anything yet
              }}>
                CAM TOGGLE
              </GSSButton>
            </div>

            <div className='gss-horizontal-group'>
              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("SAFE");
              }}>
                FORCE SAFE
              </GSSButton>
              <GSSButton variant={"yellow"} onClick={() => {
                send_telem_cmd("IDLE");
              }}>
                FORCE PAD
              </GSSButton>
              <GSSButton variant={"red"} onClick={() => {
                let launch_confirm = confirm("ARE YOU SURE ABOUT THIS?\n\n(OK) - Initiate Launch Sequencing\n(CANCEL) - Cancel Operation");
                if(launch_confirm) {
                  send_telem_cmd("IDLE");

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

            <GSSButton onClick={() => {set_timer(10)}}>
              Set to 0:10
            </GSSButton>

            <GSSButton onClick={() => {set_timer(60)}}>
              Set to 1:00
            </GSSButton>

            <GSSButton onClick={() => {set_timer(120)}}>
              Set to 2:00
            </GSSButton>

            <GSSButton onClick={() => {
              let time_input = +prompt("[time input] Input countdown clock setting in SECONDS.");
              set_timer(time_input);
            }}>
              Set CUSTOM
            </GSSButton>

          </div>
        </ValueGroup>


      </div>
    </>
  )
}
