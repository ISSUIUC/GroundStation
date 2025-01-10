import { useState } from 'preact/hooks'
import './app.css'
import React, { useContext, useEffect } from 'react';
import { GSSDataProvider, useTelemetry } from './components/dataflow/gssdata.jsx'
import { StructuresView } from './components/views/StructuresView.jsx';
import { Breadcrumb } from './components/reusable/Breadcrumb.jsx';
import { Navbar } from './components/reusable/Navbar.jsx';
import { FullTelemetryView } from './components/views/FullTelemetryView.jsx';
import { SystemHealthView } from './components/views/SystemHealthView.jsx';


function ShowIf({condition, children}) {
  if(condition) {
    return children;
  } else {
    return <></>;
  }
}

export function App() {
  const [currentStream, setCurrentStream] = useState("sustainer");
  const [currentTab, setCurrentTab] = useState("default");

  return (
    <>
      <GSSDataProvider default_stream={currentStream}>
        <Navbar streamCallback={setCurrentStream} currentStream={currentStream} tabCallback={setCurrentTab} currentTab={currentTab} />
        <div className='main-content'>
          <ShowIf condition={currentTab === "default"}>
            <FullTelemetryView />
          </ShowIf>

          <ShowIf condition={currentTab === "structures"}>
            <StructuresView />
          </ShowIf>

          <ShowIf condition={currentTab === "sys_diag"}>
            <SystemHealthView />
          </ShowIf>
        </div>
        
        <Breadcrumb />
      </GSSDataProvider>
    </>
  )
}
