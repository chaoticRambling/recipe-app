import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { handler as importRecipeUrlHandler } from './netlify/functions/import-recipe-url.js'

function netlifyFunctionDevMiddleware() {
  return {
    name: 'netlify-function-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/.netlify/functions/import-recipe-url', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => {
          body += chunk
        })

        req.on('end', async () => {
          try {
            const result = await importRecipeUrlHandler({
              httpMethod: req.method,
              body
            })

            res.statusCode = result.statusCode || 200
            Object.entries(result.headers || {}).forEach(([key, value]) => {
              res.setHeader(key, value)
            })
            res.end(result.body || '')
          } catch (error) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'Recipe import failed.' }))
          }
        })
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    netlifyFunctionDevMiddleware(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Blumenthal Recipes',
        short_name: 'Recipes',
        theme_color: '#FAFAF7',
        background_color: '#FAFAF7',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
