import * as fs from "fs";
import { SerialResponse } from "./serialResponse";

const CSV_HEADERS = ["Time", "LSM_IMU_mx", "LSM_IMU_my", "LSM_IMU_mz",
"LSM_IMU_gx", "LSM_IMU_gy", "LSM_IMU_gz",
"LSM_IMU_ax", "LSM_IMU_ay", "LSM_IMU_az",
"gps_lat", "gps_long", "gps_alt",
"KX_IMU_ax", "KX_IMU_ay", "KX_IMU_az",
"H3L_IMU_ax", "H3L_IMU_ay", "H3L_IMU_az",
"barometer_alt", "sign", "signal"]

export default class CSVWriter {
    file_name: string;
    constructor(file_name: string){
        this.file_name = file_name;
        fs.appendFileSync(this.file_name, CSV_HEADERS.join(',') + '\n');
    }

    write_data(data: SerialResponse){ 
        if(data.type == "data"){
            const m = data.value;

            const str = `${new Date()},${CSV_HEADERS.slice(1).map(c=>(m as any)[c]).join(',')}\n`;
            fs.appendFileSync(this.file_name, str);
        }
    }
}