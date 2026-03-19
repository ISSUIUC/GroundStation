import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), cesium()],
})
