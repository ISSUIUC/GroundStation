import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from 'chart.js';
import './Graph.css';
import { useTelemetry, useTelemetryCallback, useTelemetryHistory } from '../dataflow/gssdata';
import { getUnit } from '../dataflow/settings';

import zoomPlugin from 'chartjs-plugin-zoom'

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, zoomPlugin);



export const GenericGraph = ({ yvalues, xvalues, legends, colors, xaxis, yaxis }) => {

    // yvalues format: Array of arrays, corresponding to data
    // Flat array of values along the x axis
    // NOTE: the graph does not sort by xvalues! xvalues is simply the labels along the x axis!

    // legends: array of names for datasets. Corresponds to every member of yvalues.
    // colors: Same as legends, but dictates the color of the line.


    const chartRef = useRef(null);

    const zoomOptions = {
        pan: {
          enabled: true,
          mode: "x"
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: "x"
        }
    };

    const g_datasets = []
    for(let i = 0; i < yvalues.length; i++) {
        g_datasets.push({
            label: legends[i],
            data: yvalues[i],
            borderColor: colors[i],
            backgroundColor: colors[i],
            pointRadius: 3,
            borderWidth: 2,
        })
    }

    

    let data = {
        labels: xvalues,
        datasets: g_datasets
    }


    const options = {
        responsive: true,
        maintainAspectRatio: false, // Allows resizing without changing the aspect ratio
        scales: {
            x: {
                title: {
                    display: true,
                    text: xaxis,
                    color: '#fff',
                    font: {
                        size: 14,
                        weight: "bold"
                    }
                },
                ticks: {
                    color: '#ccc',
                },
                grid: {
                    color: '#555',
                },
            },
            y: {
                title: {
                    display: true,
                    text: yaxis,
                    color: '#fff',
                    font: {
                        size: 14,
                        weight: "bold"
                    }
                },
                ticks: {
                    color: '#ccc',
                },
                grid: {
                    color: '#555',
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: '#fff',
                    font: {
                        size: 14
                    }
                },
            },
            tooltip: {
                backgroundColor: '#444',
                titleColor: '#fff',
                bodyColor: '#fff',
            },
            zoom: zoomOptions,
        },
        animation: {
            duration: 50
        }
    };

    return (
        <div className="graph-container">
            <Line ref={chartRef} data={data} options={options} />
        </div>
    );
};

export const TelemetryGraph = ({ telem_channels, yaxis_label="", yaxis_unit }) => {
    // telem_channels => array of channels to track, of the following format:
    // {"@whatever/channel.name": {color: "#ff0000", name: "channel name"}}

    let time_values = useTelemetryHistory("/time_republished", true, 0);
    const t0_val = useTelemetry("@GSS/countdown_t0") || null;

    const t_keys = Object.keys(telem_channels)
    let yvalues = t_keys.map(key => useTelemetryHistory(key));
    let xvalues = time_values.map(t => {
        if(t0_val != null) {
            let diff_ms = (t*1000) - t0_val;

            // Format time
            let diff_s = Math.abs(Math.round(diff_ms/1000)) % 60;
            let diff_m = Math.floor(Math.abs(Math.round(diff_ms/1000)) / 60);


            return `T${(diff_ms < 0) ? "-" : "+"} ${diff_m.toString().padStart(2, "0")}:${diff_s.toString().padStart(2, "0")}`;
        } else {
            return "N/A"
        }
    })
    let legends = t_keys.map(key => telem_channels[key].name);
    let colors = t_keys.map(key => telem_channels[key].color);
    let xaxis = "Time"

    let yaxis_t = `${yaxis_label} (${getUnit(yaxis_unit)})`;
    

    return <GenericGraph xvalues={xvalues} yvalues={yvalues} legends={legends} colors={colors} xaxis={xaxis} yaxis={yaxis_t} />
}