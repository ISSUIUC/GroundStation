import React, { useState, useEffect, useRef } from 'react';
import "./StreamCommon.css"

export function SponsorRotator() {
  const logoFiles = ['ARRL.png', 'Blue Origin.png', 'Collins Aerospace.png',
    'CUA.png', 'Decibullz.png', 'Engineering Design Council.png', 'Engineering Council.png', 
    'Fibreglast.png', 'Iron Box.jpg', 'JLCPCB.png', 'MG Chemicals.png', 'MJG Technologies.png',
    'Molex.png', 'Northrop Grumman.png', 'PCBWay.png', 'SEDS.png', 'Spherachutes.png', 'UIUC SSC.png',
    'Starfield.png', 'The Damage Company.png', 'UIUC Aerospace Engineering.png', 'UIUC Dads Association.jpg',
    'UIUC ECE.png', 'University of Illinois.png', 'Xbox.png'
  ];
  const logos = logoFiles.map((file) => `/sponsor_list/${file}`);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('bar-slide-out');
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Start rotation with fade
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % logos.length);
      setFadeClass('bar-slide-in');
      // wait for fade-out animation to finish (e.g. 500ms)
      timeoutRef.current = setTimeout(() => {
        setFadeClass('bar-slide-out');
      }, 8000);
    }, 60000 * 10);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [logos.length]);

  return (
    <div className={`sponsor-rotator start-out ${fadeClass}`}>
      <h3 className="sponsor-header">Thank you to our sponsors:</h3>
      <div className="sponsor-box">
        <img
          src={logos[currentIndex]}
          alt={`Sponsor logo ${currentIndex + 1}/${logoFiles[currentIndex]}`}
          onError={(e) => console.error('Failed to load sponsor logo:', logos[currentIndex])}
        />
      </div>
      {/* <h3 className="sponsor-n">{logoFiles[currentIndex].split(".")[0]}</h3> */}
    </div>
  );
}