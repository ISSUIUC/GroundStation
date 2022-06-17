import * as fs from "fs";
import { SerialResponse } from "./serialResponse";

const CSV_HEADERS = ["Time", "LSM_IMU_mx", "LSM_IMU_my", "LSM_IMU_mz",
    "LSM_IMU_gx", "LSM_IMU_gy", "LSM_IMU_gz",
    "LSM_IMU_ax", "LSM_IMU_ay", "LSM_IMU_az",
    "gps_lat", "gps_long", "gps_alt",
    "STE_ALT", "STE_VEL", "STE_ACC", "STE_APO",
    "KX_IMU_ax", "KX_IMU_ay", "KX_IMU_az", "TEMP", 
    "barometer_alt", "sign", "FSM_state", "RSSI", 
    "Voltage", "frequency", "flap_extension", "pressure"]



export default class CSVWriter {
    file_name: string;
    constructor(file_name: string) {
        this.file_name = file_name;
        fs.appendFileSync(this.file_name, CSV_HEADERS.join(',') + '\n');
    }

    write_data(data: SerialResponse) {
        if (data.type == "data") {
            const m = data.value;
            let time = refresh_time();
            const str = `${time},${CSV_HEADERS.slice(1).map(c => (m as any)[c]).join(',')}\n`;
            fs.appendFileSync(this.file_name, str);
        }
    }
    read_data() {
        return fs.readFileSync(this.file_name, "utf8");
    }

    readDemo(filename: string) {
        return fs.readFileSync(filename, 'utf-8');
    }
}

export function readDemo(filename: string) {
    return fs.readFileSync(filename, 'utf-8');
}

function refresh_time() {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    let ms = date.getMilliseconds();

    let session = hh <= 12 ? "AM" : "PM";
    let hour = (hh < 10) ? "0" + hh : hh;
    let minute = (mm < 10) ? "0" + mm : mm;
    let second = (ss < 10) ? "0" + ss : ss;

    let time = year + "-" + month + "-" + day + "--" + hour + "-" + minute + "-" + second + "-" + ms;
    return time;
}