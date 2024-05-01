import * as fs from "fs";
import { SerialResponse } from "./serialResponse";

export const CSV_HEADERS = [
        "Time", 
        "gps_lat",
        "gps_long",
        "gps_alt",
        "TEMP",
        "KX_IMU_ax",
        "KX_IMU_ay",
        "KX_IMU_az",
        "STE_ALT",
        "STE_VEL",
        "STE_ACC",
        "STE_APO",
        "BNO_YAW",
        "BNO_PITCH",
        "BNO_ROLL",
        "IMU_gx",
        "IMU_gy",
        "IMU_gz",
        "IMU_mx",
        "IMU_my",
        "IMU_mz",
        "FSM_state",
        "sign",
        "RSSI",
        "Voltage",
        "frequency",
        "flap_extension",
        "pressure",
        "Continuity1",
        "Continuity2",
        "Continuity3",
        "Continuity4",
        "TelemLatency",
        "Pyro1",
        "Pyro2",
        "Pyro3",
        "Pyro4",
        "Pyro1Firing",
        "Pyro2Firing",
        "Pyro3Firing",
        "Pyro4Firing",
        "is_booster",
        "sense_pyro",
        
    ]



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