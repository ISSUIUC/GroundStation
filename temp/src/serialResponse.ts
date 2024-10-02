export type SerialResponse = 
{
    type: "data",
    value: {
        barometer_altitude:number,
        altitude:number,
        latitude:number,
        longitude:number,
        highG_ax:number,
        highG_ay:number,
        highG_az:number,
        battery_voltage:number,
        FSM_state:number,
        tilt_angle: number,
        frequency: number,
        RSSI: number,
        sat_count: number
    }
} | {
    type: "command_success"
} | {
    type: "command_error"
    error: string
} | {
    type: "init_error",
    error: string,
} | {
    type: "init_success",
} | {
    type: "freq_error",
    error: string,
} | {
    type: "receive_error",
    error: string,
} | {
    type: "freq_success",
    frequency: number,
}