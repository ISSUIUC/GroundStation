import { ipcRenderer } from "electron";
import { Chart, ChartConfiguration } from 'chart.js';

const led_button = document.getElementById("Blink");
const color_change = <HTMLButtonElement>document.getElementById("color");
const htmlcolorelement = document.getElementById("contrast");
const stylesheetopt = <HTMLLinkElement>document.getElementById("style");
let contrast = false;
let time = 9;

// ALL VALUES ARE DEMO FOR NOW BUT THESE ARE THE constIABLES THAT WILL BE PASSED TO THE CHART
const DP_LOWGMX = [0,0,0,0,0,0,0,0,0,0];
const DP_LOWGMY = [0,0,0,0,0,0,0,0,0,0];
const DP_LOWGMZ = [0,0,0,0,0,0,0,0,0,0];

const DP_LOWGAX = [0,0,0,0,0,0,0,0,0,0];
const DP_LOWGAY = [0,0,0,0,0,0,0,0,0,0];
const DP_LOWGAZ = [0,0,0,0,0,0,0,0,0,0];

const DP_LOWGGX = [0,0,0,0,0,0,0,0,0,0];
const DP_LOWGGY = [0,0,0,0,0,0,0,0,0,0];
const DP_LOWGGZ = [0,0,0,0,0,0,0,0,0,0];

const DP_GPS_LAT = [0,0,0,0,0,0,0,0,0,0];
const DP_GPS_LONG = [0,0,0,0,0,0,0,0,0,0];
const DP_GPS_ALT = [0,0,0,0,0,0,0,0,0,0];

const DP_KXAX = [0,0,0,0,0,0,0,0,0,0];
const DP_KXAY = [0,0,0,0,0,0,0,0,0,0];
const DP_KXAZ = [0,0,0,0,0,0,0,0,0,0];

const DP_H3LAX = [0,0,0,0,0,0,0,0,0,0];
const DP_H3LAY = [0,0,0,0,0,0,0,0,0,0];
const DP_H3LAZ = [0,0,0,0,0,0,0,0,0,0];

const DP_BAROMETER = [0,0,0,0,0,0,0,0,0,0];

// X-AXIS LABELS CAN BE REMOVED LATER
let labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateData(LOWGMX: number, LOWGMY: number, LOWGMZ: number,  
    LOWGGX: number, LOWGGY: number, LOWGGZ: number, 
    LOWGAX: number, LOWGAY: number, LOWGAZ: number, 
    GPS_LAT: number, GPS_LONG: number, GPS_ALT: number, 
    KXAX: number, KXAY: number, KXAZ: number,
     H3LAX: number, H3LAY: number, H3LAZ: number, 
     BAROMETER: number) {
    labels.splice(0, 1);
    time++;
    labels.push(time.toString());

    const chart_arr = [
        {chart: charts.baro_altitude, val: [BAROMETER]},
        {chart: charts.gps, val: [GPS_LAT, GPS_LONG, GPS_ALT]},
        {chart: charts.highg_h3l_accel, val: [H3LAX, H3LAY, H3LAZ]},
        {chart: charts.highg_kx_accel, val: [KXAX, KXAY, KXAZ]},
        {chart: charts.lowgimu_accel, val: [LOWGAX, LOWGAY, LOWGAZ]},
        {chart: charts.lowgimu_gyro, val: [LOWGGX, LOWGGY, LOWGGZ]},
        {chart: charts.lowgimu_mag, val: [LOWGMX, LOWGMY, LOWGMZ]}
    ]

    chart_arr.forEach(
        c => {
            const {chart, val} = c;
            for (let coord = 0; coord < val.length; coord++) {
                const arr = chart.data.datasets[coord].data;
                for (let i = 0; i < 9; i++) {
                    arr[i] = arr[i+1];
                }
                arr[arr.length - 1] = val[coord];
            }
            
            chart.update();
        }
    )
}

led_button.addEventListener('click', () => {
    let newdataset = addNewDataset(DP_LOWGMX, "lowGimumx");
    charts.lowgimu_accel.data.datasets.push(newdataset);
    charts.lowgimu_accel.update();
})

function addNewDataset(data: number[], name: string) {
    let newdataset = {
        label: name,
        borderColor: 'rgb(99, 255, 132)',
        data: data
    }
    return newdataset;
}

color_change.addEventListener('click', () => {
    if (!contrast) {
        stylesheetopt.href = "highcontrast.css";
        contrast = true;
    } else {
        stylesheetopt.href = "style.css";
        contrast = false;
    }
})

let charts: {
    lowgimu_accel?: Chart,
    lowgimu_gyro?: Chart,
    lowgimu_mag?: Chart,
    gps?: Chart,
    highg_kx_accel?: Chart,
    highg_h3l_accel?: Chart,
    baro_altitude?: Chart
}

