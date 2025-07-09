import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';
import simFragment from '../shaders/fbo/simFragment.glsl';
import simVertex from '../shaders/fbo/simVertex.glsl';
import GUI from 'lil-gui';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const THEME = {
	light: {
		particles: new THREE.Color('#ffb361'),
	},
	dark: {
		particles: new THREE.Color('#517fa4'),
	},
};

export default class Sketch {
	constructor(options) {
		this.scene = new THREE.Scene();

		this.time = 0;
		this.container = options.parentElement;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;

		this.camera = new THREE.PerspectiveCamera(
		70,
		this.width / this.height,
		0.01,
		1000,
		);

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(this.width, this.height);
		this.renderer.setClearColor(0x000000, 0);
		this.container.appendChild(this.renderer.domElement);

		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();

		this.camera.position.set(0, 0, 3);
		// this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.time = 0;

		const THREE_PATH = `https://unpkg.com/three@0.${THREE.REVISION}`;
		this.dracoLoader = new DRACOLoader(new THREE.LoadingManager()).setDecoderPath(`${THREE_PATH}/examples/jsm/libs/draco/gltf/`);
		this.gltfLoader = new GLTFLoader();
		this.gltfLoader.setDRACOLoader(this.dracoLoader);

		this.isPlaying = true;

		this.setupEvents();
		this.setupFBO();
		this.addObjects();
		this.setupResize();
		this.render();
		this.resize();
		// this.setupSettings();
		this.setupThemeColors();
		this.setupScrollAnimation();
	}

	setupEvents() {
		this.dummy = new THREE.Mesh(
			new THREE.PlaneGeometry(100, 100),
			new THREE.MeshBasicMaterial(),
		);
		document.addEventListener('mousemove', (e) => {
			this.pointer.x = (e.clientX / this.width) * 2 - 1;
			this.pointer.y = -(e.clientY / this.height) * 2 + 1;

			this.raycaster.setFromCamera(this.pointer, this.camera);

			const intersects = this.raycaster.intersectObject(this.dummy);

			if (intersects.length > 0) {
				let { x, y } = intersects[0].point;
				this.fboMaterial.uniforms.uMouse.value = new THREE.Vector2(x, y);
			}
		});
	}

