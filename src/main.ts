import { Chart, ChartComponentLike, ChartConfiguration } from 'chart.js';
import { SerialResponse } from './serialResponse';
import { ServerConnection } from './serverConnection';

import * as THREE from 'three';
import { OBJLoader } from './OBJLoader'
import { ipcRenderer } from 'electron';
import { setQuaternionFromProperEuler } from 'three/src/math/MathUtils';


const stylesheetopt = <HTMLLinkElement>document.getElementById("style");
let contrast = false;
let time = 0;
let current_time = new Date();
let dragSrcEl: any;
let dragID: string;

const meter_to_feet = 3.28084;

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

const DP_BNOY = Array(starting_length).fill(0);
const DP_BNOP = Array(starting_length).fill(0);
const DP_BNOR = Array(starting_length).fill(0);

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

function updateData(IMUGX: number, IMUGY: number, IMUGZ: number,
    IMUMX: number, IMUMY: number, IMUMZ: number,
    IMUAX: number, IMUAY: number, IMUAZ: number,
    GPS_LAT: number, GPS_LONG: number, GPS_ALT: number,
    TEMP: number, 
    STE_ALT: number, STE_VEL: number, STE_ACC: number, STE_APO:number,
    BNO_YAW: number, BNO_PITCH: number, BNO_ROLL: number,
    PRESSURE: number, SIGNAL: number) {
   
    labels.splice(0, 1);
    time++;
    labels.push(time);
    GPS_ALT *= meter_to_feet;
    STE_ALT *= meter_to_feet;
    STE_APO *= meter_to_feet;
    let BAROMETER = calc_altitude(PRESSURE, TEMP);
    const chart_arr = [
        { chart: charts.baro_altitude, val: [BAROMETER] },
        { chart: charts.gps, val: [GPS_ALT] },
        { chart: charts.bno, val: [BNO_YAW, BNO_PITCH, BNO_ROLL] },
        { chart: charts.se, val: [STE_ALT, STE_VEL, STE_ACC, STE_APO] },
        { chart: charts.imu_accel, val: [IMUAX, IMUAY, IMUAZ] },
        { chart: charts.imu_gyro, val: [IMUGX, IMUGY, IMUGZ] },
        { chart: charts.imu_mag, val: [IMUMX, IMUMY, IMUMZ] },
        { chart: charts.signal, val: [SIGNAL] }
    ]

    chart_arr.forEach(
        c => {
            const { chart, val } = c;
            for (let coord = 0; coord < val.length; coord++) {
                // const arr = chart.data.datasets[coord].data;
                chart.data.datasets[coord].data.push(val[coord]);
                chart.data.datasets[coord].data.shift();
                // chart.data.datasets[coord].data.push(val[coord]);
                // chart.data.datasets[coord].data.splice(0,1);
                chart.update();
            }
        }
    )
    // update_charts();
    let q = eulertoquaternion(BNO_ROLL,BNO_PITCH,BNO_YAW);
    render(q);
}

function calc_altitude(pressure: number, temp: number) {
    return (-Math.log(pressure * 0.000987) * (temp + 273.15) * 29.254) * meter_to_feet;
}

function make_new_dataset(data: number[], name: string) {
    return {
        label: name,
        borderColor: 'rgb(99, 255, 132)',
        data: data
    }
}



