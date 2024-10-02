import { ChartComponentLike } from 'chart.js'
import { ipcRenderer } from 'electron'
import { ServerConnection } from './serverConnection'

const progress = document.getElementById('progress')
const circles = document.querySelectorAll('.circle')

let currentActive = 1


ipcRenderer.on('feather', (evt) => {
  if (currentActive == 1) {
    nextState();
  }
});

ipcRenderer.on('no_data', (evt) => {
  if (currentActive == 3) {
    prevState();
  }
})

ipcRenderer.on('disc_feather', (evt) => {
  prevState();
  prevState();
})

ipcRenderer.on('data', (evt, message) => {
  nextState();
  nextState();
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
    "pressure"]

  loopList.forEach((e) => {
    if (typeof(masterJSON.value[e]) !== "number") {
      masterJSON.value[e] = (masterJSON.value[e] as any)
    } else {
      masterJSON.value[e] = (masterJSON.value[e] as any).toFixed(5)
    }
    
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

// progress bar code


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
