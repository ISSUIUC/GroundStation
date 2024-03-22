export type SerialResponse = 
{
    type: "data",
    value: {
        gps_lat:number,
        gps_long:number,
        gps_alt:number,
        
        KX_IMU_ax:number,
        KX_IMU_ay:number,
        KX_IMU_az:number,
        STE_ALT:number,
        STE_VEL:number,
        STE_ACC:number,
        STE_APO: number,
        BNO_YAW: number,
        BNO_PITCH: number,
        BNO_ROLL: number,
        IMU_gx:number,
        IMU_gy:number,
        IMU_gz:number,
        IMU_mx:number,
        IMU_my:number,
        IMU_mz:number,
        FSM_state:number,
        sign:string,
        RSSI:number,
        Voltage:number,
        frequency:number,
        flap_extension:number,
        pressure: number,
        TEMP:number,
        Continuity1: number,
        Continuity2: number,
        Continuity3: number,
        Continuity4: number,
        TelemLatency: number,
        Pyro1: number,
        Pyro2: number,
        Pyro3: number,
        Pyro4: number,
        Pyro1Firing: number,
        Pyro2Firing: number,
        Pyro3Firing: number,
        Pyro4Firing: number,
        is_booster: boolean,
        sense_pyro: number,

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