let charts: {
    imu_accel?: Chart,
    imu_gyro?: Chart,
    imu_mag?: Chart,
    gps?: Chart,
    se?: Chart,
    bno?: Chart,
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
                    data: d,
                    pointRadius: 0
                }
            })
        },
        // Configuration options go here
        options: {
            // animation: {
            //     delay: 0,
            //     duration: 50,
            //     easing: 'linear'
            // },
            animation: false,
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
        imu_accel: make_chart_multiaxis("G", "imuA", "KX acceleration", [DP_LOWGAX, DP_LOWGAY, DP_LOWGAZ]),
        imu_gyro: make_chart_multiaxis("DPS", "imuG", "IMU gyroscope", [DP_LOWGGX, DP_LOWGGY, DP_LOWGGZ]),
        imu_mag: make_chart_multiaxis("Gauss", "imuM", "IMU magnetometer", [DP_LOWGMX, DP_LOWGMY, DP_LOWGMZ]),
        gps: make_chart("Meters", "gps", "GPS altitude", DP_GPS_ALT),
        se: make_chart_multiaxis("Meters", "se", "State Estimation", [DP_STE_ALT, DP_STE_VEL, DP_STE_ACC, DP_STE_APO]),
        bno: make_chart_multiaxis("Radians", "BNO", "Orientation", [DP_BNOY, DP_BNOP, DP_BNOR]),
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
            // stylesheetopt.href = "highcontrast.css"; // Backup incase below code doesn't work
            document.documentElement.style.setProperty('filter', 'invert(1)');
            contrast = true;
        } else {
            document.documentElement.style.removeProperty('filter')
            // stylesheetopt.href = "style.css"; // Backup incase above code doesn't work
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
                    document.getElementById(key).innerText = ((((m as any)[key]) / 1000) * meter_to_feet).toFixed(3);
                } else if (key == "STE_ALT" || key == "STE_APO" || key == "barometer_alt") {
                    let temp: number = parseFloat((m as any)[key]);
                    temp *= meter_to_feet;
                    document.getElementById(key).innerText = temp.toFixed(3);
                } else if (typeof (((m as any)[key])) === "number") {
                    document.getElementById(key).innerText = ((m as any)[key]).toFixed(3);
                } else {
                    document.getElementById(key).innerText = (m as any)[key];
                }
            }
            updateData(m["IMU_gx"], m["IMU_gy"], m["IMU_gz"],
                m["IMU_mx"], m["IMU_my"], m["IMU_mz"],
                m["KX_IMU_ax"], m["KX_IMU_ay"], m["KX_IMU_az"],
                m["gps_lat"], m["gps_long"], m["gps_alt"] / 1000,
                m["TEMP"], 
                m["STE_ALT"], m["STE_VEL"], m["STE_ACC"], m["STE_APO"],
                m["BNO_YAW"], m["BNO_PITCH"], m["BNO_ROLL"],
                m["pressure"], m["RSSI"]);
                //Change KX_IMU_a$ to State Estimation Variables
            
            const fsm_index_map = [1,2,2,3,3,4,4,4,5,5,6,6,7,7,8,9];
            if(m["FSM_state"] >= 0 && m["FSM_state"] < fsm_index_map.length){
                m["FSM_state"] = fsm_index_map[m["FSM_state"]];
            }
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
    charts.imu_accel.resize();
    charts.imu_gyro.resize();
    charts.imu_mag.resize();
    charts.gps.resize();
    charts.se.resize();
    charts.bno.resize();
    charts.baro_altitude.resize();
    charts.signal.resize();
}

function update_charts() {
    charts.imu_accel.update();
    charts.imu_gyro.update();
    charts.imu_mag.update();
    charts.gps.update();
    charts.se.update();
    charts.bno.update();
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
    if (diff / 1000 > 3) {
        ipcRenderer.send('long_time_no_see')
    }
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
        charts.imu_accel.resize();
        charts.imu_gyro.resize();
        charts.imu_mag.resize();
        charts.gps.resize();
        charts.se.resize();
        charts.bno.resize();
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

let rocket: any;
const canvas = <HTMLCanvasElement>document.getElementById('bno');
// canvas.width = canvas.parentElement.offsetWidth;
canvas.height = canvas.parentElement.offsetHeight;
let w = canvas.width;
let h = canvas.height;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, canvas.width / canvas.height, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
renderer.setSize(window.innerWidth*2, window.innerHeight*2);
renderer.domElement.style.width = w.toString();
renderer.domElement.style.height = h.toString();
renderer.domElement.width = w
renderer.domElement.height = h
const loader = new OBJLoader();
renderer.setSize(canvas.width, canvas.height);
scene.background = new THREE.Color(23/255, 26/255, 28/255);
camera.position.set(0, -1, 200);


const color = new THREE.Color(135/255, 206/255, 235/255);
const intensity = 1.4;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, -1, 200);
light.target.position.set(-5, 0, 0);
scene.add(light);
scene.add(light.target);



function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();



loader.load("assets\\rocket.obj", (root: THREE.Object3D<THREE.Event>) => {  
    rocket = root  
    scene.add(root);
    // setInterval(()=>{
    //     root.rotateX(0.01);
    // }, 16);
    // rocket.rotateX(-1);
});

function render(quaternion: any[]) {
    if (rocket != undefined) {
        let rotationQuaternion = new THREE.Quaternion(quaternion[1], quaternion[3], -quaternion[2], quaternion[0]);
        rocket.setRotationFromQuaternion(rotationQuaternion);
    }
    // bunny.scale.set(0.5, 0.5, 0.5)
    renderer.render(scene, camera);
    // updateCalibration();
}

function eulertoquaternion(roll: number, pitch: number, yaw: number) {
    let qx = Math.sin(roll/2) * Math.cos(pitch/2) * Math.cos(yaw/2) - Math.cos(roll/2) * Math.sin(pitch/2) * Math.sin(yaw/2)
    let qy = Math.cos(roll/2) * Math.sin(pitch/2) * Math.cos(yaw/2) + Math.sin(roll/2) * Math.cos(pitch/2) * Math.sin(yaw/2)
    let qz = Math.cos(roll/2) * Math.cos(pitch/2) * Math.sin(yaw/2) - Math.sin(roll/2) * Math.sin(pitch/2) * Math.cos(yaw/2)
    let qw = Math.cos(roll/2) * Math.cos(pitch/2) * Math.cos(yaw/2) + Math.sin(roll/2) * Math.sin(pitch/2) * Math.sin(yaw/2)
    return [qx, qy, qz, qw]
}
