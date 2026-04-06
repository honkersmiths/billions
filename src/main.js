import * as THREE from 'three';
import vertexShader from './shaders/bill.vert';
import fragmentShader from './shaders/bill.frag';

let container;
let camera, scene, renderer;
let timeOffset = 3000;

init();

function init() {

    container = document.getElementById('container');

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10);
    camera.position.z = 6;

    // 2008: 16M
    initOneBillBall(scene, renderer, camera, [-2, 0, 0], 160);

    // 2024: 2.6B
    setTimeout(() =>
            initOneBillBall(scene, renderer, camera, new THREE.Vector3(2, 0, 0), 26000),
        timeOffset);
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
