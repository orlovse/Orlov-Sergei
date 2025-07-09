import './style.css';
import Sketch from './js/app.js';

document.addEventListener('DOMContentLoaded', () => {});

window.addEventListener('load', () => {
	const canvas = document.querySelector('#canvas');

	if (canvas) {
		new Sketch(document.querySelector('#canvas'));
	}
});
