import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
	width: window.innerWidth,
	height: window.innerHeight,
	pixelRatio: window.devicePixelRatio,
};

export default class Sketch {
	constructor(canvas) {
		this.canvas = canvas;

		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(
		70,
		device.width / device.height,
		0.1,
		100,
		);
		this.camera.position.set(0, 0, 2);
		this.scene.add(this.camera);

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			alpha: true,
			antialias: true,
			preserveDrawingBuffer: true,
		});
		this.renderer.setSize(device.width, device.height);
		this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

		this.controls = new OrbitControls(this.camera, this.canvas);

		this.clock = new THREE.Clock();

		this.setLights();
		this.setGeometry();
		this.render();
		this.setResize();
	}

	setLights() {
		this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
		this.scene.add(this.ambientLight);
	}

	setGeometry() {
		this.planeGeometry = new THREE.PlaneGeometry(1, 1, 128, 128);
		this.planeMaterial = new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
			wireframe: true,
			fragmentShader: fragment,
			vertexShader: vertex,
			uniforms: {
				progress: { type: 'f', value: 0 },
			},
		});

		this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
		this.scene.add(this.planeMesh);
	}

	render() {
		const elapsedTime = this.clock.getElapsedTime();

		this.planeMesh.rotation.x = 0.2 * elapsedTime;
		this.planeMesh.rotation.y = 0.1 * elapsedTime;

		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this.render.bind(this));
	}

	setResize() {
		window.addEventListener('resize', this.onResize.bind(this));
	}

	onResize() {
		device.width = window.innerWidth;
		device.height = window.innerHeight;

		this.camera.aspect = device.width / device.height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(device.width, device.height);
		this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
	}
}
