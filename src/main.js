import './style.css'

import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import textureURL from './textures/arrow.png'
// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg')
})

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);


renderer.render(scene, camera);

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshBasicMaterial({color: 0xFF6347, wireframe: true});
const torus = new THREE.Mesh(geometry, material)


const gridHelper = new THREE.GridHelper(200, 50)

const controls = new OrbitControls(camera, renderer.domElement);

const matrix = new THREE.Matrix3();

const vectors = [];


function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshBasicMaterial({color:0xffffff, wireframe: true});
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star)
}

Array(200).fill().forEach(addStar)



const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
addVector(new THREE.Vector3(x, y, z));

scene.add(torus)
scene.add(gridHelper)


function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  controls.update();

  renderer.render(scene,camera);
  
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
  geometry.setColors([1, 0, 0, color.r, color.b, color.g]);

  console.log(color.r)
  const lineMat = new LineMaterial( {
    color: 0xffffff,
    linewidth: 5, // in world units with size attenuation, pixels otherwise
    vertexColors: true,

    dashed: false,
    alphaToCoverage: true,
  });

  
  const line = new Line2(geometry, lineMat);
  line.computeLineDistances();

  scene.add(line)
  vectors.push(line)

  const map = new THREE.TextureLoader().load(textureURL, () => {
    console.log("Texture loaded!");
  });
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const arrowMat = new THREE.SpriteMaterial({
    map: map,
    transparent: true
  });
  const arrow = new THREE.Sprite( arrowMat );
  arrow.scale.set(200, 200, 1)
  scene.add(arrow)

  
  const test = new THREE.Mesh(
    new THREE.BoxGeometry(3,3,3),
    new THREE.MeshBasicMaterial( { map: map} )
  );

  scene.add(test)

}

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
});