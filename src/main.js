import Sketch from './js/app.js';

window.addEventListener('load', () => {
	function detectOS() {
		const platform = navigator.platform.toLowerCase();
		const userAgent = navigator.userAgent.toLowerCase();

		if (platform.includes('mac') || userAgent.includes('mac')) {
			return 'macos';
		} else if (platform.includes('win')) {
			return 'windows';
		} else if (platform.includes('linux')) {
			return 'linux';
		}
		return 'unknown';
	}

	const os = detectOS();
	document.documentElement.classList.add(`is-${os}`);

	const app = document.querySelector('#app');

	if (app) {
		new Sketch({ parentElement: app });
	}
});
