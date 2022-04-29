export type SerialResponse = 
{
    type: "data",
    value: {
        gps_lat:number,
        gps_long:number,
        gps_alt:number,
        barometer_alt:number,
        TEMP:number,
        H3L_IMU_ax:number,
        H3L_IMU_ay:number,
        H3L_IMU_az:number,
        STE_ALT:number,
        STE_VEL:number,
        STE_ACC:number,
        LSM_IMU_ax:number,
        LSM_IMU_ay:number,
        LSM_IMU_az:number,
        LSM_IMU_gx:number,
        LSM_IMU_gy:number,
        LSM_IMU_gz:number,
        LSM_IMU_mx:number,
        LSM_IMU_my:number,
        LSM_IMU_mz:number,
        FSM_state:number,
        sign:string,
        RSSI:number,
        Voltage:number,
        frequency:number,
        flap_extension:number,
        STE_APO: number
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