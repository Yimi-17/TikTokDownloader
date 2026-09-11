import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle, Video, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp4' | 'hd' | 'mp3'>('mp4');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), format })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error('Error de conexión con el servidor.');
        }
        throw new Error(errorData.error || 'No se pudo descargar el archivo.');
      }

      // Convertir la respuesta a un Blob (archivo binario) para descargar
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Crear un enlace temporal para forzar la descarga en el navegador
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = format === 'mp3' ? 'tiktok-audio.mp3' : 'tiktok-video.mp4';
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setStatus('success');
      setUrl(''); // Limpiar el input tras éxito
      
      // Volver a estado 'idle' después de 3 segundos
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Ocurrió un error inesperado.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="mx-auto bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <Video className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">TikTok Downloader</h1>
          <p className="text-neutral-500 mt-2 text-sm">
            Descarga videos sin marca de agua directamente a tu dispositivo.
          </p>
        </div>

        {/* Formulario de descarga */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <form onSubmit={handleDownload} className="space-y-5">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-neutral-700 mb-1">
                URL del Video
              </label>
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@usuario/video/123456789"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-sm"
                disabled={status === 'loading'}
              />
            </div>

            {/* Opciones de formato */}
            <AnimatePresence>
              {url.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', overflow: 'hidden' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                >
                  <div className="pt-2 pb-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Formato de Descarga
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormat('mp4')}
                        disabled={status === 'loading'}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-1 transition-colors ${
                          format === 'mp4' 
                            ? 'bg-neutral-900 text-white border-neutral-900' 
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        Video Estándar
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat('hd')}
                        disabled={status === 'loading'}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-1 transition-colors ${
                          format === 'hd' 
                            ? 'bg-neutral-900 text-white border-neutral-900' 
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        Video HD
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat('mp3')}
                        disabled={status === 'loading'}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-1 transition-colors ${
                          format === 'mp3' 
                            ? 'bg-neutral-900 text-white border-neutral-900' 
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <Music className="w-4 h-4" />
                        Solo Audio
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!url.trim() || status === 'loading'}
              className="w-full bg-black text-white rounded-xl py-3 px-4 font-medium flex items-center justify-center hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Descargar {format === 'mp3' ? 'Audio' : 'Video'}
                </>
              )}
            </button>
          </form>

          {/* Mensajes de estado */}
          <div className="mt-4 min-h-[48px]">
            <AnimatePresence mode="wait">
              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-red-50 text-red-600 rounded-xl p-3 text-sm flex items-start"
                >
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>{errorMessage}</p>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-green-50 text-green-700 rounded-xl p-3 text-sm flex items-center justify-center"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  ¡Descarga completada con éxito!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Esta herramienta es solo para uso personal. Respeta los derechos de autor de los creadores.
        </p>
      </div>
    </div>
  );
}
