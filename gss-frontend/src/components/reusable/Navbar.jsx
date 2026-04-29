import { useEffect } from 'react';
import { DataTestButton } from '../spec/DataTest';
import { useFCRoster, useFCAliases, formatSN } from '../dataflow/gssdata.jsx';
import './Navbar.css';

function NavbarItem({ tab_value, text, selected_tab, tabCallback }) {
    return <div className={`navbar-item ${tab_value==selected_tab ? "navbar-active" : ""}`} onClick={() => tabCallback(tab_value)}>
        <div className={`navbar-item-text`}>{text}</div>
    </div>
}

function fcLabel(sn, alias) {
    return alias ? `${alias} (${formatSN(sn)})` : `MIDAS ${formatSN(sn)}`;
}

function StreamSelect({ streamCallback, currentStream }) {
    const rosterRaw = useFCRoster();
    const [aliasesRaw] = useFCAliases();
    // Belt-and-suspenders against malformed context values — render must never throw.
    const roster = Array.isArray(rosterRaw) ? rosterRaw : [];
    const aliases = (aliasesRaw && typeof aliasesRaw === 'object') ? aliasesRaw : {};

    // Auto-select the first available SN once the roster lands, but only if the user
    // hasn't explicitly chosen something already. We override the legacy default literals
    // ("sustainer" / "booster" / "") on first roster arrival; if the user picked an SN
    // that later drops off the roster (radio dip, etc.) we leave their selection alone.
    useEffect(() => {
        if (roster.length === 0) return;
        if (roster.includes(currentStream)) return;
        if (currentStream === "sustainer" || currentStream === "booster" || !currentStream) {
            streamCallback(roster[0]);
        }
    }, [roster, currentStream, streamCallback]);

    if (roster.length === 0) {
        return <div className="stream-select">
            <select className="stream-select-dropdown" disabled value="">
                <option value="">No MIDAS reported</option>
            </select>
        </div>;
    }

    return <div className="stream-select">
        <select className="stream-select-dropdown" value={currentStream} onChange={(e) => streamCallback(e.target.value)}>
            {roster.map(sn => (
                <option key={sn} value={sn}>{fcLabel(sn, aliases[sn])}</option>
            ))}
        </select>
    </div>
}

export function Navbar({ tabCallback, currentTab, streamCallback, currentStream }) {

    const navbar_tabs = {
        "default": "All Telemetry",
        "commanding": "Commanding",
        // "structures": "Structures",
        // "recovery": "Recovery"
        "map": "Map",
        // "video": "Video System",
        "sys_diag": "System",
        "settings": "Settings"
    }

    return (
    <div className="navbar-container">
        <div className="alt-tab-select">
            <select className="stream-select-dropdown" onChange={(e) => tabCallback(e.target.value)}>
                {Object.keys(navbar_tabs).map((tab) => {
                    return <option value={tab}>{navbar_tabs[tab]}</option>
                })}
            </select>
        </div>
        <div className="navbar-items">
            {Object.keys(navbar_tabs).map((tab) => {
                return <NavbarItem tab_value={tab} text={navbar_tabs[tab]} selected_tab={currentTab} tabCallback={tabCallback} />
            })}
        </div>
        <StreamSelect streamCallback={streamCallback} currentStream={currentStream} />
    </div>);
}