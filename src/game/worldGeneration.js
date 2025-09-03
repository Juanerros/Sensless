import Matter from "matter-js";
import { addToWorld, createBox, getObjectPool, removeFromWorld } from './physics.js';
import { gameState } from './state.js';
import { createQuimic } from "./quimic.js";

// Configuración del sistema de chunks
const CHUNK_SIZE = 1000; // Tamaño de cada chunk en píxeles
const RENDER_DISTANCE = 1; // Chunks a cargar alrededor del jugador
const TERRAIN_HEIGHT_VARIATION = 250;
const BASE_TERRAIN_HEIGHT = 700;
const UNDERGROUND_LAYERS = 9; // Número de capas de tierra debajo del terreno
const LAYER_HEIGHT = 50; // Altura de cada capa subterránea

// Almacenamiento de chunks generados
let loadedChunks = new Map();
let lastPlayerChunk = null;

// Generador de ruido simple (Perlin-like)
class OptimizedNoise {
    constructor(seed = 12345, tableSize = 1024) {
        this.seed = seed;
        this.tableSize = tableSize;
        this.noiseCache = new Map();
        this.sinTable = new Float32Array(tableSize);

        // Pre-calcular tabla de senos
        for (let i = 0; i < tableSize; i++) {
            this.sinTable[i] = Math.sin((i / tableSize) * Math.PI * 2);
        }
    }

    noise(x, frequency = 0.01, amplitude = 1) {
        const cacheKey = `${x}_${frequency}_${amplitude}`;
        if (this.noiseCache.has(cacheKey)) {
            return this.noiseCache.get(cacheKey);
        }

        const index = Math.floor(((x * frequency + this.seed) % (Math.PI * 2)) / (Math.PI * 2) * this.tableSize);
        const value = this.sinTable[index] * amplitude;
        const result = (value + 1) / 2;

        // Limitar cache a 1000 entradas
        if (this.noiseCache.size < 1000) {
            this.noiseCache.set(cacheKey, result);
        }

        return result;
    }

    octaveNoise(x, octaves = 4) {
        const cacheKey = `octave_${x}_${octaves}`;
        if (this.noiseCache.has(cacheKey)) {
            return this.noiseCache.get(cacheKey);
        }

        let value = 0;
        let amplitude = 1;
        let frequency = 0.005;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.noise(x, frequency, amplitude);
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        const result = value / maxValue;

        if (this.noiseCache.size < 1000) {
            this.noiseCache.set(cacheKey, result);
        }

        return result;
    }

    clearCache() {
        this.noiseCache.clear();
    }
}

const randomSeed = Math.floor(Math.random() * 10000) + 1;
const noiseGenerator = new OptimizedNoise(randomSeed);

// Estructura de un chunk
class Chunk {
    constructor(chunkX) {
        this.chunkX = chunkX;
        this.worldX = chunkX * CHUNK_SIZE;
        this.bodies = [];
        this.generated = false;
    }

    generate() {
        if (this.generated) return;

        this.generateTerrain();
        this.generateElements();
        this.generated = true;
    }

    generateTerrain() {
        const segments = 8; // Número de segmentos de terreno por chunk
        const segmentWidth = CHUNK_SIZE / segments;

        for (let i = 0; i < segments; i++) {
            const x = this.worldX + (i * segmentWidth) + (segmentWidth / 2);
            const noiseValue = noiseGenerator.octaveNoise(x);
            const surfaceHeight = BASE_TERRAIN_HEIGHT + (noiseValue * TERRAIN_HEIGHT_VARIATION);

            // Crear segmento de terreno superficial
            const surfaceY = surfaceHeight + 40;
            const surfaceSegment = Matter.Bodies.rectangle(x, surfaceY, segmentWidth, 80, {
                isStatic: true,
                friction: 0.8,
                restitution: 0.1
            });

            surfaceSegment.width = segmentWidth;
            surfaceSegment.height = 80;
            surfaceSegment.label = "terrain";
            surfaceSegment.chunkX = this.chunkX;
            surfaceSegment.layer = 0;

            addToWorld(surfaceSegment);
            this.bodies.push(surfaceSegment);

            // Crear capas subterráneas
            for (let layer = 1; layer <= UNDERGROUND_LAYERS; layer++) {
                const undergroundY = surfaceY + (layer * LAYER_HEIGHT);
                const undergroundSegment = Matter.Bodies.rectangle(x, undergroundY, segmentWidth, LAYER_HEIGHT, {
                    isStatic: true,
                    friction: 0.9,
                    restitution: 0.05
                });

                undergroundSegment.width = segmentWidth;
                undergroundSegment.height = LAYER_HEIGHT;
                undergroundSegment.label = "terrain";
                undergroundSegment.chunkX = this.chunkX;
                undergroundSegment.layer = layer;

                addToWorld(undergroundSegment);
                this.bodies.push(undergroundSegment);
            }
        }
    }

