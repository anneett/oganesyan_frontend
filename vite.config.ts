import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5177',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => {
                    console.log(path)
                    return path;
                },
            },
        },
    },
})
