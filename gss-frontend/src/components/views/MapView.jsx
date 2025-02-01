import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTelemetry } from '../dataflow/gssdata.jsx';

export function MapView() {

  const redDotIcon = L.icon({
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  const locations = [
    { name: 'QCRC Launch', latitude: 41.49116, longitude: -89.50192, ns: 'N', we: 'W' },
    { name: 'FAR Launch', latitude: 41.49116, longitude: -89.50192, ns: 'N', we: 'W' }
  ];

  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [markers, setMarkers] = useState([]); // State for storing markers
  const [map, setMap] = useState(null); // Store the map reference

  const rocket_latitude = useTelemetry("/value.latitude") || 0;
  const rocket_longitude = useTelemetry("/value.longitude") || 0;

  const handleLocationChange = (e) => {
    const selected = locations.find(location => location.name === e.target.value);
    setSelectedLocation(selected);
  };

  // Initialize map only once
  useEffect(() => {
    const mapInstance = L.map('map').setView([selectedLocation.latitude, selectedLocation.longitude], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance);

    L.control.scale({
      position: 'bottomright',
      metric: true,
      imperial: false,
      maxWidth: 200
    }).addTo(mapInstance);

    setMap(mapInstance);

    // Cleanup map on unmount
    return () => {
      mapInstance.remove();
    };
  }, []); // This effect runs only once on mount

  useEffect(() => {
    if (map && rocket_latitude && rocket_longitude) {
      const newMarker = L.marker([rocket_latitude, rocket_longitude], { icon: redDotIcon }).addTo(map);
      setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
    }
  }, [rocket_latitude, rocket_longitude, map]); // Only runs when telemetry or map changes

  useEffect(() => {
    if (map) {
      map.setView([selectedLocation.latitude, selectedLocation.longitude], 17);
    }
  }, [selectedLocation, map]);

  return (
    <>
      <div style={containerStyle}>
        <div style={textSectionStyle}>
          <h2>Select a Location</h2>
          <select onChange={handleLocationChange} value={selectedLocation.name}>
            {locations.map(location => (
              <option key={location.name} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>
          <div>
            <h3>Selected Location Details</h3>
            <p>Latitude: {selectedLocation.latitude}° {selectedLocation.ns}</p>
            <p>Longitude: {selectedLocation.longitude}° {selectedLocation.we}</p>
          </div>
          <div>
            <h3>Last Pinged Rocket Position</h3>
            <p>Latitude: {rocket_latitude}</p>
            <p>Longitude: {rocket_longitude}</p>
          </div>
        </div>
        <div id="map" style={mapSectionStyle}></div>
      </div>
    </>
  );
}

// CSS styles
const containerStyle = {
  display: 'flex',
  height: '100vh',
};

const textSectionStyle = {
  width: '300px',
  padding: '20px',
  overflowY: 'auto',
  backgroundColor: '#474747',
  color: '#FFFFFF'
};

const mapSectionStyle = {
  flexGrow: 1,
  height: '100%',
};
