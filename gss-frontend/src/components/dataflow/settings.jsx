import React, { useState, useEffect } from 'react';

// Default settings
let GLOBAL_SETTINGS = {
    "unit_system": "METRIC", // Choices: "METRIC", "IMPERIAL"
    "accel_unit_type": "Unit System", // Choices: "Unit System", "Force G"
    "display_type": "DARK", // Choices: "LIGHT", "DARK"
    "autosync": true, // Choices "AUTOSYNC" -> true, "NO SYNC" -> false
    "global_sync": true, // Choices "ENABLED" -> true, "DISABLED" -> false
    "data_retention": 100, // Choices: "ALL" -> -1, LAST 100 -> 100, LAST 50 -> 50, LAST 15 -> 15
    "retain_on_reload": true // Choices: "RETAIN" -> true, "DISCARD" -> false
}

// Maps unit types to the corresponding unit based on unit system
const UNIT_TYPE_MAP = {
    "METRIC": {
        "distance": "m",
        "velocity": "m/s",
        "acceleration": "m/s^2",
        "pressure": "psi", // NOT a metric unit! But psi is easier to work with so we make an exception.
        "power": "db"
    },
    "IMPERIAL": {
        "distance": "ft",
        "velocity": "ft/s",
        "acceleration": "ft/s^2",
        "pressure": "psi",
        "power": "db"
    }
}

export let CONVERSIONS = {}
CONVERSIONS.METER_TO_FEET = m => 3.281*m
CONVERSIONS.FEET_TO_METERS = ft => ft*(1/3.281)
CONVERSIONS.ACCEL_G_TO_UNIT_CONVERSION = g => {
    const force_gs = (getSetting("accel_unit_type") == "Force G");
    const is_imperial = getSetting("unit_system") == "IMPERIAL";
    if(force_gs) {
        return g;
    }

    let m = g*9.81;

    if(is_imperial) {
        return CONVERSIONS.METER_TO_FEET(m);
    }
    return m;
}

export function getUnit(unit_key) {
    if(unit_key === "acceleration") {
        if(getSetting("accel_unit_type") == "Force G") {
            return "G"
        }
    }
    return UNIT_TYPE_MAP[GLOBAL_SETTINGS["unit_system"]][unit_key];
}

export function getSetting(setting_key) {
    return GLOBAL_SETTINGS[setting_key];
}

export function setSetting(setting_key, setting_val) {
    GLOBAL_SETTINGS[setting_key] = setting_val
    localStorage.setItem("settings", JSON.stringify(GLOBAL_SETTINGS))
}

// Load value
const stored_settings = JSON.parse(localStorage.getItem("settings"));

if(stored_settings) {
    GLOBAL_SETTINGS = stored_settings
}
