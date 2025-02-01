import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function MapView() {
  const locations = [
    { name: 'QCRC Launch', latitude: 41.49116, longitude: -89.50192, ns: 'N', we: 'W' },
    { name: 'FAR Launch', latitude: 41.49116, longitude: -89.50192, ns: 'N', we: 'W' }
  ];

  const [selectedLocation, setSelectedLocation] = useState(locations[0]);

  const handleLocationChange = (e) => {
    const selected = locations.find(location => location.name === e.target.value);
    setSelectedLocation(selected);
  };

  const Map = (props) => {
    const { latitude, longitude, theme } = props;
    const pluh = ("Dark" === theme);
    useEffect(() => {
      const map = L.map('map').setView([latitude, longitude], 17); //init map

      if(pluh) {
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd'
      }).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
      }
      
      L.control.scale({
        position: 'bottomright',  // Change position
        metric: true,            // Show metric units
        imperial: false,         // Hide imperial units
        maxWidth: 200            // Set max width
      }).addTo(map);
      
      
      L.marker([latitude, longitude]).addTo(map)
        .bindPopup(`${props.name} Location`)
        .openPopup();

      return () => {
        map.remove();
      };
    }, [latitude, longitude]); 

    return (
      <div id="map" style={mapSectionStyle}></div>
    );
  };

  const mapThemes = [
    { name: "Light (More detailed)" },
    { name: "Dark" }
  ];

  const [selectedMapTheme, setSelectedMapTheme] = useState(mapThemes[0]);
  const handleMapThemeChange = (e) => {
    const selected = mapThemes.find(theme => theme.name === e.target.value);
    setSelectedMapTheme(selected);
  };


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
          <h2>Map Theme</h2>
          <select onChange={handleMapThemeChange} value={selectedMapTheme.name}>
            {mapThemes.map(theme => (
              <option key={theme.name} value={theme.name}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
        <Map 
          name={selectedLocation.name} 
          latitude={selectedLocation.latitude} 
          longitude={selectedLocation.longitude}
          theme={selectedMapTheme.name}
        />
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
