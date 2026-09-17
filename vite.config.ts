import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
// @ts-expect-error - local server middleware
import { createAuthMiddleware } from './server/authMiddleware.js'

function sqliteAuthPlugin(): Plugin {
  return {
    name: 'sqlite-auth-plugin',
    configureServer(server) {
      server.middlewares.use(createAuthMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(createAuthMiddleware())
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sqliteAuthPlugin()]
})
