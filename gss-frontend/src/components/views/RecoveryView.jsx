import React, { useContext, useEffect, useState } from 'react';
import { GSSDataProvider, useGSSMQTT, useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata.jsx'
import { Timer } from '../reusable/Timer.jsx'
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import { AngleGauge } from '../spec/AngleGauge.jsx'

import '../reusable/Common.css';
import { FlightCountTimer } from '../spec/FlightCountTimer.jsx';
import GSSButton from '../reusable/Button.jsx';
import { PositionDataProvider, useGPSPosition } from '../dataflow/positioning.jsx';

function Thingy() {

  const [pos_available, position] = useGPSPosition();

  const c = pos_available ? <p>{JSON.stringify(position)}</p> : <b>not available : {JSON.stringify(position)}</b>

  return <>
    {c}
  </>
}

export function RecoveryView() {
  

  
  return (
    <>
      <div className='telemetry-view'>
        <FlightCountTimer />

        <PositionDataProvider>
          <Thingy />
        </PositionDataProvider>

        <h1> Map Coords</h1>
      </div>
    </>
  )
}
