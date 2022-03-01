"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_frontend = void 0;
const chart_js_1 = require("chart.js");
const electron_1 = require("electron");
// const led_button = document.getElementById("Blink");
// const color_change = <HTMLButtonElement>document.getElementById("color");
// const htmlcolorelement = document.getElementById("contrast");
const stylesheetopt = document.getElementById("style");
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
const Btnprevious = document.getElementById('Previous');
const Btnnext = document.getElementById('Next');
const Btnsubmit = document.getElementById('Submit');
const bullets = [...document.querySelectorAll('.bullets')];
let current = 0;
const max = 3;
Btnprevious.style.display = 'none';
Btnsubmit.style.display = 'none';
Btnnext.addEventListener('click', () => {
    bullets[current].classList.add('completed');
    current += 1;
    Btnprevious.style.display = 'inline';
    if (current === max) {
        Btnnext.style.display = 'none';
        Btnsubmit.style.display = 'inline';
    }
});
Btnprevious.addEventListener('click', () => {
    bullets[current - 1].classList.remove('completed');
    current -= 1;
    Btnsubmit.style.display = 'none';
    Btnnext.style.display = 'inline';
    if (current === 0) {
        Btnprevious.style.display = 'none';
    }
});
Btnsubmit.addEventListener('click', () => {
    location.reload();
});
// X-AXIS LABELS CAN BE REMOVED LATER
let labels = Array(starting_length).fill(0).map((_, i) => i);
function updateData(LOWGMX, LOWGMY, LOWGMZ, LOWGGX, LOWGGY, LOWGGZ, LOWGAX, LOWGAY, LOWGAZ, GPS_LAT, GPS_LONG, GPS_ALT, KXAX, KXAY, KXAZ, H3LAX, H3LAY, H3LAZ, BAROMETER, SIGNAL) {
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
    ];
    chart_arr.forEach(c => {
        const { chart, val } = c;
        for (let coord = 0; coord < val.length; coord++) {
            const arr = chart.data.datasets[coord].data;
            for (let i = 0; i + 1 < arr.length; i++) {
                arr[i] = arr[i + 1];
            }
            arr[arr.length - 1] = val[coord];
        }
        chart.update();
    });
}
//LED BUTTON HAS BEEN DECOMISIONED
// led_button.addEventListener('click', () => {
//     let newdataset = make_new_dataset(DP_LOWGMX, "lowGimumx");
//     charts.lowgimu_accel.data.datasets.push(newdataset);
//     charts.lowgimu_accel.update();
// })
function make_new_dataset(data, name) {
    return {
        label: name,
        borderColor: 'rgb(99, 255, 132)',
        data: data
    };
}
let charts;
let data = {};
function make_chart(units, element_id, name, data) {
    const canvas = document.getElementById(element_id);
    const ctx = canvas.getContext('2d');
    return new chart_js_1.Chart(ctx, make_chart_options(units, name, [data]));
}
function make_chart_options(units, name, datasets) {
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
                };
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
    };
}
function make_chart_multiaxis(units, element_id, name, datax, datay, dataz) {
    const canvas = document.getElementById(element_id);
    const ctx = canvas.getContext('2d');
    return new chart_js_1.Chart(ctx, make_chart_options(units, name, [datax, datay, dataz]));
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
function run_frontend(serverConnection, registerables) {
    /* LOADS ALL THE CHARTS AFTER WINDOW LOADS
    BUT WILL BE MOVED LATER TO AFTER GSS
    ESTABLISHES CONNNECTION TO FEATHER */
    chart_js_1.Chart.register(...registerables);
    charts = setup_charts();
    // set_current_time();
    // setInterval(set_current_time, 1000);
    let times = 0;
    setInterval(() => {
        const c = Math.cos(times++ / 100);
        const d = Math.sin(times++ / 100);
        const e = Math.cos(times++ / 100);
        updateData(c, d, e, c, d, e, c, d, e, c, d, e, c, d, e, c, d, e, c, d);
    }, 30);
    serverConnection.on("data", (event, message) => {
        const masterJSON = JSON.parse(message);
        const m = masterJSON["value"];
        /* Finds the Raw Telemetry Table
        finds the field by ID and assigns
        the value to the div */
        for (var key in m) {
            document.getElementById(key).innerText = m[key];
        }
        updateData(m["LSM_IMU_mx"], m["LSM_IMU_my"], m["LSM_IMU_mz"], m["LSM_IMU_gx"], m["LSM_IMU_gy"], m["LSM_IMU_gz"], m["LSM_IMU_ax"], m["LSM_IMU_ay"], m["LSM_IMU_az"], m["gps_lat"], m["gps_long"], m["gps_alt"], m["KX_IMU_ax"], m["KX_IMU_ay"], m["KX_IMU_az"], m["H3L_IMU_ax"], m["H3L_IMU_ay"], m["H3L_IMU_az"], m["barometer_alt"], m["RSSI"]);
    });
}
exports.run_frontend = run_frontend;
// function set_current_time() {
//     const date = new Date();
//     const hh = date.getHours();
//     const mm = date.getMinutes();
//     const ss = date.getSeconds();
//     const session = hh <= 12 ? "AM" : "PM";
//     const hour = (hh < 10) ? "0" + hh : hh;
//     const minute = (mm < 10) ? "0" + mm : mm;
//     const second = (ss < 10) ? "0" + ss : ss;
//     const time = `${hour}:${minute}:${second} ${session}`;
//     document.getElementById("clock").innerText = time;
// }
electron_1.ipcRenderer.on('contrast', () => {
    if (!contrast) {
        stylesheetopt.href = "highcontrast.css";
        contrast = true;
    }
    else {
        stylesheetopt.href = "style.css";
        contrast = false;
    }
});
//# sourceMappingURL=main.js.map