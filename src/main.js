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
camera.near = 0.01;
camera.far = 1000;
camera.updateProjectionMatrix();


const origin = new THREE.Vector3(0, 0, 0);

renderer.render(scene, camera);

const gridHelper = new THREE.GridHelper(200, 50)

const controls = new OrbitControls(camera, renderer.domElement);

const matrix = new THREE.Matrix3().set(
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),

  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),

  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2)
);


const vectors = [];

const root = new THREE.Group();
scene.add(root);


class ScreenDebugPoints {
  constructor(container = document.body) {
    this.container = container;
    this.dots = [];
  }

  add(color = 'red') {
    const el = document.createElement('div');
    el.className = 'debug-dot';
    el.style.background = color;
    this.container.appendChild(el);
    this.dots.push(el);
    return el;
  }

  update(dot, worldPos, camera, renderer) {
    const v = worldPos.clone().project(camera);

    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;

    dot.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
    dot.style.top  = `${(-v.y * 0.5 + 0.5) * h}px`;
    dot.style.opacity = (v.z < -1 || v.z > 1) ? 0.2 : 1;
  }
}

class vectorObject {
  line;
  arrow;
  pre = new THREE.Vector3(0, 0, 0);
  pos = new THREE.Vector3(0, 0, 0);
  org = new THREE.Vector3(0, 0, 0);
  debug = new ScreenDebugPoints(overlay)
  dot = this.debug.add()
  orgdot = this.debug.add('blue')
  constructor(x, y, z, col1 = new THREE.Color(0xffffff), col2 = col1) {
    this.col1 = col1
    this.col2 = col2

    this.pre = new THREE.Vector3(x, y, z)
    this.pos = this.pre

    const geometry = new LineGeometry();
    geometry.setPositions([0, 0, 0, x, y, z]);
    geometry.setColors([col1.r, col1.g, col1.b, col2.r, col2.g, col2.b]);

    const lineMat = new LineMaterial({
      color: 0xffffff,
      linewidth: 3, // in world units with size attenuation, pixels otherwise
      vertexColors: true,

      dashed: false,
      alphaToCoverage: false,
      depthTest: false,
    });
    lineMat.cap = 'round';
    lineMat.resolution.set(window.innerWidth, window.innerHeight);

    const line = new Line2(geometry, lineMat);
    line.frustumCulled = false;
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

    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;

    this.pos = this.pre.clone().applyMatrix3(matrix)

    this.line.geometry.setPositions([0, 0, 0, this.pos.x, this.pos.y, this.pos.z])
    this.arrow.position.set(this.pos.x, this.pos.y, this.pos.z)


    this.line.material.resolution.set(w, h);

    const originWorld = new THREE.Vector3
    const arrowWorld = new THREE.Vector3();
    const originScreen = new THREE.Vector3();
    const arrowScreen = new THREE.Vector3();

    //originWorld.copy(origin)
    //arrowWorld.copy(this.pos)
    // IMPORTANT PART
    this.line.getWorldPosition(originWorld);
    this.arrow.getWorldPosition(arrowWorld);

    originScreen.copy(originWorld).project(camera);
    arrowScreen.copy(arrowWorld).project(camera);

    const angle = Math.atan2(h * (arrowScreen.y - originScreen.y), w * (arrowScreen.x - originScreen.x) );
    this.arrow.material.rotation = angle - Math.PI / 2;

    this.debug.update(this.dot, arrowWorld, camera, renderer)
    this.debug.update(this.orgdot, originWorld, camera, renderer)
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
  root.add(star)
}

Array(200).fill().forEach(addStar)


const axesHelper = new THREE.AxesHelper()
const test = new vectorObject(20, 20, 20)

root.add(torus)
root.add(gridHelper)
root.add(axesHelper)

const linearMatrix = new THREE.Matrix4();
linearMatrix.setFromMatrix3(matrix)
console.log(linearMatrix)
root.matrixAutoUpdate = false;
root.matrix.copy(linearMatrix);


function animate() {
  requestAnimationFrame(animate);
  root.updateMatrixWorld(true)
  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  controls.update();

  renderer.render(scene,camera);

  test.pre.x += 0.01;
  test.pre.y += 0.01;
  test.pre.z += 0.01;


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