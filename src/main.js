import './style.css'

import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true
})
renderer.getContext().enable(renderer.getContext().SAMPLE_ALPHA_TO_COVERAGE);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

const origin = new THREE.Vector3(0, 0, 0);

renderer.render(scene, camera);

const gridHelper = new THREE.GridHelper(200, 50)

const controls = new OrbitControls(camera, renderer.domElement);

const matrix = new THREE.Matrix3();

const vectors = [];


class vectorObject {
  line;
  arrow;
  pos = new THREE.Vector3(0, 0, 0);
  org = new THREE.Vector3(0, 0, 0);
  constructor(x, y, z, col1 = new THREE.Color(0xffffff), col2 = col1) {
    this.col1 = col1
    this.col2 = col2

    this.pos = new THREE.Vector3(x, y, z)

    const geometry = new LineGeometry();
    geometry.setPositions([0, 0, 0, x, y, z]);
    geometry.setColors([col1.r, col1.g, col1.b, col2.r, col2.g, col2.b]);

    const lineMat = new LineMaterial({
      color: 0xffffff,
      linewidth: 3, // in world units with size attenuation, pixels otherwise
      vertexColors: true,

      dashed: false,
      alphaToCoverage: true,
    });
    lineMat.cap = 'round';
    lineMat.resolution.set(window.innerWidth, window.innerHeight);

    const line = new Line2(geometry, lineMat);
    line.computeLineDistances();

    this.line = line;
    scene.add(this.line)

    const map = new THREE.TextureLoader().load('arrow.png', () => {
      console.log("Texture loaded!");
    });


    const arrowMat = new THREE.SpriteMaterial({
      map: map,
      transparent: true,
      sizeAttenuation: false,
      color: col2
    });
    const arrow = new THREE.Sprite(arrowMat);
    arrow.scale.set(0.04, 0.04, 1)
    arrow.center.set(0.5, 0.8);

    arrow.position.set(x, y, z);
    this.arrow = arrow;
    scene.add(this.arrow)

    vectors.push(this)
  }


  update() {
    this.line.geometry.setPositions([0, 0, 0, this.pos.x, this.pos.y, this.pos.z])
    this.arrow.position.set(this.pos.x, this.pos.y, this.pos.z)


    const originScreen = new THREE.Vector3();
    const arrowScreen = new THREE.Vector3();

    originScreen.copy(origin).project(camera);
    arrowScreen.copy(this.pos).project(camera);

    const angle = Math.atan2(arrowScreen.y - originScreen.y, arrowScreen.x - originScreen.x);
    this.arrow.material.rotation = angle - Math.PI / 2;
  }
}







const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshBasicMaterial({color: 0xFF6347, wireframe: true});
const torus = new THREE.Mesh(geometry, material)

const basis = {
    x: new vectorObject(1, 0, 0, new THREE.Color(0xf2777a)),
    y: new vectorObject(0, 1, 0, new THREE.Color(0x91d191)),
    z: new vectorObject(0, 0, 1, new THREE.Color(0x6ab0f3))
}


let testarr;

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshBasicMaterial({color:0xffffff, wireframe: true});
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star)
}

Array(200).fill().forEach(addStar)



const test = new vectorObject(20, 20, 20)

scene.add(torus)
scene.add(gridHelper)




function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  controls.update();

  renderer.render(scene,camera);

  test.pos.x += 0.01;
  test.pos.y += 0.01;
  test.pos.z += 0.01;

  for (const vector of vectors) {
    vector.update()
  }
  
}

animate()


function addBasis() {
  const basis = {
    x: new THREE.Vector3(),
    y: new THREE.Vector3(),
    z: new THREE.Vector3()
  }
  matrix.extractBasis(basis.x, basis.y, basis.z);

  const counter = 0;
  for (const b in basis) {
    const geometry = new LineGeometry();
    geometry.setPositions([new THREE.Vector3, b])
    geometry.setColors([])
    counter++;
  }
}


function addVector(v, color = new THREE.Color(0xffffff)) {
  

  const geometry = new LineGeometry();
  geometry.setPositions([0, 0, 0, v.x, v.y, v.z]);
  geometry.setColors([1, 0, 0, color.r, color.g, color.b]);

  console.log(color.r)
  const lineMat = new LineMaterial( {
    color: 0xffffff,
    linewidth: 3, // in world units with size attenuation, pixels otherwise
    vertexColors: true,
    
    dashed: false,
    alphaToCoverage: true,
  });
  lineMat.cap = 'round';
  lineMat.resolution.set(window.innerWidth, window.innerHeight);
  
  const line = new Line2(geometry, lineMat);
  line.computeLineDistances();



  const map = new THREE.TextureLoader().load('arrow.png', () => {
    console.log("Texture loaded!");
  });


  const arrowMat = new THREE.SpriteMaterial({
    map: map,
    transparent: true,
    sizeAttenuation: false,
    color: color
  });
  const arrow = new THREE.Sprite( arrowMat );
  arrow.scale.set(0.04, 0.04, 1)
  arrow.center.set(0.5, 0.8);

  arrow.position.set(v.x, v.y, v.z);
  testarr = arrow;

  const group = new THREE.Group();
  group.add(arrow);
  group.add(line);
  scene.add(group);

  const sphere = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({color:0xffffff, wireframe: true});
  const pos = new THREE.Mesh(sphere, material);
  pos.position.set(group.position.x, group.position.y, group.position.z)
  console.log(line.position)
  console.log(pos.position)
  scene.add(pos) 
}




window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
});