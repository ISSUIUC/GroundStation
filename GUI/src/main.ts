import { Chart, ChartComponentLike, ChartConfiguration } from 'chart.js';
import { SerialResponse } from './serialResponse';
import { ServerConnection } from './serverConnection';

import { ipcRenderer } from 'electron';


const stylesheetopt = <HTMLLinkElement>document.getElementById("style");
let contrast = false;
let time = 0;
let current_time = new Date();
let dragSrcEl: any;
let dragID: string;

const starting_length = 100;
// ALL VALUES ARE DEMO FOR NOW BUT THESE ARE THE VARIABLES THAT WILL BE PASSED TO THE CHART
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

//STATE ESTIMATION ARRAY PLACEHOLDERS
const DP_STE_ALT = Array(starting_length).fill(0);
const DP_STE_VEL = Array(starting_length).fill(0);
const DP_STE_ACC = Array(starting_length).fill(0);
const DP_STE_APO = Array(starting_length).fill(0);

const DP_TEMP = Array(starting_length).fill(0);

const DP_H3LAX = Array(starting_length).fill(0);
const DP_H3LAY = Array(starting_length).fill(0);
const DP_H3LAZ = Array(starting_length).fill(0);

const DP_BAROMETER = Array(starting_length).fill(0);
const DP_SIGNAL = Array(starting_length).fill(0);

let labels = Array(starting_length).fill(0);

function updateData(LOWGMX: number, LOWGMY: number, LOWGMZ: number,
    LOWGGX: number, LOWGGY: number, LOWGGZ: number,
    LOWGAX: number, LOWGAY: number, LOWGAZ: number,
    GPS_LAT: number, GPS_LONG: number, GPS_ALT: number,
    TEMP: number, 
    STE_ALT: number, STE_VEL: number, STE_ACC: number, STE_APO:number,
    KXAX: number, KXAY: number, KXAZ: number,
    BAROMETER: number, SIGNAL: number) {
   
    labels.splice(0, 1);
    time++;
    labels.push(time);

    const chart_arr = [
        { chart: charts.baro_altitude, val: [BAROMETER] },
        { chart: charts.gps, val: [GPS_ALT] },
        { chart: charts.highg_kx_accel, val: [KXAX, KXAY, KXAZ] },
        { chart: charts.se, val: [STE_ALT, STE_VEL, STE_ACC, STE_APO] },
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
                chart.data.datasets[coord].data.push(val[coord]);
                chart.data.datasets[coord].data.shift();
            }
        }
    )
    update_charts();
}

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
    se?: Chart,
    highg_kx_accel?: Chart,
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
    // const colors = ['rgb(255, 99, 132)', 'rgb(99, 132, 255)', 'rgb(132, 255, 99)'];
    const colors = ['rgb(255, 7, 58)', 'rgb(0, 150, 255)', 'rgb(0, 225, 127)', 'rgb(255, 191, 0)'];

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
            animation: {
                delay: 0,
                duration: 100,
                easing: 'linear'
            },
            // animation: false,
            responsive: true,
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
                            // size: 14,
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

function make_chart_multiaxis(units: string, element_id: string, name: string, datasets: number[][]): Chart {
    const canvas = <HTMLCanvasElement>document.getElementById(element_id);
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, make_chart_options(units, name, datasets));
}

