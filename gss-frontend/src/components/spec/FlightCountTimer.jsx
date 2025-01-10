import React, { useState } from 'react';
import { useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'

import '../reusable/Common.css';

export function FlightCountTimer({ set_callback }) {
  // Specific instance of Timer that responds to the countdown_t0 variables in the global GSS context.
  const timer_val = useTelemetry("@GSS/countdown_t0");
  const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
  const timer_pvalue = useTelemetry("@GSS/countdown_t0_paused_value")

  let timer_hidden = false;
  if(timer_val == null) {
    timer_hidden = true;
  }


  return (
    <Timer 
        mode={timer_paused ? "set" : "t-"}
        targetTime={timer_paused ? timer_pvalue : timer_val}
        neg_t_text={"T- "}
        pos_t_text={"T+ "}
        timer_name={"Flight Count"}
        hidden={timer_hidden}
        paused={timer_paused}
        set_callback={set_callback}
    />
  )
}
