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
      <div className='telemetry-view-flex'>
        <FlightCountTimer />

        <ValueGroup label={"Live Feed"} style_override={{"flex-grow": "2"}} child_style_override={{"height": "100%"}}>
          <iframe src="http://10.193.148.153:5002" className='live-feed-iframe' allowtransparency="true" />
        </ValueGroup>
      </div>
    </>
  )
}
