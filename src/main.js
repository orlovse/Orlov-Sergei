import './style.css';
import Three from './js/app.js';

document.addEventListener('DOMContentLoaded', () => {});

window.addEventListener('load', () => {
	const canvas = document.querySelector('#canvas');

	if (canvas) {
		new Three(document.querySelector('#canvas'));
	}
});
