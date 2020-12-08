import * as THREE from "three";
import * as Tone from "tone";
import { Environment, Avatar, TreeObstacle } from "./runnerObjects";
import { KeyboardService } from "./keyboard.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./styles.css";
import { MathUtils } from "three";
import { DrumBackingTrack } from "./sounds.js";
import { BassBackingTrack } from "./sounds.js";

let scene, camera, renderer;
let colour, intensity, light;
let ambientLight;

let drumBackingTrack;
let bassBackingTrack;
let orbit;

let sceneHeight, sceneWidth;

let clock, delta, interval;

let modelLoader, avatarModel;
let speed, avatar, ground, obstacles, numObstacles;
let keyboard;
let startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  // remove overlay
  let overlay = document.getElementById("overlay");
  overlay.remove();
  Tone.start();
  Tone.Transport.bpm.value = 168;
  Tone.Transport.start();
  drumBackingTrack = new DrumBackingTrack();
  bassBackingTrack = new BassBackingTrack();
  //create our clock and set interval at 30 fpx
  clock = new THREE.Clock();
  delta = 0;
  interval = 1 / 2;

  //create our scene
  sceneWidth = window.innerWidth;
  sceneHeight = window.innerHeight;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); //set white background
  scene.fog = new THREE.FogExp2(0xf0ff0, 0.006); //create some fog for vfx

  //create camera
  camera = new THREE.PerspectiveCamera(
    75,
    sceneWidth / sceneHeight,
    0.1,
    10000
  );

  camera.position.z = 35;
  camera.position.y = 30;

  //specify our renderer and add it to our document
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); //renderer with transparent backdrop
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; //enable shadow
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  //create the orbit controls instance so we can use the mouse move around our scene
  orbit = new OrbitControls(camera, renderer.domElement);

  orbit.enabled = false; //disable orbit controls

  // lighting
  colour = 0xffffff; // white
  intensity = 0.8; // 80% intensity
  light = new THREE.DirectionalLight(colour, intensity); // create new directional light

  light.position.set(-20, 50, -5); // set the light's initial position
  light.castShadow = true; // ensure that this light will cast a shadow
  // Please read here for more information about the below: https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 5000;
  light.shadow.camera.left = -500;
  light.shadow.camera.bottom = -500;
  light.shadow.camera.right = 500;
  light.shadow.camera.top = 500;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;

  scene.add(light);
  ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambientLight);

  speed = 2.5;
  avatar = new Avatar(scene);

  //Task 1 part 1
  ground = new Environment(scene);
  keyboard = new KeyboardService();

  numObstacles = 50;
  obstacles = [];
  //task 3 part 4 in here
  light.target = avatar.hero;
  document.addEventListener("keydown", documentKeyDown, false);
  document.addEventListener("keyup", documentKeyUp, false);
  window.addEventListener("resize", onWindowResize, false); //resize callback
  //task 4 part 2 in here
  createTrees(avatar, ground);
  play();
}

/*task 4 part 1 in here*/
function createTrees(avatar, ground) {
  for (let i = 0; i < numObstacles; i++) {
    //loop though until we reach numObstackes
    let randPosX = THREE.MathUtils.randInt(-200, 200); //generate a random position to be used in x axis
    let randPosZ = THREE.MathUtils.randInt(-1000, -3000); //generate a random postion to be used in the y axis

    obstacles.push(new TreeObstacle(randPosX, 7, randPosZ, scene)); //add a new tree to our obstacles array, passing in the random x and z values, keeping them at 7 on the y axis so that they sit nicely on the ground plane
  }
}

/*task 5 part 1 in here*/
function moveTrees() {
  for (let i = 0; i < obstacles.length; i++) {
    //iterate though our obstacles array
    let meshGroup = obstacles[i].meshGroup; //create a local variable and assign our meshGroup of cones contained within the TreeObstacle to it

    //respawn
    if (meshGroup.position.z > camera.position.z) {
      //is the obsacle behind us
      obstacles[i].reset(); //call the reset function to move the obstacle and change its colour to green
    }
  }
}

// stop animating (not currently used)
function stop() {
  renderer.setAnimationLoop(null);
}

// simple render function

function render() {
  renderer.render(scene, camera);
}

// start animating

function play() {
  //using the new setAnimationLoop method which means we are WebXR ready if need be
  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

//our update function

function update() {
  //update stuff in here
  delta += clock.getDelta();

  //Task 3 part 2 in here
  camera.position.z -= speed; //move camera through scene by subtracting speed from its current position
  light.position.copy(camera.position); // use the camera's position to update the directional light's position by copying the camera's position vector3
  light.position.y += 200; // ensure light then stays high above
  light.position.z -= 150; // ensure light then stays in the distance shining back at us
  avatar.update(speed, obstacles, keyboard); // call avatar's update function, passing in our speed, obstacles array and keyboard object as arguments
  ground.update(camera); // call Environment's update function, passing in our camera as an argument
  if (delta > interval) {
    // The draw or time dependent code are here

    //task 5 part 2 in here
    moveTrees();
    delta = delta % interval;
  }
}

function onWindowResize() {
  //resize & align
  sceneHeight = window.innerHeight;
  sceneWidth = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
}

function documentKeyDown(event) {
  // console.log("Down")
  let keyCode = event.keyCode;
  keyboard.keys[keyCode] = true;
}

function documentKeyUp(event) {
  // console.log("Up")
  let keyCode = event.keyCode;
  keyboard.keys[keyCode] = false;
}
