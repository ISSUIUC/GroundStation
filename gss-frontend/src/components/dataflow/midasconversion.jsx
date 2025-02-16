
const MIDAS_STATES = [
    "STATE_SAFE",
    "STATE_PYRO_TEST",
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

const GPS_FIX_TYPES = [
    "NODAT",
    "NOFIX",
    "DRECK",
    "GPS2D",
    "GPS3D",
    "G3DDR"
]

export const SUSTAINER_TILT_LOCKOUT = 36 // degrees
export const SUSTAINER_COAST_TIME = 3 // seconds

export function fix_type_int_to_fix_type_name(fix_type) {
    if(fix_type >= GPS_FIX_TYPES.length) {
        return "INVAL"
    }
    return GPS_FIX_TYPES[fix_type+1]
}

export function state_int_to_state_name(state) {
    if(state == -1) {
        return "NO_DATA"
    }
    if(!MIDAS_STATES[state]) {
        return "ERR"
    }
    let st_name = MIDAS_STATES[state].replace("STATE_", "")
    return st_name
}