let data = {
    
}

function make_chart(element_id: string, name: string, data: number[]): Chart {
    const canvas = <HTMLCanvasElement>document.getElementById(element_id);
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, make_chart_options(name, data));
}

function make_chart_options(name: string, data: number[]): ChartConfiguration {
    return {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: name,
                borderColor: 'rgb(255, 99, 132)',
                data: data
            }]
        },
        // Configuration options go here
        options: {
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 5,
                    top: 5,
                    right: 5,
                    bottom: 5
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: name,
                    color: 'white'
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'white'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    }
                }
            }
        }
    }
}

function make_chart_multiaxis(element_id: string, name: string, datax: number[], datay: number[], dataz: number[]): Chart {
    const canvas = <HTMLCanvasElement>document.getElementById(element_id);
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, make_chart_options_multiaxis(name, datax, datay, dataz));
}

function make_chart_options_multiaxis(name: string, datax: number[], datay: number[], dataz: number[]): ChartConfiguration {
    return {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: name,
                borderColor: 'rgb(255, 99, 132)',
                data: datax
            },
            {
                label: name,
                borderColor: 'rgb(99, 132, 255)',
                data: datay
            },
            {
                label: name,
                borderColor: 'rgb(132, 255, 99)',
                data: dataz
            },
            ]
        },
        // Configuration options go here
        options: {
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 5,
                    top: 5,
                    right: 5,
                    bottom: 5
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: name,
                    color: 'white'
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'white'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    }
                }
            }
        }
    }
}

function setup_charts() {
    return {
        lowgimu_accel: make_chart_multiaxis("lowgimuA", "LowG IMU acceleration", DP_LOWGAX, DP_LOWGAY, DP_LOWGAZ),
        lowgimu_gyro: make_chart_multiaxis("lowgimuG", "LowG IMU gyroscope", DP_LOWGGX, DP_LOWGGY, DP_LOWGGZ),
        lowgimu_mag: make_chart_multiaxis("lowgimuM", "LowG IMU magnetometer", DP_LOWGMX, DP_LOWGMY, DP_LOWGMZ),
        gps: make_chart_multiaxis("gps", "GPS altitude", DP_GPS_LAT, DP_GPS_LONG, DP_GPS_ALT),
        highg_kx_accel: make_chart_multiaxis("kx134", "kx134 acceleration", DP_KXAX, DP_KXAY, DP_KXAZ),
        highg_h3l_accel: make_chart_multiaxis("H3LIS331DL", "H3L acceleration", DP_H3LAX, DP_H3LAY, DP_H3LAZ),
        baro_altitude: make_chart("barometer", "Barometer altitude", DP_BAROMETER)
    };
}

window.onload = function () {

    /* LOADS ALL THE CHARTS AFTER WINDOW LOADS 
    BUT WILL BE MOVED LATER TO AFTER GSS 
    ESTABLISHES CONNNECTION TO FEATHER */

    charts = setup_charts();
    set_current_time();
    setInterval(set_current_time, 1000);
}

function set_current_time() {
    const date = new Date(); 
    const hh = date.getHours();
    const mm = date.getMinutes();
    const ss = date.getSeconds();

    const session = hh <= 12 ? "AM" : "PM";
    const hour = (hh < 10) ? "0" + hh : hh;
    const minute = (mm < 10) ? "0" + mm : mm;
    const second = (ss < 10) ? "0" + ss : ss;
      
    const time = `${hour}:${minute}:${second} ${session}`;
    document.getElementById("clock").innerText = time; 
}

ipcRenderer.on("connection", (event, message) => {
    const masterJSON = JSON.parse(message);
    const m = masterJSON["value"];
    /* Finds the Raw Telemetry Table 
    finds the field by ID and assigns 
    the value to the div */
    for (var key in m) {
        document.getElementById(key).innerText = m[key];
    }
    
    updateData(m["LSM_IMU_mx"], m["LSM_IMU_my"], m["LSM_IMU_mz"], 
                m["LSM_IMU_gx"], m["LSM_IMU_gy"], m["LSM_IMU_gz"],
                m["LSM_IMU_ax"], m["LSM_IMU_ay"], m["LSM_IMU_az"], 
                m["gps_lat"], m["gps_long"], m["gps_alt"], 
                m["KX_IMU_ax"], m["KX_IMU_ay"], m["KX_IMU_az"],
                m["H3L_IMU_ax"], m["H3L_IMU_ay"], m["H3L_IMU_az"],
                m["barometer_alt"]);
    
});

setInterval(()=>{
    const c = Math.cos(Math.random());
    const d = Math.sin(Math.random());
    const e = Math.tan(Math.random());
    updateData(c,d,e,c,d,e,c,d,e,c,d,e,c,d,e,c,d,e,c);
}, 100)