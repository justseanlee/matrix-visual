import './style.css'

import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

import { create, all } from 'mathjs';

const math = create(all);

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

const gridHelper = new THREE.GridHelper(100, 5)
const fixedGrid = new THREE.GridHelper(400, 10, new THREE.Color(0xcccccc))


const controls = new OrbitControls(camera, renderer.domElement);

let matrix = new THREE.Matrix4().set(
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  0,

  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  0,

  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  THREE.MathUtils.randFloatSpread(2),
  0,

  0,
  0,
  0,
  1
);


const vectors = [];

const root = new THREE.Group();
scene.add(root);

const duration = 10.0;


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

    if(!this.col1.equals(new THREE.Color(0xffffff))) {
      this.pos = this.pre.clone().applyMatrix4(matrix)
    } else {
      this.pos = this.pre
    }
    

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

    //this.debug.update(this.dot, arrowWorld, camera, renderer)
    //this.debug.update(this.orgdot, originWorld, camera, renderer)
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
createBasis(matrix, new THREE.Color(0xffffff))

const test = new vectorObject(20, 20, 20, new THREE.Color(0xefffff))




const square_geometry = new THREE.PlaneGeometry(2, 2);
const edges = new THREE.EdgesGeometry(square_geometry, 90);
const square_material = new THREE.LineBasicMaterial({color: 0xffffff});

const square = new THREE.LineSegments(edges, square_material);
const other_square = new THREE.LineSegments();
other_square.copy(square)
other_square.rotation.x = math.pi/2;


const box_geometry = new THREE.BoxGeometry(100, 100, 100);
const box_edges = new THREE.EdgesGeometry(box_geometry, 90);
const box_material = new THREE.LineBasicMaterial({color: 0xffffff});

const box = new THREE.LineSegments(box_edges, box_material);


root.add(square)
root.add(other_square)
root.add(box)



root.add(torus)
root.add(gridHelper)

scene.add(fixedGrid)
scene.add(axesHelper)

console.log(matrix)
printThreeMat4(matrix)
root.matrixAutoUpdate = false;
root.matrix.copy(matrix);



console.log(matrix);



const clock = new THREE.Clock();
let elapsed = 0;

const atlast = new MatrixAnimation(matrix)