function setup_charts() {
    return {
        lowgimu_accel: make_chart_multiaxis("G", "lowgimuA", "LowG IMU acceleration", [DP_LOWGAX, DP_LOWGAY, DP_LOWGAZ]),
        lowgimu_gyro: make_chart_multiaxis("DPS", "lowgimuG", "LowG IMU gyroscope", [DP_LOWGGX, DP_LOWGGY, DP_LOWGGZ]),
        lowgimu_mag: make_chart_multiaxis("Gauss", "lowgimuM", "LowG IMU magnetometer", [DP_LOWGMX, DP_LOWGMY, DP_LOWGMZ]),
        gps: make_chart("Meters", "gps", "GPS altitude", DP_GPS_ALT),
        se: make_chart_multiaxis("Meters", "se", "State Estimation", [DP_STE_ALT, DP_STE_VEL, DP_STE_ACC, DP_STE_APO]),
        highg_kx_accel: make_chart_multiaxis("G", "KX134", "KX acceleration", [DP_KXAX, DP_KXAY, DP_KXAZ]),
        baro_altitude: make_chart("Meters", "barometer", "Barometer altitude", DP_BAROMETER),
        signal: make_chart("dBmW", "signal_data", "Signal Strength (RSSI)", DP_SIGNAL)
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

    serverConnection.on("contrast", () => {
        if (!contrast) {
            document.documentElement.style.setProperty('--inversion', '1');
            contrast = true;
        } else {
            document.documentElement.style.setProperty('--inversion', '0');
            contrast = false;
        }
    });

    serverConnection.on("data", (message) => {
        document.getElementById("packetstats").innerText = "0 seconds since last packet";
        current_time = new Date();
        const masterJSON: SerialResponse = JSON.parse(message);

        if (masterJSON.type == "data") {
            const m = masterJSON["value"];
            /* Finds the Raw Telemetry Table 
            finds the field by ID and assigns 
            the value to the div */
            for (var key in m) {
                if (key == "response_ID") {
                    continue;
                }
                // if (typeof (((m as any)[key])) === "string") {
                //     document.getElementById(key).innerText = (m as any)[key];
                // } else {
                //     document.getElementById(key).innerText = ((m as any)[key]).toFixed(3);
                // }
                if (key == "gps_lat" || key == "gps_long") {
                    document.getElementById(key).innerText = ((m as any)[key]).toFixed(5);
                } else if (key == "gps_alt") {
                    document.getElementById(key).innerText = (((m as any)[key]) / 1000).toFixed(3);
                } else if (typeof (((m as any)[key])) === "number") {
                    document.getElementById(key).innerText = ((m as any)[key]).toFixed(3);
                } else {
                    document.getElementById(key).innerText = (m as any)[key];
                }
            }
            updateData(m["LSM_IMU_mx"], m["LSM_IMU_my"], m["LSM_IMU_mz"],
                m["LSM_IMU_gx"], m["LSM_IMU_gy"], m["LSM_IMU_gz"],
                m["LSM_IMU_ax"], m["LSM_IMU_ay"], m["LSM_IMU_az"],
                m["gps_lat"], m["gps_long"], m["gps_alt"] / 1000,
                m["TEMP"], 
                m["STE_ALT"], m["STE_VEL"], m["STE_ACC"], m["STE_APO"],
                m["KX_IMU_ax"], m["KX_IMU_ay"], m["KX_IMU_az"],
                m["barometer_alt"], m["RSSI"]);
                //Change KX_IMU_a$ to State Estimation Variables

            if (m["FSM_state"] >= 0 && m["FSM_state"] <= 9) {
                if (m["FSM_state"] > currentActive) {
                    for (let i = currentActive; i < m["FSM_state"]; i++) {
                        nextState();
                    }
                    currentActive = m["FSM_state"];
                }

                if (m["FSM_state"] < currentActive) {
                    for (let i = currentActive; i > m["FSM_state"]; i--) {
                        prevState();
                    }
                    currentActive = m["FSM_state"];
                }
            }
            resize_charts();
        }

        if (masterJSON.type == "init_error") {
            alert(masterJSON.error);
        }
    });

}

function resize_charts() {
    charts.lowgimu_accel.resize();
    charts.lowgimu_gyro.resize();
    charts.lowgimu_mag.resize();
    charts.gps.resize();
    charts.se.resize();
    charts.highg_kx_accel.resize();
    charts.baro_altitude.resize();
    charts.signal.resize();
}

function update_charts() {
    charts.lowgimu_accel.update();
    charts.lowgimu_gyro.update();
    charts.lowgimu_mag.update();
    charts.gps.update();
    charts.se.update();
    charts.highg_kx_accel.update();
    charts.baro_altitude.update();
    charts.signal.update();
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

    let time = year + "-" + month + "-" + day + "--" + hour + "-" + minute + "-" + second + "-" + ms;
    return time;
}

function diff_time() {
    let suffix = " seconds since last packet";
    let current = new Date();
    let diff = current.getTime() - current_time.getTime();
    document.getElementById("packetstats").innerText = Math.round(diff / 1000) + suffix;
    var t = setTimeout(function () { diff_time() }, 1000);
}

diff_time();

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

// progress bar code
const progress = document.getElementById('progress')
const circles = document.querySelectorAll('.circle')

let currentActive = 1

function nextState() {
    currentActive++

    if (currentActive > circles.length) {
        currentActive = circles.length
    }

    update()
}


function prevState() {
    currentActive--

    if (currentActive < 1) {
        currentActive = 1
    }

    update()
}

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

}

document.addEventListener('DOMContentLoaded', (event) => {

    function handleDragStart(e: any) {
        this.style.opacity = '0.4';
        dragSrcEl = this;
        if (this.getElementsByTagName("div").length !== 0) {
            dragID = this.getElementsByTagName("div")[0].id
        } else {
            dragID = this.getElementsByTagName("canvas")[0].id
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragID);
    }


    function handleDragEnd(e: any) {
        this.style.opacity = '1';

        items.forEach(function (item) {
            item.classList.remove('over');
        });
        center.classList.remove('over');
    }

    function handleDragOver(e: any) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        return false;
    }

    function handleDragEnter(e: any) {
        this.classList.add('over');
    }

    function handleDragLeave(e: any) {
        this.classList.remove('over');
    }

    function handleDrop(e: any) {
        e.stopPropagation(); // stops the browser from redirecting.
        let id = e.dataTransfer.getData('text/plain');
        let replaceid;
        if (this.getElementsByTagName("div").length !== 0) {
            replaceid = this.getElementsByTagName("div")[0].id
        } else {
            replaceid = this.getElementsByTagName("canvas")[0].id
        }
        if (dragSrcEl !== this) {
            dragSrcEl.appendChild(document.getElementById(replaceid));
            this.appendChild(document.getElementById(dragID));
        }
        charts.lowgimu_accel.resize();
        charts.lowgimu_gyro.resize();
        charts.lowgimu_mag.resize();
        charts.gps.resize();
        charts.se.resize();
        charts.highg_kx_accel.resize();
        charts.baro_altitude.resize();
        charts.signal.resize();
        return false;
    }


    let items = document.querySelectorAll('.grid-container .grid-item');
    items.forEach(function (item) {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('drop', handleDrop);
    });
    let center = document.querySelector('.panel1');
    center.addEventListener('dragstart', handleDragStart);
    center.addEventListener('dragover', handleDragOver);
    center.addEventListener('dragenter', handleDragEnter);
    center.addEventListener('dragleave', handleDragLeave);
    center.addEventListener('dragend', handleDragEnd);
    center.addEventListener('drop', handleDrop);
});
