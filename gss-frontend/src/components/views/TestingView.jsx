import React, { useContext, useEffect, useState } from 'react';
import { SingleValue, MultiValue, ValueGroup, SingleValueGroupRow, StatusDisplay, StatusDisplayWithValue } from '../reusable/ValueDisplay.jsx'
import ChoiceSelect from '../reusable/ChoiceSelect.jsx';
import { addRecalculator, CLEAR_T_DATA_FUNC, clearCalculators } from '../dataflow/gssdata.jsx';
import GSSButton from '../reusable/Button.jsx';
 
function fetchComPorts(setComPorts) {
  fetch('http://localhost:5000/ports')
  .then(response => {
    console.log(response.json())
    if (!response.ok) {
      console.error('Network response was not ok');
    }
    setComPorts((val) => response.json())
  })
  // .then(data => setComPorts(data))
  // .catch(error => console.error('Fetch error:', error));

}

export function TestingView() {
  // This view handles user settings
  let comPorts, setComPorts = useState([]);

  return (
    <>
      <div className='telemetry-view'>
        <ul>
          {/* {comPorts.map((port) => (
            <li>
              {port}
            </li>
          ))} */}
        </ul>
        {comPorts}
        <GSSButton onClick={() => {fetchComPorts(setComPorts)}} variant={"blue"} disabled={false}>Get Thingies</GSSButton>

      </div>
    </>
  )
}
