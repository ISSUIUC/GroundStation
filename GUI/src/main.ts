import { ipcRenderer } from "electron";
import { Chart } from 'chart.js';

const led_button = document.getElementById("Blink");
const color_change = <HTMLButtonElement>document.getElementById("color");
const htmlcolorelement = document.getElementById("contrast");
const stylesheetopt = <HTMLLinkElement>document.getElementById("style");
let contrast = false;

// ALL VALUES ARE DEMO FOR NOW BUT THESE ARE THE VARIABLES THAT WILL BE PASSED TO THE CHART
const DP_LOWGM = [40, 20, 20, 60, 60, 120, 120, 125, 105, 110];
const DP_LOWGG = [31, 35, 36, 43, 47, 54, 56, 59, 63, 65];
const DP_LOWGA = [31, 36, 38, 42, 44, 49, 51, 55, 59, 62];
const DP_GPS = [67, 76, 98, 122, 74, 96, 90, 118, 69, 126];
const DP_KX134 = [111, 114, 119, 99, 62, 118, 108, 125, 84, 90];
const DP_H3LIS331DL = [76, 127, 91, 67, 99, 102, 61, 125, 79, 66];
const DP_BAROMETER = [1140, 1179, 1338, 1353, 1554, 1571, 1666, 1754, 1885, 1999];

// X-AXIS LABELS CAN BE REMOVED LATER
const labels = ['0', '1', '2','3','4','5','6','7','8','9','10'];

color_change.addEventListener('click', ()=> {
    if (!contrast) {
        stylesheetopt.href="highcontrast.css";
        contrast = true;
    } else {
        stylesheetopt.href="style.css";
        contrast = false;
    }
    

})

let led = false;
window.onload = function () {

    /* LOADS ALL THE CHARTS AFTER WINDOW LOADS 
    BUT WILL BE MOVED LATER TO AFTER GSS 
    ESTABLISHES CONNNECTION TO FEATHER */

    var canvas_lowgimuA = <HTMLCanvasElement>document.getElementById("lowgimuA");
    var ctx_lowgimuA = canvas_lowgimuA.getContext('2d');
    const chart_lowgimuA = new Chart(ctx_lowgimuA, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: 'My First dataset',
                borderColor: 'rgb(255, 99, 132)',
                data: DP_LOWGA
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
                    text: 'LowG IMU Acceleration',
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
    });
    var canvas_lowgimug = <HTMLCanvasElement>document.getElementById("lowgimuG");
    var ctx_lowgimug = canvas_lowgimug.getContext('2d');
    const lowgimug = new Chart(ctx_lowgimug, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: 'My First dataset',
                borderColor: 'rgb(255, 99, 132)',
                data: DP_LOWGG
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
                    text: 'LowG IMU Gyroscope',
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
    });

    var canvas_lowgimum = <HTMLCanvasElement>document.getElementById("lowgimuM");
    var ctx_lowgimum = canvas_lowgimum.getContext('2d');
    const lowgimum = new Chart(ctx_lowgimum, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels: labels,
            datasets: [{
                label: 'My First dataset',
                borderColor: 'rgb(255, 99, 132)',
                data: DP_LOWGM
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
                    text: 'LowG IMU Magnetometer',
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
    });



    var canvas_gps = <HTMLCanvasElement>document.getElementById("gps");
    var ctx_gps = canvas_gps.getContext('2d');
    const gps = new Chart(ctx_gps, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: 'My First dataset',
                borderColor: 'rgb(255, 99, 132)',
                data: DP_GPS
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
                    text: 'GPS',
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
    });

    var canvas_kx134 = <HTMLCanvasElement>document.getElementById("kx134");
    var ctx_kx134 = canvas_kx134.getContext('2d');
    const kx134 = new Chart(ctx_kx134, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: 'My First dataset',
                borderColor: 'rgb(255, 99, 132)',
                data: DP_KX134
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
                    text: 'HighG (KX134) Acceleration',
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
    });

    var canvas_H3LIS331DL = <HTMLCanvasElement>document.getElementById("H3LIS331DL");
    var ctx_H3LIS331DL = canvas_H3LIS331DL.getContext('2d');
    const H3LIS331DL = new Chart(ctx_H3LIS331DL, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: 'My First dataset',
                borderColor: 'rgb(255, 99, 132)',
                data: DP_H3LIS331DL
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
                    text: 'HighG (H3LISH3LIS331DL) Acceleration',
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
    });
    var canvas_barometer = <HTMLCanvasElement>document.getElementById("barometer");
    var ctx_barometer = canvas_barometer.getContext('2d');
    const barometer = new Chart(ctx_barometer, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels,
            datasets: [{
                label: 'My First dataset',
                borderColor: 'rgb(255, 99, 132)',
                data: DP_BAROMETER
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
                    text: 'Barometer Altitude',
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
    });
}

function currentTime() {
    let date = new Date(); 
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    let session = "AM";
  
      
    if(hh > 12){
        session = "PM";
     }
     let hour;
     let minute;
     let second;
     if (hh < 10) {
         hour = "0" + hh;
     } else {
         hour = hh;
     }
     if (mm < 10) {
         minute = "0" + mm;
     } else {
         minute = mm;
     }
     if (ss < 10) {
         second = "0" + ss;
     } else {
         second = ss;
     }
    //  hh = (hh < 10) ? "0" + hh : hh;
    //  mm = (mm < 10) ? "0" + mm : mm;
    //  ss = (ss < 10) ? "0" + ss : ss;
      
     let time = hour + ":" + minute + ":" + second + " " + session;
  
    document.getElementById("clock").innerText = time; 
    var t = setTimeout(function(){ currentTime() }, 1000); 
  
  }
  
  currentTime();


// led_button.addEventListener("click", ()=>{
ipcRenderer.on("connection", (event, message) => {
    const m = JSON.parse(message);


});