    generateElements() {
        // Generar elementos aleatorios en el chunk
        const elementCount = Math.floor(Math.random() * 3) + 1; // 2-6 elementos por chunk

        for (let i = 0; i < elementCount; i++) {
            const x = this.worldX + Math.random() * CHUNK_SIZE;
            const terrainHeight = this.getTerrainHeightAt(x);
            const y = terrainHeight - 100; // Colocar encima del terreno

            // Tipos de elementos disponibles
            const elementTypes = ['box', 'hidrogeno', 'oxigeno'];
            const elementType = elementTypes[Math.floor(Math.random() * elementTypes.length)];

            if (elementType === 'box') {
                createBox(x, y);
            } else {
                createQuimic(x, y, elementType);
            }
        }
    }

    getTerrainHeightAt(x) {
        const noiseValue = noiseGenerator.octaveNoise(x);
        return BASE_TERRAIN_HEIGHT + (noiseValue * TERRAIN_HEIGHT_VARIATION);
    }

    unload() {
        // Usar object pooling al descargar
        const pool = getObjectPool();

        this.bodies.forEach(body => {
            removeFromWorld(body);

            // Devolver al pool según el tipo
            if (body.label === 'terrain') {
                pool.returnTerrainBody(body);
            } else {
                pool.returnElementBody(body);
            }
        });

        this.bodies.length = 0; // Más eficiente que = []
        this.generated = false;
    }

    generateTerrain() {
        const segments = 20;
        const segmentWidth = CHUNK_SIZE / segments;
        const pool = getObjectPool();

        for (let i = 0; i < segments; i++) {
            const x = this.worldX + (i * segmentWidth) + (segmentWidth / 2);
            const noiseValue = noiseGenerator.octaveNoise(x);
            const surfaceHeight = BASE_TERRAIN_HEIGHT + (noiseValue * TERRAIN_HEIGHT_VARIATION);

            // Usar object pooling
            const surfaceY = surfaceHeight + 40;
            const surfaceSegment = pool.getTerrainBody(x, surfaceY, segmentWidth, 50, {
                friction: 0.8,
                restitution: 0.1
            });

            surfaceSegment.label = "terrain";
            surfaceSegment.chunkX = this.chunkX;
            surfaceSegment.layer = 0;

            addToWorld(surfaceSegment);
            this.bodies.push(surfaceSegment);

            // Crear capas subterráneas con pooling
            for (let layer = 1; layer <= UNDERGROUND_LAYERS; layer++) {
                const undergroundY = surfaceY + (layer * LAYER_HEIGHT);
                const undergroundSegment = pool.getTerrainBody(x, undergroundY, segmentWidth, LAYER_HEIGHT, {
                    friction: 0.9,
                    restitution: 0.05
                });

                undergroundSegment.label = "terrain";
                undergroundSegment.chunkX = this.chunkX;
                undergroundSegment.layer = layer;

                addToWorld(undergroundSegment);
                this.bodies.push(undergroundSegment);
            }
        }
    }
}

// Funciones principales del sistema
export function initializeWorldGeneration() {
    // Limpiar el mundo actual (remover el suelo estático original)
    const currentBodies = gameState.world.bodies.slice();
    currentBodies.forEach(body => {
        if (body.label === 'ground') {
            removeFromWorld(body);
        }
    });
}

export function updateWorldGeneration(playerX) {
    const currentChunk = Math.floor(playerX / CHUNK_SIZE);

    // Solo actualizar si el jugador cambió de chunk
    if (currentChunk === lastPlayerChunk) return;

    lastPlayerChunk = currentChunk;

    // Cargar chunks necesarios
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
        const chunkX = currentChunk + dx;

        if (!loadedChunks.has(chunkX)) {
            const chunk = new Chunk(chunkX);
            chunk.generate();
            loadedChunks.set(chunkX, chunk);
        }
    }

    // Descargar chunks lejanos
    const chunksToUnload = [];
    loadedChunks.forEach((chunk, chunkX) => {
        const distance = Math.abs(chunkX - currentChunk);
        if (distance > RENDER_DISTANCE + 1) {
            chunksToUnload.push(chunkX);
        }
    });

    chunksToUnload.forEach(chunkX => {
        const chunk = loadedChunks.get(chunkX);
        chunk.unload();
        loadedChunks.delete(chunkX);
    });
}

export function getLoadedChunks() {
    return loadedChunks;
}

export function getTerrainHeightAt(x) {
    const noiseValue = noiseGenerator.octaveNoise(x);
    return BASE_TERRAIN_HEIGHT + (noiseValue * TERRAIN_HEIGHT_VARIATION);
}