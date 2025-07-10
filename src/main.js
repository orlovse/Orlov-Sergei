import Sketch from './js/app.js';

window.addEventListener('load', () => {
	const app = document.querySelector('#app');

	if (app) {
		new Sketch({ parentElement: app });
	}

	const experience = document.querySelector('.experience');

	experience.innerText = new Date().getFullYear() - 2020;
});
