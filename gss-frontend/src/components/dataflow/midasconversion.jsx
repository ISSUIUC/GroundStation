
const MIDAS_STATES = [
    "STATE_IDLE",
    "STATE_FIRST_BOOST",
    "STATE_BURNOUT",
    "STATE_COAST",
    "STATE_APOGEE",
    "STATE_DROGUE_DEPLOY",
    "STATE_DROGUE",
    "STATE_MAIN_DEPLOY",
    "STATE_MAIN",
    "STATE_LANDED",
    "STATE_SUSTAINER_IGNITION",
    "STATE_SECOND_BOOST",
    "STATE_FIRST_SEPARATION",
    "FSM_STATE_COUNT"          
]

export function state_int_to_state_name(state) {
    if(state == -1) {
        return "NO_DATA"
    }
    let st_name = MIDAS_STATES[state].replace("STATE_", "")
    return st_name
}