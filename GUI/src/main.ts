import { ipcRenderer } from "electron";
import { Chart, ChartConfiguration } from 'chart.js';

const led_button = document.getElementById("Blink");
const color_change = <HTMLButtonElement>document.getElementById("color");
const htmlcolorelement = document.getElementById("contrast");
const stylesheetopt = <HTMLLinkElement>document.getElementById("style");
let contrast = false;
let time = 9;

// ALL VALUES ARE DEMO FOR NOW BUT THESE ARE THE constIABLES THAT WILL BE PASSED TO THE CHART
const DP_LOWGM = [40, 20, 20, 60, 60, 120, 120, 125, 105, 110];
const DP_LOWGG = [31, 35, 36, 43, 47, 54, 56, 59, 63, 65];
const DP_LOWGA = [31, 36, 38, 42, 44, 49, 51, 55, 59, 62];
const DP_GPS = [67, 76, 98, 122, 74, 96, 90, 118, 69, 126];
const DP_KX134 = [111, 114, 119, 99, 62, 118, 108, 125, 84, 90];
const DP_H3LIS331DL = [76, 127, 91, 67, 99, 102, 61, 125, 79, 66];
const DP_BAROMETER = [1140, 1179, 1338, 1353, 1554, 1571, 1666, 1754, 1885, 1999];

// X-AXIS LABELS CAN BE REMOVED LATER
let labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateData(LOWGM: number, LOWGG: number, LOWGA: number, GPS: number, KX134: number, H3LIS331DL: number, BAROMETER: number) {
    labels.splice(0, 1);
    time++;
    labels.push(time.toString());

    const chart_arr = [
        {chart: charts.baro_altitude, val: BAROMETER},
        {chart: charts.gps, val: GPS},
        {chart: charts.highg_h3l_accel, val: H3LIS331DL},
        {chart: charts.highg_kx_accel, val: KX134},
        {chart: charts.lowgimu_accel, val: LOWGA},
        {chart: charts.lowgimu_gyro, val: LOWGG},
        {chart: charts.lowgimu_mag, val: LOWGM}
    ]

    chart_arr.forEach(
        c => {
            const {chart, val} = c;
            const arr = chart.data.datasets[0].data;
            for (let i = 0; i < 9; i++) {
                arr[i] = arr[i+1];
            }
            arr[arr.length - 1] = val;
            chart.update();
        }
    )
}

led_button.addEventListener('click', () => {
    destroy_charts();
    charts = setup_charts();
})

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

function setup_charts() {
    return {
        lowgimu_accel: make_chart("lowgimuA", "LowG IMU acceleration", DP_LOWGA),
        lowgimu_gyro: make_chart("lowgimuG", "LowG IMU gyroscope", DP_LOWGG),
        lowgimu_mag: make_chart("lowgimuM", "LowG IMU magnetometer", DP_LOWGM),
        gps: make_chart("gps", "GPS altitude", DP_GPS),
        highg_kx_accel: make_chart("kx134", "kx134 acceleration", DP_KX134),
        highg_h3l_accel: make_chart("H3LIS331DL", "H3L acceleration", DP_H3LIS331DL),
        baro_altitude: make_chart("barometer", "Barometer altitude", DP_BAROMETER)
    };
}

function destroy_charts() {
    charts.lowgimu_accel.destroy();
    charts.lowgimu_gyro.destroy();
    charts.lowgimu_mag.destroy();
    charts.gps.destroy();
    charts.highg_kx_accel.destroy();
    charts.highg_h3l_accel.destroy();
    charts.baro_altitude.destroy();
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
    
    updateData(m["LSM_IMU_mx"], m["LSM_IMU_gx"], m["LSM_IMU_ax"], m["gps_lat"], m["KX_IMU_ax"], m["H3L_IMU_ax"], m["barometer_alt"]);
    
});

setInterval(()=>{
    const c = Math.cos(Math.random());
    updateData(c,c,c,c,c,c,c);
}, 100)