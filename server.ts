import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Confiar en los proxies (necesario en Render, Vercel, Railway, etc. para obtener la IP real del usuario)
  app.set('trust proxy', 1);

  // Configurar límite de peticiones (Rate Limiting)
  // Permite un máximo de 5 descargas por cada IP en un lapso de 1 minuto
  const downloadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, 
    message: { error: 'Has superado el límite de descargas seguidas. Por favor, espera un minuto.' },
    standardHeaders: true, // Retorna info de límite en headers RateLimit-*
    legacyHeaders: false, // Deshabilita headers antiguos X-RateLimit-*
  });

  app.use(express.json());

  // Endpoint para descargar video de TikTok
  app.post('/api/download', downloadLimiter, async (req, res) => {
    const { url, format = 'mp4' } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'La URL es requerida.' });
    }

    try {
      // 1. Obtener los metadatos del video usando la API pública tikwm
      // tikwm es una API ampliamente usada que permite la extracción gratuita de TikToks sin marca de agua
      const apiRes = await fetch('https://tikwm.com/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: new URLSearchParams({ url: url, count: '12', cursor: '0', web: '1', hd: '1' })
      });
      
      const textData = await apiRes.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error('Tikwm no devolvió JSON. Respuesta:', textData.substring(0, 200));
        return res.status(500).json({ error: 'Servidor de TikTok inalcanzable temporalmente. Intenta en un momento.' });
      }

      if (data.code !== 0 || !data.data || !data.data.play) {
        return res.status(400).json({ error: 'No se pudo extraer el video. Verifica que la URL sea pública y válida.' });
      }

      let targetUrl = data.data.play;
      let filename = 'tiktok-video.mp4';
      let contentType = 'video/mp4';

      if (format === 'hd' && data.data.hdplay) {
        targetUrl = data.data.hdplay;
      } else if (format === 'mp3' && data.data.music) {
        targetUrl = data.data.music;
        filename = 'tiktok-audio.mp3';
        contentType = 'audio/mpeg';
      }
      
      // La API a veces devuelve URLs relativas. Aseguramos que sea una URL absoluta.
      if (targetUrl.startsWith('/')) {
        targetUrl = `https://tikwm.com${targetUrl}`;
      }

      // 2. Obtener el stream del archivo original
      // Aumentamos el timeout y agregamos User-Agent para evitar rechazos por parte de los servidores CDN
      const videoRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://www.tiktok.com/'
        }
      });
      
      if (!videoRes.ok) {
        throw new Error(`Error al descargar el archivo desde los servidores. Status: ${videoRes.status}`);
      }

      // Configuramos los headers para forzar la descarga en el navegador
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      
      // 3. Convertir Web Stream a Node Stream y enviarlo al cliente
      if (videoRes.body) {
        try {
          const { Readable } = await import('stream');
          const readable = Readable.fromWeb(videoRes.body as import('stream/web').ReadableStream);
          readable.pipe(res);
        } catch (err: any) {
          console.error('Error procesando el stream de datos:', err);
          throw new Error('No se pudo establecer el flujo de descarga.');
        }
      } else {
        throw new Error('El servidor de origen no devolvió contenido.');
      }

    } catch (error: any) {
      console.error('Error en /api/download:', error);
      // Enviar el error específico al frontend en lugar de un error genérico
      res.status(500).json({ error: error.message || 'Error interno del servidor al procesar el video.' });
    }
  });

  // Vite middleware para desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
  });
}

startServer();
