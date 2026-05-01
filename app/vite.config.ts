import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/segu-rings/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
})
