import { useTelemetry, useTelemetryRaw, useTelemetrySnapshot } from "./gssdata";
import React, { useEffect } from 'react';

// {"event_name": {set: false, setfunc: func(), callbacks: [ ... ]}}
let SEQUENCER_EVENTS = {}

export const __SEQUENCER_UPDATE_EVENTS = (snapshot) => {
    // Check every sequencer event
    Object.keys(SEQUENCER_EVENTS).forEach((key) => {
        if(SEQUENCER_EVENTS[key].set) {
            return;
        }

        if(SEQUENCER_EVENTS[key].setfunc(snapshot)) {
            console.log(`SEQUENCER: Event "${key}" set.`);
            SEQUENCER_EVENTS[key].set = true;
            console.log(SEQUENCER_EVENTS[key])

            SEQUENCER_EVENTS[key].callbacks.forEach((cb) => {
                console.log("FIRING CALLBACK!")
                cb();
            })
        }
    })
}

export const add_event_listener = (event_name, callback) => {
    if(!SEQUENCER_EVENTS[event_name]) {
        console.error(`SEQUENCER: ${event_name} does not exist.`);
        return;
    }

    console.log(`SEQUENCER: Registered event listener for ${event_name}`)
    SEQUENCER_EVENTS[event_name].callbacks.push(callback);
    console.log("Added event listener:", SEQUENCER_EVENTS[event_name])
}

export const add_sequencer_event = (event_name, test_func) => {
    // event_name : Tag with which to define the event
    // test_func : Function to determine if the event should "fire". return TRUE if the event should fire.
    // test_func takes in a telemetry snapshot.

    console.log(`SEQUENCER: event ${event_name} registered`)
    SEQUENCER_EVENTS[event_name] = {set: false, setfunc: test_func, callbacks: []};
}

export const SequencerSetupElement = () => {
    // React element that, on mount, sets up global sequencer events. USE WITHIN THE GSS DATA PROVIDER CONTEXT!
    
    

    useEffect(() => {
        console.log("SEQUENCER: Setting up events..")
        add_sequencer_event("sustainer_burnout", (snapshot) => {
            const fsm_state = useTelemetrySnapshot(snapshot, "@sustainer/value.FSM_State");
            return fsm_state == 3;
        })

        add_sequencer_event("sustainer_ignition", (snapshot) => {
            const fsm_state = useTelemetrySnapshot(snapshot, "@sustainer/value.FSM_State");
            return fsm_state == 12;
        })
    }, []);

    return <></>;
}