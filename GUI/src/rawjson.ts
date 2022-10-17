import { ChartComponentLike } from 'chart.js'
import { ipcRenderer } from 'electron'
import { ServerConnection } from './serverConnection'

ipcRenderer.on('data', (evt, message) => {
  function get_current_time_full() {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hh = date.getHours()
    const mm = date.getMinutes()
    const ss = date.getSeconds()
    const ms = date.getMilliseconds()

    const session = hh <= 12 ? 'AM' : 'PM'
    const hour = hh < 10 ? '0' + hh : hh
    const minute = mm < 10 ? '0' + mm : mm
    const second = ss < 10 ? '0' + ss : ss

    let time =
      year +
      '-' +
      month +
      '-' +
      day +
      '--' +
      hour +
      '-' +
      minute +
      '-' +
      second +
      '-' +
      ms
    return time
  }
  // document.getElementById("data_feed").innerText = "HELLO";
  const masterJSON = JSON.parse(message)

  let loopList = [
    'LSM_IMU_mx',
    'LSM_IMU_my',
    'LSM_IMU_mz',
    'LSM_IMU_gx',
    'LSM_IMU_gy',
    'LSM_IMU_gz',
    'LSM_IMU_ax',
    'LSM_IMU_ay',
    'LSM_IMU_az',
    'gps_lat',
    'gps_long',
    'gps_alt',
    'STE_ALT',
    'STE_VEL',
    'STE_ACC',
    'STE_APO',
    'KX_IMU_ax',
    'KX_IMU_ay',
    'KX_IMU_az',
    'barometer_alt',
    'RSSI',
    'FSM_state',
    'Voltage',
    'TEMP',
    'frequency',
    'flap_extension',
    'pressure'
  ]

  loopList.forEach((e) => {
    masterJSON.value[e] = (masterJSON.value[e] as any).toFixed(5)
  })
  let newMessage = JSON.stringify(masterJSON)

  //   ipcRenderer.send('debugger', newMessage)

  //   document.getElementById('data_feed').innerText =
  //     newMessage + '\n' + document.getElementById('data_feed').innerText

  let addedP = document.createElement('p')
  addedP.setAttribute('style', 'color: white;')
  let time = document.createTextNode(get_current_time_full())
  let content = document.createTextNode(newMessage)
  let timeP = document.createElement('p')
  timeP.setAttribute('style', 'color: white; background: red; display: inline;')

  addedP.appendChild(content)
  timeP.appendChild(time)

  let dataFeed = document.getElementById('data_feed')
  dataFeed.insertBefore(addedP, dataFeed.firstChild)
  dataFeed.insertBefore(timeP, addedP)
})

// export function run_frontend(serverConnection: ServerConnection, registerables: readonly ChartComponentLike[]) {

//     serverConnection.on("data", (message) => {
//         const masterJSON = JSON.parse(message);
//         const m = masterJSON["gps_lat"];
//         document.getElementById("data_feed").innerText = m;

//     });

// }
