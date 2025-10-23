// Sistema de sprites para el terreno
class TerrainSpriteManager {
    constructor() {
        this.sprites = {};
        this.loaded = false;
        this.loadPromises = [];
    }

    async loadSprites(p) {
        if (this.loaded) return;

        const spritePaths = {
            surface: 'sprites/terrenos/arboleda/terreno 1.png',
            layer1: 'sprites/terrenos/arboleda/terreno 2.png',
            layer2: 'sprites/terrenos/arboleda/terreno 3.png',
            underground: 'sprites/terrenos/arboleda/terreno inf.png'
        };

        // Cargar todos los sprites
        const loadPromises = Object.entries(spritePaths).map(([key, path]) => {
            return new Promise((resolve, reject) => {
                p.loadImage(path, 
                    (img) => {
                        this.sprites[key] = img;
                        resolve();
                    },
                    (err) => {
                        console.warn(`Error cargando sprite de terreno ${path}:`, err);
                        // Crear un sprite de fallback
                        this.sprites[key] = null;
                        resolve();
                    }
                );
            });
        });

        await Promise.all(loadPromises);
        this.loaded = true;
        console.log('Sprites de terreno cargados:', Object.keys(this.sprites));
    }

    getSpriteForLayer(layer) {
        if (!this.loaded) return null;

        switch (layer) {
            case 0: // Superficie
                return this.sprites.surface;
            case 1: // Primera capa subterránea
                return this.sprites.layer1;
            case 2: // Segunda capa subterránea
                return this.sprites.layer2;
            default: // Capas más profundas
                return this.sprites.underground;
        }
    }

    drawTerrainSprite(p, body, sprite) {
        if (!sprite) {
            // Fallback a color sólido si no hay sprite
            this.drawFallbackTerrain(p, body);
            return;
        }

        p.push();
                
        // Usar el modo CORNER para un control más preciso
        p.imageMode(p.CORNER);
        
        // Dibujar el sprite escalado en la posición correcta
        p.image(sprite, 
            body.position.x - body.width/2, 
            body.position.y - body.height/2, 
            body.width, 
            body.height
        );
        
        p.pop();
    }

    drawFallbackTerrain(p, body) {
        // Colores de fallback basados en la capa
        const baseColor = [101, 67, 33];
        if (body.layer > 0) {
            const darkenAmount = Math.min(body.layer * 15, 60);
            const r = Math.max(baseColor[0] - darkenAmount, 0);
            const g = Math.max(baseColor[1] - darkenAmount, 0);
            const b = Math.max(baseColor[2] - darkenAmount, 0);
            p.fill(r, g, b);
            p.stroke(r, g, b);
        } else {
            p.fill(101, 67, 33);
            p.stroke(101, 67, 33);
        }
        p.strokeWeight(1);
        p.rectMode(p.CENTER);
        p.rect(body.position.x, body.position.y, body.width, body.height);
    }

    isLoaded() {
        return this.loaded;
    }
}

// Instancia global del gestor de sprites
let terrainSpriteManager = null;

export function getTerrainSpriteManager() {
    if (!terrainSpriteManager) {
        terrainSpriteManager = new TerrainSpriteManager();
    }
    return terrainSpriteManager;
}

export async function initializeTerrainSprites(p) {
    const manager = getTerrainSpriteManager();
    await manager.loadSprites(p);
}