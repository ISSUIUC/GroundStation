import { Chart, ChartComponentLike, ChartConfiguration } from 'chart.js';
import { SerialResponse } from './serialResponse';
import { ServerConnection } from './serverConnection';
import * as fs from 'fs'; //CSV FILE ACTIVITY

// const led_button = document.getElementById("Blink");
// const color_change = <HTMLButtonElement>document.getElementById("color");
// const htmlcolorelement = document.getElementById("contrast");
const stylesheetopt = <HTMLLinkElement>document.getElementById("style");
let contrast = false;
let time = 9;

const starting_length = 100;
// ALL VALUES ARE DEMO FOR NOW BUT THESE ARE THE constIABLES THAT WILL BE PASSED TO THE CHART
const DP_LOWGMX = Array(starting_length).fill(0);
const DP_LOWGMY = Array(starting_length).fill(0);
const DP_LOWGMZ = Array(starting_length).fill(0);

const DP_LOWGAX = Array(starting_length).fill(0);
const DP_LOWGAY = Array(starting_length).fill(0);
const DP_LOWGAZ = Array(starting_length).fill(0);

const DP_LOWGGX = Array(starting_length).fill(0);
const DP_LOWGGY = Array(starting_length).fill(0);
const DP_LOWGGZ = Array(starting_length).fill(0);

const DP_GPS_LAT = Array(starting_length).fill(0);
const DP_GPS_LONG = Array(starting_length).fill(0);
const DP_GPS_ALT = Array(starting_length).fill(0);

const DP_KXAX = Array(starting_length).fill(0);
const DP_KXAY = Array(starting_length).fill(0);
const DP_KXAZ = Array(starting_length).fill(0);

const DP_H3LAX = Array(starting_length).fill(0);
const DP_H3LAY = Array(starting_length).fill(0);
const DP_H3LAZ = Array(starting_length).fill(0);

const DP_BAROMETER = Array(starting_length).fill(0);
const DP_SIGNAL = Array(starting_length).fill(0);

// X-AXIS LABELS CAN BE REMOVED LATER
let labels = Array(starting_length).fill(0).map((_, i) => i);

function updateData(LOWGMX: number, LOWGMY: number, LOWGMZ: number,
    LOWGGX: number, LOWGGY: number, LOWGGZ: number,
    LOWGAX: number, LOWGAY: number, LOWGAZ: number,
    GPS_LAT: number, GPS_LONG: number, GPS_ALT: number,
    KXAX: number, KXAY: number, KXAZ: number,
    H3LAX: number, H3LAY: number, H3LAZ: number,
    BAROMETER: number, SIGNAL: number) {

    // L.marker([GPS_LAT, GPS_LONG]).addTo(map);    
    labels.splice(0, 1);
    time++;
    labels.push(time);

    const chart_arr = [
        { chart: charts.baro_altitude, val: [BAROMETER] },
        { chart: charts.gps, val: [GPS_LAT, GPS_LONG, GPS_ALT] },
        { chart: charts.highg_h3l_accel, val: [H3LAX, H3LAY, H3LAZ] },
        { chart: charts.highg_kx_accel, val: [KXAX, KXAY, KXAZ] },
        { chart: charts.lowgimu_accel, val: [LOWGAX, LOWGAY, LOWGAZ] },
        { chart: charts.lowgimu_gyro, val: [LOWGGX, LOWGGY, LOWGGZ] },
        { chart: charts.lowgimu_mag, val: [LOWGMX, LOWGMY, LOWGMZ] },
        { chart: charts.signal, val: [SIGNAL] }
    ]

    chart_arr.forEach(
        c => {
            const { chart, val } = c;
            for (let coord = 0; coord < val.length; coord++) {
                const arr = chart.data.datasets[coord].data;
                for (let i = 0; i + 1 < arr.length; i++) {
                    arr[i] = arr[i + 1];
                }
                arr[arr.length - 1] = val[coord];
            }

            chart.update();
        }
    )
}
//LED BUTTON HAS BEEN DECOMISIONED
// led_button.addEventListener('click', () => {
//     let newdataset = make_new_dataset(DP_LOWGMX, "lowGimumx");
//     charts.lowgimu_accel.data.datasets.push(newdataset);
//     charts.lowgimu_accel.update();
// })

function make_new_dataset(data: number[], name: string) {
    return {
        label: name,
        borderColor: 'rgb(99, 255, 132)',
        data: data
    }
}



let charts: {
    lowgimu_accel?: Chart,
    lowgimu_gyro?: Chart,
    lowgimu_mag?: Chart,
    gps?: Chart,
    highg_kx_accel?: Chart,
    highg_h3l_accel?: Chart,
    baro_altitude?: Chart,
    signal: Chart
}

let data = {

}

function make_chart(units: string, element_id: string, name: string, data: number[]): Chart {
    const canvas = <HTMLCanvasElement>document.getElementById(element_id);
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, make_chart_options(units, name, [data]));
}

function make_chart_options(units: string, name: string, datasets: number[][]): ChartConfiguration {
    const colors = ['rgb(255, 99, 132)', 'rgb(99, 132, 255)', 'rgb(132, 255, 99)'];

    return {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: datasets.map((d, i) => {
                return {
                    label: name,
                    borderColor: colors[i],
                    data: d
                }
            })
        },
        // Configuration options go here
        options: {
            animation: false,
            maintainAspectRatio: false,
            datasets: {
                line: {
                    pointRadius: 0
                }
            },
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
                    },
                    title: {
                        display: true,
                        text: units,
                        color: '#ffffff',
                        font: {
                            family: 'Causten',
                            size: 14,
                            weight: 'bold',
                            lineHeight: 1.2,
                        }
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    title: {
                        display: true,
                        text: 'Time (seconds)',
                        color: '#ffffff',
                        font: {
                            family: 'Causten',
                            size: 14,
                            weight: 'bold',
                            lineHeight: 1.2,
                        }
                    }
                }
            }
        }
    }
}