function animate() {
  requestAnimationFrame(animate);
  root.updateMatrixWorld(true)

  elapsed += clock.getDelta();
  let t = elapsed / duration;
  t = Math.min(t, 1);

  atlast.update(t)


  if (t == 1) {
    elapsed = 0;
  }
  root.matrix.copy(matrix);

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





function createBasis(mat, col) {
  const m = mat instanceof THREE.Matrix4 ? threeToMath(mat) : mat
  

  const v1 = math.column(m, 0);
  const v2 = math.column(m, 1);
  const v3 = math.column(m, 2);

  const e1 = new vectorObject(v1[0], v1[1], v1[2], new THREE.Color(0xffffff), new THREE.Color(0xff0000))
  const e2 = new vectorObject(v2[0], v2[1], v2[2], new THREE.Color(0xffffff), new THREE.Color(0x00ff00))
  const e3 = new vectorObject(v3[0], v3[1], v3[2], new THREE.Color(0xffffff), new THREE.Color(0x0000ff))
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


function MatrixAnimation(target) {
  this.decompose = polarDecompose(target);
  this.quatf = new THREE.Quaternion();
  this.quatf.setFromRotationMatrix(this.decompose.R)

  this.eigens = [this.decompose.D.elements[0], this.decompose.D.elements[5], this.decompose.D.elements[10]]
  console.log(this.eigens)

  this.q0 = new THREE.Vector3()
  this.q1 = new THREE.Vector3()
  this.q2 = new THREE.Vector3()

  this.decompose.Q.clone().extractBasis(this.q0, this.q1, this.q2);
  

  this.R_anim = new THREE.Matrix4();
  this.D_anim = new THREE.Matrix4();
  this.S_anim = new THREE.Matrix4();
  this.update = function (t) {
    const rotation = new THREE.Quaternion();
    rotation.slerp(this.quatf, t);

    this.D_anim.set(  THREE.MathUtils.lerp(1, this.eigens[0], t), 0, 0, 0,
                      0, THREE.MathUtils.lerp(1, this.eigens[1], t), 0, 0,
                      0, 0, THREE.MathUtils.lerp(1, this.eigens[2], t), 0,
                      0, 0, 0, 1
                    )

    this.R_anim.makeRotationFromQuaternion(rotation)
    
    const S = computeSMatrix(this.q0, this.q1, this.q2, this.eigens, t)

    this.S_anim.multiplyMatrices(this.decompose.F, S)

    matrix.multiplyMatrices(this.R_anim, this.S_anim);
  }
}


function computeSMatrix(q0, q1, q2, sigmas, t) {
  const s0 = THREE.MathUtils.lerp(1, sigmas[0], t)
  const s1 = THREE.MathUtils.lerp(1, sigmas[1], t)
  const s2 = THREE.MathUtils.lerp(1, sigmas[2], t)

  const m = new THREE.Matrix4()
  m.set(
    s0*q0.x*q0.x + s1*q1.x*q1.x + s2*q2.x*q2.x,
    s0*q0.x*q0.y + s1*q1.x*q1.y + s2*q2.x*q2.y,
    s0*q0.x*q0.z + s1*q1.x*q1.z + s2*q2.x*q2.z,
    0,

    s0*q0.y*q0.x + s1*q1.y*q1.x + s2*q2.y*q2.x,
    s0*q0.y*q0.y + s1*q1.y*q1.y + s2*q2.y*q2.y,
    s0*q0.y*q0.z + s1*q1.y*q1.z + s2*q2.y*q2.z,
    0,

    s0*q0.z*q0.x + s1*q1.z*q1.x + s2*q2.z*q2.x,
    s0*q0.z*q0.y + s1*q1.z*q1.y + s2*q2.z*q2.y,
    s0*q0.z*q0.z + s1*q1.z*q1.z + s2*q2.z*q2.z,
    0,

    0, 0, 0, 1
  )

  return m
}


function polarDecompose(mat4) {
  const A = threeToMath(mat4)

  const M = math.multiply(math.transpose(A), A)
  const ans = math.eigs(M)
  console.log(ans.values)
  console.log(ans.eigenvectors)

  const Q = math.matrixFromColumns(...ans.eigenvectors.map(obj => obj.vector))
  const D = math.diag(ans.values.map(value => math.sqrt(value)))

  
  let S = math.multiply(Q, D, math.transpose(Q))

  let R = math.multiply(A, math.inv(S))
  console.log(math.multiply(math.transpose(R), R))

  let F = math.diag([1, 1, 1])
  if (math.det(R) < 0) {
    F = math.diag([-1, 1, 1])

    R = math.multiply(R, F)  
    S = math.multiply(F, S)   
  }
  const testA = math.multiply(R, S)
  console.log(F)

  //createBasis(S, new THREE.Color(0xff00ff))
  //createBasis(R, new THREE.Color(0xffff00))
  
  
  return {
    R: mathToThree(R),
    Q: mathToThree(Q),
    D: mathToThree(D),
    F: mathToThree(F)
  }
  
}


function threeToMath(mat4){
  const mat3 = new THREE.Matrix3();
  mat3.setFromMatrix4(mat4);
  const e = mat3.elements;

  const m = [
    [e[0], e[3], e[6]],
    [e[1], e[4], e[7]],
    [e[2], e[5], e[8]]
  ]

  return m;
}

function mathToThree(m) {
  const mat4 = new THREE.Matrix4();
  mat4.set( m[0][0], m[0][1], m[0][2], 0,
            m[1][0], m[1][1], m[1][2], 0,
            m[2][0], m[2][1], m[2][2], 0,
            0,       0,       0,       1  )

  return mat4
}

function printThreeMat4(mat, options) {
  const e = mat.elements;

  const m = [
    [ e[0],  e[4],  e[8],  e[12] ],
    [ e[1],  e[5],  e[9],  e[13] ],
    [ e[2],  e[6],  e[10], e[14] ],
    [ e[3],  e[7],  e[11], e[15] ]
  ];

  printMat4(m, options);
}


function printMat4(m, options = {}) {
  const {
    precision = 3,
    pad = 8
  } = options;

  if (!Array.isArray(m) || m.length !== 4 || m.some(r => r.length !== 4)) {
    throw new Error("Expected a 4x4 matrix (array of 4 arrays of length 4)");
  }

  const format = (x) =>
    x.toFixed(precision).padStart(pad, " ");

  const lines = m.map(row =>
    row.map(format).join(" ")
  );

  console.log(lines.join("\n"));
}


window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
});