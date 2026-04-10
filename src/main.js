import * as THREE from 'three';
import vertexShader from './shaders/bill.vert';
import fragmentShader from './shaders/bill.frag';
import {FontLoader, TextGeometry} from "three/addons";
import fontUrl from './assets/fonts/helvetiker_bold.typeface.json?url';

let camera, scene, renderer;
let timeOffset = 3000;
let myFont;

init();

function init() {

    let container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101020);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10);
    camera.position.z = 6;

    buildScene();
}


function buildScene() {

    let xOff;
    let yOff;

    console.log("w: " + window.innerWidth + ", h: " + window.innerHeight);

    if (window.innerWidth > window.innerHeight) {
        // Landscape
        xOff = window.innerWidth / window.innerHeight;
        yOff = 0;
    } else {
        // Portrait
        xOff = 0;
        yOff = window.innerHeight > window.innerWidth;
    }

    scene.clear();
    initOneBillBall(scene, renderer, camera, [-xOff, yOff, 0], 160);
    initOneBillBall(scene, renderer, camera, new THREE.Vector3(xOff, -yOff, 0), 26000);

    const loader = new FontLoader();
    loader.load(fontUrl, function ( font ) {

        if (xOff > 0) {
            createTextGeometry(font, '2008:  $16,000,000', [-2, -2, 0]);
            createTextGeometry(font, '2024:  $2,600,000,000', [2, -2, 0]);
        } else {
            createTextGeometry(font, '2008:  $16,000,000', [0, 0.15, 0]);
            createTextGeometry(font, '2024:  $2,600,000,000', [0, -0.15, 0]);
        }
        myFont = font;
    } );
}

function createTextGeometry(font, message, position) {

    const color = 0x6090f0;

    const matDark = new THREE.LineBasicMaterial({
        color: color,
        side: THREE.DoubleSide
    });

    const matLite = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    const shapes = font.generateShapes(message, 60 / window.innerHeight);
    const geometry = new THREE.ShapeGeometry(shapes);

    geometry.computeBoundingBox();
    // geometry.scale(0.001, 0.001, 0.001);
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid + position[0], position[1], position[2]);

    const text = new THREE.Mesh(geometry, matLite);
    scene.add(text);
}

function initOneBillBall(scene, renderer, camera, globalOffset, billCount) {

    // geometry
    const vector = new THREE.Vector4();
    const instances = billCount;
    const offsets = [];
    const colors = [];
    const orientationsStart = [];
    const orientationsEnd = [];

    // Approximate bill shape
    const positions = new Float32Array( [
        -0.025, -0.0625,  0.025, // v0
        0.025, -0.0625,  0.025, // v1
        0.025,  0.0625,  0.025, // v2
        0.025,  0.0625,  0.025, // v3
        -0.025,  0.0625,  0.025, // v4
        -0.025, -0.0625,  0.025  // v5
    ] );

    // instanced attributes
    for ( let i = 0; i < instances; i ++ ) {

        // offsets
        offsets.push( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );

        // colors - suggestive greens (we could use alpha, which has its benefits, but going opaque for now)
        colors.push( Math.random() * 0.1, Math.random() * 0.3 + 0.4, Math.random() * 0.1, 1.0 );

        // orientation start
        vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
        vector.normalize();

        orientationsStart.push( vector.x, vector.y, vector.z, vector.w );

        // orientation end
        vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
        vector.normalize();

        orientationsEnd.push( vector.x, vector.y, vector.z, vector.w );
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = instances; // set so its initialized for dat.GUI, will be set in first draw otherwise

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );

    geometry.setAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
    geometry.setAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 4 ) );
    geometry.setAttribute( 'orientationStart', new THREE.InstancedBufferAttribute( new Float32Array( orientationsStart ), 4 ) );
    geometry.setAttribute( 'orientationEnd', new THREE.InstancedBufferAttribute( new Float32Array( orientationsEnd ), 4 ) );

    // material
    const material = new THREE.RawShaderMaterial( {

        uniforms: {
            'time': { value: 1.0 },
            'sineTime': { value: 1.0 },
            'globalOffset': {value: globalOffset}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide,
        forceSinglePass: true,
        transparent: true

    } );

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

    buildScene();

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    const time = performance.now();
    let which = 0;

    scene.traverse((child) =>
    {
        // Slightly hacky traversal
        if (child.material && child.material.uniforms) {
            child.material.uniforms['time'].value = (time - which * timeOffset) * 0.005;
            child.material.uniforms['sineTime'].value = Math.sin(child.material.uniforms['time'].value * 0.05);
            which++;
        }
    });

    renderer.render( scene, camera );
}
