import React, { useState, useEffect, useRef } from 'react';
import "./StreamCommon.css"

export function SponsorRotator() {
  const logoFiles = ['ARRL.png', 'Blue Origin.png', 'Collins Aerospace.png',
    'CUA.png', 'Decibullz.png', 'Engineering Design Council.png', 'Engineering Council.png', 
    'Fibreglast.png', 'Iron Box.jpg', 'JLCPCB.png', 'mgchemicalslg.png', 'MJG Technologies.png',
    'Molex.png', 'Northrop Grumman.png', 'PCBWay.png', 'SEDS.png', 'Spherachutes.png', 'SSC.png',
    'Starfield.png', 'The Damage Company.png', 'UIUC Aerospace Engineering.png', 'UIUC Dads Association.jpg',
    'uiucece.png', 'uiuc.png', 'Xbox.png'
  ];
  const logos = logoFiles.map((file) => `/sponsor_list/${file}`);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('generic-fade-in');
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Start rotation with fade
    intervalRef.current = setInterval(() => {
      setFadeClass('generic-fade-out');
      // wait for fade-out animation to finish (e.g. 500ms)
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % logos.length);
        setFadeClass('generic-fade-in');
      }, 1000);
    }, 6000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [logos.length]);

  return (
    <div className="sponsor-rotator">
      <h3 className="sponsor-header">Thank you to our sponsors:</h3>
      <div className="sponsor-box">
        <img
          src={logos[currentIndex]}
          alt={`Sponsor logo ${currentIndex + 1}`}
          className={`start-hidden ${fadeClass}`}
          onError={(e) => console.error('Failed to load sponsor logo:', logos[currentIndex])}
        />
      </div>
    </div>
  );
}