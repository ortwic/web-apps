import './styles/common.css';
import './styles/utils.css';
import './styles/bytemd-custom.css';
import './lib/extensions/array.extension';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app
