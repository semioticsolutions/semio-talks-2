import './app.css'
import App from './App.svelte'
import semiIcon from './assets/semi.png';


const app = new App({
  target: document.getElementById('app'),
})

window.addEventListener('load', () => {
  const linkIcon = document.querySelector('link[rel="icon"]');
  if (linkIcon) linkIcon.setAttribute('href', semiIcon);
});

export default app

