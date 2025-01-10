import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function ws_url() {
    return window.location.hostname + ":5000";
}


const GSSData = React.createContext({});
const GSSChannel = React.createContext("sustainer");

const socket = io(ws_url(), {
    transports: ['websocket']
});

export function GSSDataProvider({ children, default_stream }) {
    const [value, setValue] = useState({});
    
    useEffect(async () => {
        socket.on('mqtt_message', (data) => {
            let json_data = JSON.parse(data)
            if(json_data["metadata"]["type"] === "telemetry" || json_data["metadata"]["type"] === "gss_health") {
                // valid telemetry packet
                let channel = json_data["metadata"]["stream"]

                setValue(prevData => {
                    let new_state = {...prevData};
                    new_state[channel] = json_data;
                    return new_state;
                })
            }
            if(json_data["metadata"]["type"] === "gss_msg") {
                // Not a telemetry packet, just set the necessary values in the "GSS" channel
                setValue(prevData => {
                    let ns = json_data["data"];
                    console.log("prevdata", prevData);
                    if(prevData["GSS"]) {
                        ns = {...prevData["GSS"], ...json_data["data"]}
                    }

                    let new_state = {...prevData};
                    new_state["GSS"] = ns;
                    return new_state;
                })

            }


        });

        return () => {
            socket.disconnect();
        }
    }, [])

    return (
        <GSSChannel.Provider value={default_stream}>
            <GSSData.Provider value={value}>
                {children}
            </GSSData.Provider>
        </GSSChannel.Provider>
    )
}

export function useGSSWebsocket() {
    /**
     * Returns a function that encodes and sends a message to the GSS server. Does not auto-publish to MQTT
     */

    const send = (data_string) => {
        socket.emit("gss", data_string);
    }

    return send;
}

export function useGSSMQTT() {
    /**
     * Returns a function that encodes and sends a js object as JSON data to the GSS server. Wraps it in additional metadata to send the data to the network as well.
     */

    const sendws = useGSSWebsocket();
    const send = (channel_name, js_object) => {
        // Accepts only a string
        const payload = {"source": "gss-frontend", "type": "mqtt-autosend", "stream": channel_name, "data": JSON.stringify(js_object)};
        sendws(JSON.stringify(payload));
    }

    return send;
}

export function useSyncGlobalVars() {
    /**
     * Returns a function that lets you synchronize global variables between gss-frontend instances
     */
    const send_mqtt = useGSSMQTT()
    const sync = (js_object) => {
        send_mqtt("Common", js_object);
    }

    return sync;
}

export function useChannel() {
    return React.useContext(GSSChannel);
}

export function useTelemetry(telem_code=undefined, metadata=false) {
    // telemetry code system:
    // Passing in a telemetry code basically indicates what value you are trying to access from the telemetry system.
    // Since our telemetry is shared between booster/sustainer/common/etc networks, you need to specify which network you are accessing
    // This is done with the leading @prefix/, such as @booster/, @sustainer/, followed by the code for the given value.
    // For instance, to get sustainer highG_ax, you would pass "@sustainer/highG_ax".
    // If the packet structure is nested, then you can access further down values using the . separator. EX: "@sustainer/highG.ax"

    // Starting a telemetry code with '/' will indicate to use the currently selected "default", set at the top level by the GSS provider.
    // This allows you to contextually switch which stream you are accessing depending on the value of the GSSStream react context.
    // I.E: Setting GSSstream to "booster" will automatically transliterate "/value.highG_ax" to "@booster/value.highG_ax"

    const value = React.useContext(GSSData);

    if(telem_code === undefined) {
        return value;
    }

    if(telem_code[0] === "/") {
        const gss_default_channel = React.useContext(GSSChannel);
        telem_code = "@" + gss_default_channel + telem_code;
    }

    // Get prefix
    const channel_regex = /^@(.*)\// // This matches the @.../ pattern, and returns the inner part (...) as a capture group
    const channel_match = telem_code.match(channel_regex)
    if(channel_regex === null) {
        return "NOCHAN"
    }


    if(!value[channel_match[1]]) {
        return null // The data not being present is valid, but returns null here so that the caller can handle it by short circuiting.
    }

    // Since telemetry packets are split into "metadata" and "data" we automatically target "data" here for ease of readibility, unless specified otherwise
    let r_valuetype = metadata ? "metadata" : "data";

    // The exception is for the "GSS" channel.
    let r_value = value[channel_match[1]]
    if(channel_match[1] !== "GSS") {
        r_value = r_value[r_valuetype];
    }
    
    
    let tree = telem_code.slice(channel_match[0].length).split(".");
    for (let i = 0; i < tree.length; i++) {
        r_value = r_value[tree[i]];
        if(r_value === undefined) {
            console.warn("Telemetry code " + telem_code + " is invalid, no data found at " + tree[i]);
            return null; // Code not being here is also valid, but let's warn the user since maybe they made a typo
            
        }
    }

    return r_value;
}
