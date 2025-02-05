import { DataTestButton } from '../spec/DataTest';
import './Navbar.css';

function NavbarItem({ tab_value, text, selected_tab, tabCallback }) {
    return <div className={`navbar-item ${tab_value==selected_tab ? "navbar-active" : ""}`} onClick={() => tabCallback(tab_value)}>
        <div className={`navbar-item-text`}>{text}</div>
    </div>
}

function StreamSelect({ streamCallback, currentStream }) {
    return <div className="stream-select">
        <select className="stream-select-dropdown" value={currentStream} onChange={(e) => streamCallback(e.target.value)}>
            <option value="sustainer">Sustainer</option>
            <option value="booster">Booster</option>
        </select>
    </div>
}

export function Navbar({ tabCallback, currentTab, streamCallback, currentStream }) {

    const navbar_tabs = {
        "default": "All Telemetry",
        "commanding": "Commanding",
        "structures": "Structures",
        "recovery": "Recovery",
        "video": "Video System",
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