// Additional stuff for streaming!

import "./StreamCommon.css"
import iss_worm from "/iss-worm.png"


export function GenericISSStreamComingSoon({ event_text }) {
    return (
        <div className="generic-stream-fullscreen-wrapper">
            <script src="https://unpkg.com/@h0rn0chse/night-sky/dist/bundle.min.js"></script>
            <night-sky
                id="nightSky"
                layers="8"
                density="1"
                velocity-x="20"
                velocity-y="8"
                star-color="#AAA"
            >
            </night-sky>
            <div className="generic-stream-center">
                <div className="generic-stream-block">
                    <div>
                        <img id="generic-stream-img" src={iss_worm} alt={"LOGO"} height={800} />
                    </div>
                    <div>
                        {event_text}
                    </div>
                    <div className="generic-start-soon">
                        Livestream Starting Soon!
                    </div>
                </div>
            </div>
        </div>
    );
}

export function GenericISSStreamGoodbye({event_text}) {
    return (
        <div className="generic-stream-fullscreen-wrapper">
            <script src="https://unpkg.com/@h0rn0chse/night-sky/dist/bundle.min.js" ></script>
            <night-sky
                id="nightSky"
                layers="8"
                density="1"
                velocity-x="20"
                velocity-y="8"
                star-color="#AAA"
            >
            </night-sky>
            <div className="generic-stream-center">
                <div className="generic-stream-block">
                    <div>
                        
                        <img id="generic-stream-img" src={iss_worm} alt={"LOGO"} height={800} />
                        
                    </div>
                    <div>
                        {event_text}
                    </div>
                    <div className="generic-start-soon">
                        Thank You for Participating!
                    </div>
                </div>
            </div>
        </div>
    );
}