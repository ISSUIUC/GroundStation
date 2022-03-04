import * as fs from "fs";
import { SerialResponse } from "./serialResponse";

const CSV_HEADERS = ["Time", "LSM_IMU_mx", "LSM_IMU_my", "LSM_IMU_mz",
    "LSM_IMU_gx", "LSM_IMU_gy", "LSM_IMU_gz",
    "LSM_IMU_ax", "LSM_IMU_ay", "LSM_IMU_az",
    "gps_lat", "gps_long", "gps_alt",
    "KX_IMU_ax", "KX_IMU_ay", "KX_IMU_az",
    "H3L_IMU_ax", "H3L_IMU_ay", "H3L_IMU_az",
    "barometer_alt", "sign", "signal"]

const date = new Date();
const year = date.getFullYear();
const month = date.getMonth() + 1;
const day = date.getDate();
const hh = date.getHours();
const mm = date.getMinutes();
const ss = date.getSeconds();
const ms = date.getMilliseconds();

const session = hh <= 12 ? "AM" : "PM";
const hour = (hh < 10) ? "0" + hh : hh;
const minute = (mm < 10) ? "0" + mm : mm;
const second = (ss < 10) ? "0" + ss : ss;

let time = year + "-" + month + "-" + day + "--" + hour + "-" + minute + "-" + second + "-" + ms;

export default class CSVWriter {
    file_name: string;
    constructor(file_name: string) {
        this.file_name = file_name;
        fs.appendFileSync(this.file_name, CSV_HEADERS.join(',') + '\n');
    }

    write_data(data: SerialResponse) {
        if (data.type == "data") {
            const m = data.value;

            const str = `${time},${CSV_HEADERS.slice(1).map(c => (m as any)[c]).join(',')}\n`;
            fs.appendFileSync(this.file_name, str);
        }
    }
}