	setupSettings() {
		this.settings = {
			progress: 0,
		};
		this.gui = new GUI();
		this.gui.add(this.settings, 'progress', 0, 1, 0.01).onChange(() => {});
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this));
	}

	getRenderTarget() {
		return new THREE.WebGLRenderTarget(this.width, this.height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
		});
	}

	setupFBO() {
		this.size = 256;
		this.fbo = this.getRenderTarget();
		this.fbo1 = this.getRenderTarget();

		this.fboScene = new THREE.Scene();
		this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
		this.fboCamera.position.set(0, 0, 0.5);
		this.fboCamera.lookAt(0, 0, 0);
		const geometry = new THREE.PlaneGeometry(2, 2);

		this.data = new Float32Array(this.size * this.size * 4);

		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = (i + j * this.size) * 4;
				const theta = Math.random() * Math.PI * 2;
				const r = 0.5 + Math.random() * 0.5;
				this.data[index] = Math.cos(theta) * r;
				this.data[index + 1] = Math.sin(theta) * r;
				this.data[index + 2] = 1;
				this.data[index + 3] = 1;
			}
		}

		this.fboTexture = new THREE.DataTexture(
			this.data,
			this.size,
			this.size,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		this.fboTexture.minFilter = THREE.NearestFilter;
		this.fboTexture.magFilter = THREE.NearestFilter;
		this.fboTexture.needsUpdate = true;

		this.fboMaterial = new THREE.ShaderMaterial({
			fragmentShader: simFragment,
			vertexShader: simVertex,
			uniforms: {
				uPositions: {
					value: this.fboTexture,
				},
				time: {
					value: 0,
				},
				uInfo: {
					value: null,
				},
				uMouse: {
					value: new THREE.Vector2(0, 0),
				},
			},
		});

		this.infoArray = new Float32Array(this.size * this.size * 4);

		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = (i + j * this.size) * 4;
				this.infoArray[index] = 0.5 + Math.random();
				this.infoArray[index + 1] = 0.5 + Math.random();
				this.infoArray[index + 2] = 1;
				this.infoArray[index + 3] = 1;
			}
		}

		this.info = new THREE.DataTexture(
			this.infoArray,
			this.size,
			this.size,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		this.info.minFilter = THREE.NearestFilter;
		this.info.magFilter = THREE.NearestFilter;
		this.info.needsUpdate = true;

		this.fboMaterial.uniforms.uInfo.value = this.info;

		this.fboMesh = new THREE.Mesh(geometry, this.fboMaterial);
		this.fboScene.add(this.fboMesh);

		this.renderer.setRenderTarget(this.fbo);
		this.renderer.render(this.fboScene, this.fboCamera);

		this.renderer.setRenderTarget(this.fbo1);
		this.renderer.render(this.fboScene, this.fboCamera);
	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}

	addObjects() {
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable',
			},
			fragmentShader: fragment,
			vertexShader: vertex,
			side: THREE.DoubleSide,
			// wireframe: false,
			uniforms: {
				time: {
					value: 0,
				},
				resolution: {
					value: new THREE.Vector4(),
				},
				uPositions: {
					value: null,
				},
				uColor: {
					value: THEME.light.particles,
				},
				uScale: {
					value: 0.3,
				},
			},
		});

		this.count = this.size ** 2;

		const geometry = new THREE.BufferGeometry();
		const positions = new Float32Array(this.count * 3);
		const uv = new Float32Array(this.count * 2);

		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = i + j * this.size;
				positions[index * 3] = Math.random();
				positions[index * 3 + 1] = Math.random();
				positions[index * 3 + 2] = 0;
				uv[index * 2] = i / this.size;
				uv[index * 2 + 1] = j / this.size;
			}
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

		this.material.uniforms.uPositions.value = this.fboTexture;
		this.points = new THREE.Points(geometry, this.material);
		this.scene.add(this.points);
	}

	setupThemeColors() {
		const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');

		const applyTheme = (isDark) => {
			const currentTheme = isDark ? THEME.dark : THEME.light;

			if (this.material) {
				this.material.uniforms.uColor.value = currentTheme.particles;
			}
		};

		darkThemeMq.addEventListener('change', (e) => {
			applyTheme(e.matches);
		});

		applyTheme(darkThemeMq.matches);
	}

	setupScrollAnimation() {
		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: '.app__main',
				start: 'top top',
				end: '+=200%',
				scrub: 1.2,
			},
		});

		tl.to(this.material.uniforms.uScale, { value: 1.2 }, 0);

		tl.to('.app__header', {
			y: '-40vh',
			ease: 'power1.inOut',
		}, 0);

		tl.to('.app__info', {
			y: '10vh',
			ease: 'power1.inOut',
		}, 0.1);

		tl.to('.app__detail-block', {
			opacity: 1,
			y: 0,
			stagger: 0.2,
			ease: 'power2.out',
		}, 0.3);
	}

	render() {
		if (!this.isPlaying) return;
		this.time += 0.05;
		this.material.uniforms.time.value = this.time;
		this.fboMaterial.uniforms.time.value = this.time;
		window.requestAnimationFrame(this.render.bind(this));

		this.fboMaterial.uniforms.uPositions.value = this.fbo1.texture;
		this.material.uniforms.uPositions.value = this.fbo.texture;

		this.renderer.setRenderTarget(this.fbo);
		this.renderer.render(this.fboScene, this.fboCamera);
		this.renderer.setRenderTarget(null);
		this.renderer.render(this.scene, this.camera);

		const temp = this.fbo;
		this.fbo = this.fbo1;
		this.fbo1 = temp;
	}
}
