# LogosCritique (PWA + Vercel Serverless)

Aplicación web progresiva (PWA) para analizar, deconstruir y refutar argumentos de forma objetiva, con separación entre lógica, evidencia científica y reflexión teológica.

## Estructura del proyecto

- `index.html`: Interfaz móvil (*mobile-first*), 5 paletas de colores accesibles desde el botón **Paleta**, gráficos SVG, historial local (`localStorage`) y registro de *Service Worker*.
- `manifest.json`: Configuración PWA para instalar en Android e iOS.
- `sw.js`: Caché de archivos estáticos para carga rápida.
- `icon.svg`: Ícono vectorial de la aplicación.
- `api/analyze.js`: Función *serverless* en Vercel que conecta de forma segura con la API de Gemini usando `GEMINI_API_KEY`.
- `vercel.json`: Reglas de enrutamiento para Vercel.

## Pasos para subir a GitHub y desplegar en Vercel

1. **Crear repositorio en GitHub:**
   - Crea un repositorio nuevo (por ejemplo `logos-critique`) y sube todos los archivos de este ZIP (manteniendo `api/analyze.js` dentro de la carpeta `api/`).
2. **Importar en Vercel:**
   - Entra a Vercel, haz clic en **Add New → Project** y selecciona tu repositorio de GitHub.
3. **Configurar variable de entorno en Vercel:**
   - En **Settings → Environment Variables**, agrega:
     - Nombre: `GEMINI_API_KEY`
     - Valor: tu clave de API de Gemini.
4. **Desplegar:**
   - Haz clic en **Deploy** (o **Redeploy** si agregaste la variable después).
