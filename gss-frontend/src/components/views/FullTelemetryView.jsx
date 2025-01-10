import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSetGlobalVar, useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';

export function FullTelemetryView() {
  // Taken from breadcrumb.jsx to set pyro visibility in LOS/no-LOS
  const t_published = useTelemetry("/time_published", true);
  const [isLOS, setisLOS] = useState(false);

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
        <FlightCountTimer 
            set_callback={set_timer_val}
        />

        <ValueGroup label={"Launch Abort"} hidden={isLOS} hidden_label_text='NO CONNECTION'>
          <GSSButton variant={"red"} onClick={() => {
            set_timer(0);
          }} disabled={isLOS}>
            ABORT
          </GSSButton>
        </ValueGroup>

        <ValueGroup label={"MIDAS Pyro"} hidden={isLOS} hidden_label_text='NO CONNECTION'>
        <span className='shrink-text'>WARNING: Ensure area is clear before initiating pyro test</span>
          <div className='gss-horizontal-group-sb gss-horizontal-small-restack'>
            <div className='gss-horizontal-group'>
              <GSSButton variant={"blue"} onClick={toggle_pause}>
                FORCE SAFE
              </GSSButton>

              <GSSButton variant={"yellow"} onClick={toggle_pause}>
                PYRO TEST
              </GSSButton>
            </div>

            <div className='gss-horizontal-group'>
              <div>
                <div className='gss-center-text gss-text-dim'>
                  OPEN
                </div>
                <GSSButton variant={"red"} disabled={true} onClick={() => {set_timer(10)}}>
                  Fire A
                </GSSButton>
              </div>

              <div>
                <div className='gss-center-text gss-text-dim'>
                  OPEN
                </div>
                <GSSButton variant={"red"} disabled={true} onClick={() => {set_timer(10)}}>
                  Fire B
                </GSSButton>
              </div>

              <div>
                <div className='gss-center-text gss-text-dim'>
                  OPEN
                </div>
                <GSSButton variant={"red"} disabled={true} onClick={() => {set_timer(10)}}>
                  Fire C
                </GSSButton>
              </div>

              <div>
                <div className='gss-center-text gss-text-dim'>
                  OPEN
                </div>
                <GSSButton variant={"red"} disabled={true} onClick={() => {set_timer(10)}}>
                  Fire D
                </GSSButton>
              </div>
            </div>
          </div>
        </ValueGroup>

        <ValueGroup label={"MIDAS Control"} hidden={isLOS} hidden_label_text='NO CONNECTION'>
          <div className='gss-horizontal-group-sb gss-horizontal-small-restack'>
            <div className='gss-horizontal-group'>
              <GSSButton variant={"yellow"} onClick={toggle_pause}>
                RESET KF
              </GSSButton>

              <GSSButton variant={"yellow"} onClick={toggle_pause}>
                RESET ORIENTATION
              </GSSButton>
            </div>

            <div className='gss-horizontal-group'>
              <GSSButton variant={"yellow"} onClick={toggle_pause}>
                FORCE SAFE
              </GSSButton>
              <GSSButton variant={"yellow"} onClick={toggle_pause}>
                FORCE PAD
              </GSSButton>
              <GSSButton variant={"red"} onClick={() => {
                let launch_confirm = confirm("ARE YOU SURE ABOUT THIS?\n\n(OK) - Initiate Launch Sequencing\n(CANCEL) - Cancel Operation");
                if(launch_confirm) {
                  alert("boom");
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
