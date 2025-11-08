import 'svelte-jsoneditor/themes/jse-theme-dark.css';
import './styles/common.css'
import './styles/utils.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
