import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'
import { video_server_url } from "../dataflow/gssdata.jsx"

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';

export function VideoView() {

  const video_url = video_server_url("/video_stream");

  return (
    <>
      <div className='telemetry-view'>
        <FlightCountTimer />

        <img src={"http://" + video_url} />


      </div>
    </>
  )
}
