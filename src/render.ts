import * as THREE from 'three';
import { Quaternion } from 'three';
import { OBJLoader } from './OBJLoader'
import { ThreeMFLoader } from './3MFLoader';

export class RocketRender {
    private rocket: THREE.Object3D;
    private renderer: THREE.Renderer;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private canvas: HTMLCanvasElement;
    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
        // this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
        let w = this.canvas.width;
        let h = this.canvas.height;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, this.canvas.width / this.canvas.height, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true});
        this.renderer.setSize(window.innerWidth*2, window.innerHeight*2);
        this.renderer.domElement.style.width = w.toString();
        this.renderer.domElement.style.height = h.toString();
        this.renderer.domElement.width = w
        this.renderer.domElement.height = h
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.scene.background = new THREE.Color(23/255, 26/255, 28/255);
        this.camera.position.set(0, -1, 200);

        const color = new THREE.Color(135/255, 206/255, 235/255);
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(100,100,100);
        light.target.position.set(0,0,0);
        this.scene.add(light);
        this.scene.add(light.target);
        this.scene.add(new THREE.AmbientLight(0xFFFFFF, 0.1));

        new OBJLoader().load("assets\\rocket.obj", (root: THREE.Object3D<THREE.Event>) => {  
            this.rocket = root
            this.rocket.traverse((obj)=>{
                if(obj instanceof THREE.Mesh){
                    obj.material = new THREE.MeshPhysicalMaterial();
                    // obj.material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, shininess: 200});
                }
            });
            this.scene.add(root);
            this.render(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
        }, null, alert);
    }

    updateOrientation(roll: number, pitch: number, yaw: number){
        this.render(new THREE.Quaternion().setFromEuler(new THREE.Euler(roll,pitch,yaw)));
    }
    
    private render(quaternion: THREE.Quaternion) {
        if (this.rocket != undefined) {
            this.rocket.setRotationFromQuaternion(quaternion);
        }
        this.renderer.render(this.scene, this.camera);
    }
}