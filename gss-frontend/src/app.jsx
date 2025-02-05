import { useState } from 'preact/hooks'
import './app.css'
import { GSSDataProvider } from './components/dataflow/gssdata.jsx'
import { StructuresView } from './components/views/StructuresView.jsx';
import { Breadcrumb } from './components/reusable/Breadcrumb.jsx';
import { Navbar } from './components/reusable/Navbar.jsx';
import { FullTelemetryView } from './components/views/FullTelemetryView.jsx';
import { SystemHealthView } from './components/views/SystemHealthView.jsx';
import { CommandingView } from './components/views/CommandingView.jsx';
import { RecoveryView } from './components/views/RecoveryView.jsx';
import OverlayController from './components/streamoverlay/OverlayController.jsx';
import { ShowIf, ShowPath, ShowPathExact } from './components/reusable/UtilityComponents.jsx';
import { SettingsView } from './components/views/SettingsView.jsx';
import { VideoView } from './components/views/VideoView.jsx';
import { getSetting } from './components/dataflow/settings.jsx';

import { MapView } from './components/views/MapView.jsx';
import { SequencerSetupElement } from './components/dataflow/sequencer.jsx';
import { CommandFeedback } from './components/spec/CommandFeedback.jsx';

export function App() {
  const [currentStream, setCurrentStream] = useState("sustainer");
  const [currentTab, setCurrentTab] = useState("default");

  const use_light_mode = getSetting("display_type") == "LIGHT"
  console.log(getSetting("display_type"))

  return (
    <div className={`fullscreen ${use_light_mode ? "invert" : ""}`}>
      <GSSDataProvider default_stream={currentStream}>
        <SequencerSetupElement />
        <CommandFeedback />
        {/* Main window */}
        <ShowPathExact path={"/"}>
          <Navbar streamCallback={setCurrentStream} currentStream={currentStream} tabCallback={setCurrentTab} currentTab={currentTab} />
          <div className='main-content'>
            <ShowIf condition={currentTab === "default"}>
              <FullTelemetryView />
            </ShowIf>

            <ShowIf condition={currentTab === "commanding"}>
              <CommandingView />
            </ShowIf>

            <ShowIf condition={currentTab === "structures"}>
              <StructuresView />
            </ShowIf>

            <ShowIf condition={currentTab === "recovery"}>
              <RecoveryView />
            </ShowIf>

            <ShowIf condition={currentTab === "video"}>
              <VideoView />
            </ShowIf>

            <ShowIf condition={currentTab === "sys_diag"}>
              <SystemHealthView />
            </ShowIf>

            <ShowIf condition={currentTab === "settings"}>
              <SettingsView />
            </ShowIf>
          </div>
          
          <Breadcrumb />
        </ShowPathExact>

        <ShowPathExact path={"/map"}>
          <MapView/>
        </ShowPathExact>

        <ShowPath path={"/stream"}>
          <OverlayController />
        </ShowPath>
      </GSSDataProvider>
    </div>
  )
}