function make_chart_multiaxis(units: string, element_id: string, name: string, datax: number[], datay: number[], dataz: number[]): Chart {
    const canvas = <HTMLCanvasElement>document.getElementById(element_id);
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, make_chart_options(units, name, [datax, datay, dataz]));
}

function setup_charts() {
    return {
        lowgimu_accel: make_chart_multiaxis("G", "lowgimuA", "LowG IMU acceleration", DP_LOWGAX, DP_LOWGAY, DP_LOWGAZ),
        lowgimu_gyro: make_chart_multiaxis("DPS", "lowgimuG", "LowG IMU gyroscope", DP_LOWGGX, DP_LOWGGY, DP_LOWGGZ),
        lowgimu_mag: make_chart_multiaxis("Gauss", "lowgimuM", "LowG IMU magnetometer", DP_LOWGMX, DP_LOWGMY, DP_LOWGMZ),
        gps: make_chart_multiaxis("Meters", "gps", "GPS altitude", DP_GPS_LAT, DP_GPS_LONG, DP_GPS_ALT),
        highg_kx_accel: make_chart_multiaxis("G", "kx134", "kx134 acceleration", DP_KXAX, DP_KXAY, DP_KXAZ),
        highg_h3l_accel: make_chart_multiaxis("G", "H3LIS331DL", "H3L acceleration", DP_H3LAX, DP_H3LAY, DP_H3LAZ),
        baro_altitude: make_chart("mbars", "barometer", "Barometer altitude", DP_BAROMETER),
        signal: make_chart("dBmW", "signal", "Signal Strength (RSSI)", DP_SIGNAL)
    };
}

export function run_frontend(serverConnection: ServerConnection, registerables: readonly ChartComponentLike[]) {
    /* LOADS ALL THE CHARTS AFTER WINDOW LOADS 
    BUT WILL BE MOVED LATER TO AFTER GSS 
    ESTABLISHES CONNNECTION TO FEATHER */

    Chart.register(...registerables)

    charts = setup_charts();
    // set_current_time();
    // setInterval(set_current_time, 1000);
    
    serverConnection.on("data", (message) => {
        const masterJSON: SerialResponse = JSON.parse(message);

        if(masterJSON.type == "data"){
            const m = masterJSON["value"];
            /* Finds the Raw Telemetry Table 
            finds the field by ID and assigns 
            the value to the div */
            for (var key in m) {
                document.getElementById(key).innerText = (m as any)[key];
            }
            updateData(m["LSM_IMU_mx"], m["LSM_IMU_my"], m["LSM_IMU_mz"], 
                        m["LSM_IMU_gx"], m["LSM_IMU_gy"], m["LSM_IMU_gz"],
                        m["LSM_IMU_ax"], m["LSM_IMU_ay"], m["LSM_IMU_az"],
                        m["gps_lat"], m["gps_long"], m["gps_alt"], 
                        m["KX_IMU_ax"], m["KX_IMU_ay"], m["KX_IMU_az"],
                        m["H3L_IMU_ax"], m["H3L_IMU_ay"], m["H3L_IMU_az"],
                        m["barometer_alt"], m["signal"]);
        }
        
        if(masterJSON.type == "init_error"){
            alert(masterJSON.error);
        }
    });

}

function get_current_time_full() {
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

    // let time = `${hour}:${minute}:${second}:${ms}`; WEBPAGE FORMAT
    let time = year + "-" + month + "-" + day + "--" + hour + "-" + minute + "-" + second + "-" + ms;
    return time;
    // document.getElementById("clock").innerText = time;
}

function get_current_time() {
    const date = new Date();
    const hh = date.getHours();
    const mm = date.getMinutes();
    const ss = date.getSeconds();
    const ms = date.getMilliseconds();

    const session = hh <= 12 ? "AM" : "PM";
    const hour = (hh < 10) ? "0" + hh : hh;
    const minute = (mm < 10) ? "0" + mm : mm;
    const second = (ss < 10) ? "0" + ss : ss;

    let time = hour + "-" + minute + "-" + second + "-" + ms;
    return time
}

//begin experimental progress bar
const progress = document.getElementById('progress')
const prev = <HTMLButtonElement>document.getElementById('prev')
const next = <HTMLButtonElement>document.getElementById('next')
const circles = document.querySelectorAll('.circle')

let currentActive = 1

next.addEventListener('click', () => {
    currentActive++

    if (currentActive > circles.length) {
        currentActive = circles.length
    }

    update()
})

prev.addEventListener('click', () => {
    currentActive--

    if (currentActive < 1) {
        currentActive = 1
    }

    update()
})

function update() {
    circles.forEach((circle, idx) => {
        if (idx < currentActive) {
            circle.classList.add('active')
        } else {
            circle.classList.remove('active')
        }
    })

    const actives = document.querySelectorAll('.active')

    progress.style.width = (actives.length - 1) / (circles.length - 1) * 100 + '%'

    if (currentActive === 1) {
        prev.disabled = true
    } else if (currentActive === circles.length) {
        next.disabled = true
    } else {
        prev.disabled = false
        next.disabled = false
    }
}
//end experimental progress bar