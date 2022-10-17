import { ipcMain, ipcRenderer } from 'electron';
import { ServerConnection } from './serverConnection';
import * as fs from "fs";
import * as path from "path";
import { parse } from 'csv-parse';
import * as $ from "jquery";
import "bootstrap-select";



const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Location = {
    name: string;
    latitude: number;
    longitude: number;
    altitude: number;
  };


console.log(__dirname);
let submit_button = <HTMLButtonElement>document.getElementById("submit");
let lat_input = <HTMLInputElement>document.getElementById("lat");
let long_input = <HTMLInputElement>document.getElementById("long");
let alt_input = <HTMLInputElement>document.getElementById("alt");
let dropdown = <HTMLInputElement>document.getElementById("changeloc");

let locations: Location[] = [];
let Custom = {name: "Custom", latitude: 0, longitude: 0, altitude: 0};
locations.push(Custom);


// there's definitely a better way to do this.
// NOTE: THIS RUNS ASYNCRONOUSLY. TRYING TO REFERENCE ANY ATTRIBUTE/VALUE
// OF locations WILL FAIL UNLESS A DELAY IS GIVEN.
(() => {
    const csvFilePath = path.resolve(__dirname, '../build/homecoords.csv');
  
    const headers = ['name', 'latitude', 'longitude', 'altitude'];
  
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  
    parse(fileContent, {
        delimiter: ',',
        columns: headers,
    }, (error, result: Location[]) => {
        if (error) {
            console.error(error);
        }
        for (let i = 0; i < result.length; i++) { 
            locations.push({
                name: result[i].name,
                latitude: result[i].latitude,
                longitude: result[i].longitude,
                altitude: result[i].altitude});
        }
        $(".selectpicker").append('<option value="' + 0 + '">' + "Custom" + '</option>');
        result.forEach((element, index) => {
            $(".selectpicker").append('<option value="' + (index + 1) + '">' + element.name + '</option>');
        });
            $('.selectpicker').selectpicker('refresh');
        $(".selectpicker").selectpicker()    
    });
  })();

submit_button.addEventListener("click", () => {
    ipcRenderer.send('homecoords', parseFloat(lat_input.value), parseFloat(long_input.value), parseFloat(alt_input.value));
    // call_sign_input.value = "";
});


dropdown.addEventListener('change', () => {
    var e = (document.getElementById("changeloc")) as HTMLSelectElement;
    var index = parseInt(e.options[e.selectedIndex].value);

    (<HTMLInputElement>document.getElementById('lat')).value = locations[index].latitude.toString();
    (<HTMLInputElement>document.getElementById('long')).value = locations[index].longitude.toString();
    (<HTMLInputElement>document.getElementById('alt')).value = locations[index].altitude.toString();
    console.log("changed!")
});


async function run() {
    await sleep(75);
    console.log(locations);
    console.log(locations.length);  
}

run();

