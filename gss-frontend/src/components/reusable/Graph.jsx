import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from 'chart.js';
import './Graph.css';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

export const Graph = ({ initialData, initialLabels }) => {
    const chartRef = useRef(null);
    const [data, setData] = useState({
        labels: initialLabels,
        datasets: [
            {
                label: 'Telemetry Data',
                data: initialData,
                borderColor: 'var(--line-color)',
                backgroundColor: 'var(--point-color)',
                pointRadius: 3,
                borderWidth: 2,
            },
        ],
    });

    const addDataPoint = (label, dataPoint) => {
        setData(prevData => {
            const newLabels = [...prevData.labels, label];
            const newData = [...prevData.datasets[0].data, dataPoint];
            return {
                labels: newLabels,
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: newData,
                    },
                ],
            };
        });
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true, // Allows resizing without changing the aspect ratio
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time',
                    color: 'var(--axis-color)',
                },
                ticks: {
                    color: 'var(--tick-color)',
                },
                grid: {
                    color: 'var(--grid-color)',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Value',
                    color: 'var(--axis-color)',
                },
                ticks: {
                    color: 'var(--tick-color)',
                },
                grid: {
                    color: 'var(--grid-color)',
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: 'var(--legend-color)',
                },
            },
            tooltip: {
                backgroundColor: 'var(--tooltip-bg-color)',
                titleColor: 'var(--tooltip-title-color)',
                bodyColor: 'var(--tooltip-body-color)',
            },
        },
    };

    return (
        <div className="graph-container">
            <Line ref={chartRef} data={data} options={options} />
            <button onClick={() => addDataPoint('New Label', Math.random() * 100)}>Add Data Point</button>
        </div>
    );
};

