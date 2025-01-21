
export function SustainerSVG({ visible, angle=0, has_telem=false }) {
    return (<svg id="sustainer-svg" style={{transform: `rotate(${angle}deg)`, transition: "transform 0.2s"}} className={`svg-small ${visible ? "fade-in-delay" : "no-fade-out"} ${has_telem ? "" : "force-hide"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 500">
        <path class="svg-trace-line" d="M34.4,477.76h2.15v-23.85s.86,0,.86,0l17.77,20.58v-23.96s-18.27-41.98-18.27-41.98c0,0,0-266.75,0-306.19S28.12,6.52,28.12,6.52c0,0-8.79,56.41-8.79,95.85s0,306.19,0,306.19L1.06,450.53v23.96s17.77-20.58,17.77-20.58h.86s0,23.85,0,23.85h2.15s0,1.23,0,1.23h6.28s6.28,0,6.28,0v-1.23Z"/>
        <line class="svg-trace-line" x1="30.71" y1="24.95" x2="25.53" y2="24.95"/>
      </svg>)
}

export function BoosterSVG({ visible, angle=0, has_telem=false }) {
    return (<svg id="booster-svg" style={{transform: `rotate(${angle}deg)`, transition: "transform 0.2s"}} className={`svg-small ${visible ? "fade-in-delay" : "no-fade-out"} ${has_telem ? "" : "force-hide"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 500">
        <polygon class="svg-trace-line" points="24.6 453.93 26.96 453.93 26.96 463.25 33.86 463.25 40.76 463.25 40.76 453.93 43.12 453.93 43.12 451.45 66.18 475.95 66.18 451.09 43.25 402.11 43.25 42.73 40.76 23.2 40.76 1.07 33.86 1.07 26.96 1.07 26.96 23.2 24.48 42.73 24.48 402.11 1.54 451.09 1.54 475.95 24.6 451.45 24.6 453.93"/>
      </svg>);
}