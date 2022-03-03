export type SerialResponse = 
{
    type: "data",
    value: {
        gps_lat:number,
        gps_long:number,
        gps_alt:number,
        barometer_alt:number,
        KX_IMU_ax:number,
        KX_IMU_ay:number,
        KX_IMU_az:number,
        H3L_IMU_ax:number,
        H3L_IMU_ay:number,
        H3L_IMU_az:number,
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
        signal:number
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