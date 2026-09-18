import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), sqliteAuthPlugin()]
  };
})
