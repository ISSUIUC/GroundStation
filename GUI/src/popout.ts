import { ipcRenderer } from 'electron'
import { Chart, ChartComponentLike, ChartConfiguration } from 'chart.js'
import { valid } from 'chroma-js'
import { ServerConnection } from './serverConnection'
import { SerialResponse } from './serialResponse'

let serverConnection: ServerConnection
let popoutID: string
let popoutChart: Chart
let time = 0
const starting_length = 100
let paramKey = {
  DP_LOWGMX: Array(starting_length).fill(0),
  DP_LOWGMY: Array(starting_length).fill(0),
  DP_LOWGMZ: Array(starting_length).fill(0),
  DP_LOWGAX: Array(starting_length).fill(0),
  DP_LOWGAY: Array(starting_length).fill(0),
  DP_LOWGAZ: Array(starting_length).fill(0),
  DP_LOWGGX: Array(starting_length).fill(0),
  DP_LOWGGY: Array(starting_length).fill(0),
  DP_LOWGGZ: Array(starting_length).fill(0),
  DP_GPS_LAT: Array(starting_length).fill(0),
  DP_GPS_LONG: Array(starting_length).fill(0),
  DP_GPS_ALT: Array(starting_length).fill(0),
  DP_KXAX: Array(starting_length).fill(0),
  DP_KXAY: Array(starting_length).fill(0),
  DP_KXAZ: Array(starting_length).fill(0),
  DP_STE_ALT: Array(starting_length).fill(0),
  DP_STE_VEL: Array(starting_length).fill(0),
  DP_STE_ACC: Array(starting_length).fill(0),
  DP_STE_APO: Array(starting_length).fill(0),
  DP_TEMP: Array(starting_length).fill(0),
  DP_H3LAX: Array(starting_length).fill(0),
  DP_H3LAY: Array(starting_length).fill(0),
  DP_H3LAZ: Array(starting_length).fill(0),
  DP_BAROMETER: Array(starting_length).fill(0),
  DP_SIGNAL: Array(starting_length).fill(0)
}
let chartKey: { [key: string]: Array<any> } = {
  lowgimuA: [
    true,
    'G',
    'LowG IMU acceleration',
    [paramKey.DP_LOWGAX, paramKey.DP_LOWGAY, paramKey.DP_LOWGAZ]
  ],
  lowgimuG: [
    true,
    'DPS',
    'LowG IMU gyroscope',
    [paramKey.DP_LOWGGX, paramKey.DP_LOWGGY, paramKey.DP_LOWGGZ]
  ]
}

ipcRenderer.on('idMessage', (evt, id) => {
  popoutID = id
  initializeChart()
})

let labels = Array(starting_length).fill(0)

function make_chart(
  units: string,
  element_id: string,
  name: string,
  data: number[]
): Chart {
  const canvas = <HTMLCanvasElement>document.getElementById(element_id)
  const ctx = canvas.getContext('2d')
  return new Chart(ctx, make_chart_options(units, name, [data]))
}

function make_chart_multiaxis(
  units: string,
  element_id: string,
  name: string,
  datasets: number[][]
): Chart {
  const canvas = <HTMLCanvasElement>document.getElementById(element_id)
  const ctx = canvas.getContext('2d')
  return new Chart(ctx, make_chart_options(units, name, datasets))
}

function make_chart_options(
  units: string,
  name: string,
  datasets: number[][]
): ChartConfiguration {
  // const colors = ['rgb(255, 99, 132)', 'rgb(99, 132, 255)', 'rgb(132, 255, 99)'];
  const colors = [
    'rgb(255, 7, 58)',
    'rgb(0, 150, 255)',
    'rgb(0, 225, 127)',
    'rgb(255, 191, 0)'
  ]

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
              lineHeight: 1.2
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
              lineHeight: 1.2
            }
          }
        }
      }
    }
  }
}
function initializeChart() {
  ipcRenderer.send('debugger', 'Initializing charts...')
  let inputs = chartKey[popoutID]
  if (inputs[0]) {
    popoutChart = make_chart_multiaxis(inputs[1], "popoutCanvas", inputs[2], inputs[3])
  } else {
    popoutChart = make_chart(inputs[1], "popoutCanvas", inputs[2], inputs[3])
  }

  function updateData (val: Array<number>) {
    labels.splice(0, 1)
    time++
    labels.push(time)

    for (let coord = 0; coord < val.length; coord++) {
      popoutChart.data.datasets[coord].data.push(val[coord])
      popoutChart.data.datasets[coord].data.shift()
    }
    popoutChart.update()
  }

  serverConnection.on('data', (message) => {
    const masterJSON: SerialResponse = JSON.parse(message)
    if (masterJSON.type == 'data') {
      const m = masterJSON['value']
      // inputs[3].forEach((d) => {

      // })
      // Test case for one chart for the time being
      updateData([m['LSM_IMU_mx'], m['LSM_IMU_my'], m['LSM_IMU_mz']])
    }
  })
}