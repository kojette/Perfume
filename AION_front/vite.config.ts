import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 백엔드 API 프록시 설정
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 백엔드 서버 주소 (Spring Boot 기본 포트)
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, '') // 필요시 /api 제거
      }
    },
    // 개발 서버 포트 설정 (선택사항)
    port: 3000,
  }
})