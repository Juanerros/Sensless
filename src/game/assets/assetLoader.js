// Gestor de assets que utiliza p5.loadImage para cargar imágenes y GIFs
import p5 from 'p5';

// Clase para gestionar la animación de GIFs
class GifAnimation {
  constructor(gifImage) {
    this.gifImage = gifImage;
    // Verificar que la imagen existe y tiene dimensiones válidas
    if (gifImage && typeof gifImage === 'object') {
      this.width = gifImage.width || 0;
      this.height = gifImage.height || 0;
    } else {
      this.width = 0;
      this.height = 0;
      console.warn("GifAnimation creada con una imagen inválida");
    }
    this.playing = true;
    this.p5Instance = null;
  }

  // Obtener el GIF como imagen p5
  getImage() {
    return this.gifImage;
  }

  // Dibujar el GIF en las coordenadas especificadas
  draw(p, x, y, width = this.width, height = this.height) {
    this.p5Instance = p;
    
    if (this.gifImage && typeof this.gifImage === 'object' && this.gifImage.width > 0) {
      p.push();
      p.imageMode(p.CENTER);
      p.image(this.gifImage, x, y, width, height);
      p.pop();
    }
  }

  // Obtener una copia de la animación
  get() {
    // Devolver una copia superficial, la imagen se comparte para ahorrar memoria
    return new GifAnimation(this.gifImage);
  }

  // Redimensionar la animación (solo afecta a las dimensiones de dibujo)
  resize(width, height) {
    const copy = this.get();
    copy.width = width;
    copy.height = height;
    return copy;
  }
}

// Clase principal para cargar y gestionar assets
class AssetLoader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.progressCallbacks = [];
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.isLoading = false;
    this.p5Instance = null;
  }

  // Registrar una función de callback para el progreso
  onProgress(callback) {
    if (typeof callback === 'function') {
      this.progressCallbacks.push(callback);
    }
    return this;
  }

  // Actualizar el progreso de carga
  updateProgress(name, status) {
    this.loadedAssets++;
    const progress = this.loadedAssets / this.totalAssets;
    
    this.progressCallbacks.forEach(callback => {
      callback({
        name,
        status,
        progress
      });
    });
  }

  // Cargar un conjunto de assets usando p5.loadImage
  loadAssets(assets, p5Instance) {
    if (!p5Instance) {
      console.error("Error: p5Instance es requerido para cargar assets");
      return Promise.reject(new Error("p5Instance es requerido para cargar assets"));
    }
    
    this.p5Instance = p5Instance;
    
    if (this.isLoading) {
      console.warn('Ya hay una carga de assets en progreso');
      return Promise.reject(new Error('Ya hay una carga de assets en progreso'));
    }
    
    this.isLoading = true;
    this.totalAssets = assets.length;
    this.loadedAssets = 0;
    
    // Crear promesas para cada asset
    const promises = assets.map(asset => {
      return new Promise((resolve, reject) => {
        // Verificar que el asset tiene nombre y URL
        if (!asset.name || !asset.url) {
          console.error("Asset inválido:", asset);
          this.updateProgress(asset.name || "desconocido", 'error');
          reject(new Error("Asset inválido: falta nombre o URL"));
          return;
        }
        
        // Si ya está en caché, resolver inmediatamente
        if (this.cache.has(asset.name)) {
          resolve(this.cache.get(asset.name));
          this.updateProgress(asset.name, 'cached');
          return;
        }
                
        // Cargar la imagen usando p5.loadImage
        p5Instance.loadImage(
          asset.url,
          (img) => {
            // Verificar que la imagen se cargó correctamente
            if (!img || typeof img !== 'object' || !img.width) {
              console.error(`Error: Imagen inválida para ${asset.name}`);
              this.updateProgress(asset.name, 'error');
              reject(new Error(`Imagen inválida para ${asset.name}`));
              return;
            }
                        
            // Si es un GIF animado, crear una animación
            if (asset.url.toLowerCase().endsWith('.gif') && asset.type !== 'static') {
              const animation = new GifAnimation(img);
              this.cache.set(asset.name, animation);
              resolve(animation);
            } else {
              // Si es una imagen estática, escalarla si es necesario
              if (asset.width && asset.height) {
                const copy = img.get();
                copy.resize(asset.width, asset.height);
                this.cache.set(asset.name, copy);
                resolve(copy);
              } else {
                this.cache.set(asset.name, img);
                resolve(img);
              }
            }
            this.updateProgress(asset.name, 'loaded');
          },
          (error) => {
            console.error(`Error cargando asset ${asset.name}:`, error);
            this.updateProgress(asset.name, 'error');
            reject(new Error(`Error cargando ${asset.name}: ${error}`));
          }
        );
      });
    });
    
    // Devolver una promesa que se resuelve cuando todos los assets están cargados
    return Promise.all(promises)
      .then(results => {
        this.isLoading = false;
        return results;
      })
      .catch(error => {
        this.isLoading = false;
        throw error;
      });
  }

  // Obtener un asset del caché
  getAsset(name) {
    return this.cache.get(name);
  }

  // Obtener una copia escalada de un asset
  getScaledAsset(name, width, height) {
    const asset = this.getAsset(name);
    if (!asset) return null;
    
    // Si es una animación GIF
    if (asset instanceof GifAnimation) {
      return asset.resize(width, height);
    }
    
    // Si es una imagen p5
    if (asset.resize) {
      const copy = asset.get();
      copy.resize(width, height);
      return copy;
    }
    
    return asset;
  }
}

// Singleton para acceso global
const assetLoader = new AssetLoader();
export default assetLoader;