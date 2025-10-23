// Worker para cargar assets (imágenes y GIFs) en un hilo separado
import { parseGIF, decompressFrames } from 'gifuct-js';

// Función para cargar una imagen normal (PNG, JPG, etc.)
async function loadStaticImage(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return await createImageBitmap(blob);
}

// Función para cargar y procesar un GIF animado
async function loadAnimatedGif(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  // Parsear el GIF usando gifuct-js
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);
  
  if (!frames || frames.length === 0) {
    throw new Error(`No se pudieron extraer frames del GIF: ${url}`);
  }
  
  // Crear un ImageBitmap para cada frame
  const bitmapFrames = [];
  const delays = [];
  
  for (const frame of frames) {
    // Crear un canvas para dibujar el frame
    const canvas = new OffscreenCanvas(frame.dims.width, frame.dims.height);
    const ctx = canvas.getContext('2d');
    
    // Crear ImageData a partir de los datos del frame
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height
    );
    
    // Dibujar el frame en el canvas
    ctx.putImageData(imageData, frame.dims.left, frame.dims.top);
    
    // Convertir a ImageBitmap
    const bitmap = await createImageBitmap(canvas);
    bitmapFrames.push(bitmap);
    
    // Guardar el delay del frame (en ms)
    delays.push(frame.delay * 10); // El delay en gifuct-js está en centésimas de segundo
  }
  
  // Devolver la información del GIF animado
  return {
    frames: bitmapFrames,
    delays: delays,
    width: gif.lsd.width,
    height: gif.lsd.height,
    totalFrames: frames.length
  };
}

// Función para escalar un bitmap a un tamaño específico
async function scaleBitmap(bitmap, width, height) {
  if (!width || !height) return bitmap;
  
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // Mantener pixelado para estética pixel art
  ctx.drawImage(bitmap, 0, 0, width, height);
  
  // Liberar el bitmap original si es diferente al resultado
  if (bitmap.width !== width || bitmap.height !== height) {
    bitmap.close();
  }
  
  return await createImageBitmap(canvas);
}

// Función para escalar todos los frames de un GIF animado
async function scaleAnimatedGif(gifData, width, height) {
  if (!width || !height) return gifData;
  
  const scaledFrames = [];
  
  for (const frame of gifData.frames) {
    const scaledFrame = await scaleBitmap(frame, width, height);
    scaledFrames.push(scaledFrame);
  }
  
  // Actualizar los frames y dimensiones
  gifData.frames = scaledFrames;
  gifData.width = width;
  gifData.height = height;
  
  return gifData;
}

// Manejador de mensajes del worker
self.onmessage = async function(e) {
  const { assets } = e.data;
  
  try {
    for (const asset of assets) {
      const { name, url, width, height, type = 'image' } = asset;
      
      try {
        // Determinar si es un GIF animado o una imagen estática
        const isGif = url.toLowerCase().endsWith('.gif');
        
        if (isGif && type !== 'static') {
          // Cargar como GIF animado
          let gifData = await loadAnimatedGif(url);
          
          // Escalar si se especificaron dimensiones
          if (width && height) {
            gifData = await scaleAnimatedGif(gifData, width, height);
          }
          
          // Enviar los datos del GIF al hilo principal
          // Usamos transferibles para los bitmaps para mejorar rendimiento
          const transferables = gifData.frames.map(frame => frame);
          self.postMessage({
            type: 'gif',
            name,
            gifData
          }, transferables);
          
        } else {
          // Cargar como imagen estática
          let bitmap = await loadStaticImage(url);
          
          // Escalar si se especificaron dimensiones
          if (width && height) {
            bitmap = await scaleBitmap(bitmap, width, height);
          }
          
          // Enviar el bitmap al hilo principal
          self.postMessage({
            type: 'image',
            name,
            bitmap
          }, [bitmap]);
        }
        
        // Notificar progreso
        self.postMessage({
          type: 'progress',
          name,
          status: 'loaded'
        });
        
      } catch (error) {
        console.error(`Error cargando asset ${name} (${url}):`, error);
        self.postMessage({
          type: 'error',
          name,
          url,
          error: error.message
        });
      }
    }
    
    // Notificar que se completó la carga de todos los assets
    self.postMessage({
      type: 'complete'
    });
    
  } catch (error) {
    console.error('Error en el worker:', error);
    self.postMessage({
      type: 'fatal_error',
      error: error.message
    });
  }
};