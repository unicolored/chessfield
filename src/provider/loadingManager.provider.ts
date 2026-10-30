import { type Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three/webgpu';

import helvetikerFont from '../assets/fonts/helvetiker_regular.typeface.json?url';
import bakedBlackTexture from '../assets/models/dark-pieces.jpg?url';
import bakedTexture from '../assets/models/light-pieces.jpg?url';
import { type ChessfieldConfig } from '../resource/chessfield.config.ts';

import { type GameProvider } from './game.provider.ts';

export type LoadingProgressListener = (loaded: number, total: number) => void;

export class LoadingManagerProvider {
  private readonly loadingManager = new THREE.LoadingManager();
  private readonly textureLoader: THREE.TextureLoader;
  private loadPromise: Promise<void> | null = null;
  font: Font | null = null;

  constructor(
    private readonly config: ChessfieldConfig,
    private readonly gameProvider: GameProvider,
  ) {
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
  }

  /**
   * Load every asset the scene needs. The promise resolves once all loads have
   * settled, so one failed asset cannot block the board or the loading overlay.
   */
  load(onProgress?: LoadingProgressListener): Promise<void> {
    this.loadPromise ??= this.loadAssets(onProgress);

    return this.loadPromise;
  }

  private async loadAssets(onProgress?: LoadingProgressListener): Promise<void> {
    const loads: Promise<void>[] = [
      /**
       * 1. PIECES glb
       */
      this.gameProvider.loadGlbGeometry(this.loadingManager),

      /**
       * 2. TEXTURES baked
       */
      this.loadTexture(bakedTexture, 'light pieces texture', texture => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        this.gameProvider.pieceMaterials.white = new THREE.MeshBasicNodeMaterial({ map: texture });
      }),
      this.loadTexture(bakedBlackTexture, 'dark pieces texture', texture => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        this.gameProvider.pieceMaterials.black = new THREE.MeshBasicNodeMaterial({
          // color: Store.themes['bw'].dark,
          map: texture,
        });
      }),
    ];

    /**
     * 3. FONT (only needed for coordinates on squares)
     */
    if (this.config.coordinatesOnSquares) {
      loads.push(this.loadFont());
    }

    const total = loads.length;
    let loaded = 0;

    onProgress?.(0, total);

    await Promise.allSettled(
      loads.map(load =>
        load.finally(() => {
          loaded++;
          onProgress?.(loaded, total);
        }),
      ),
    );
  }

  private loadTexture(url: string, label: string, apply: (texture: THREE.Texture) => void): Promise<void> {
    return new Promise<void>(resolve => {
      this.textureLoader.load(
        url,
        texture => {
          try {
            apply(texture);
          } catch (error) {
            console.error(`Failed to prepare ${label}`, error);
          }
          resolve();
        },
        undefined,
        (error: unknown) => {
          console.error(`Failed to load ${label}`, error);
          resolve();
        },
      );
    });
  }

  private loadFont(): Promise<void> {
    return new Promise<void>(resolve => {
      new FontLoader(this.loadingManager).load(
        helvetikerFont,
        (font: Font) => {
          this.font = font;
          resolve();
        },
        undefined,
        (error: unknown) => {
          console.error('Failed to load coordinates font', error);
          resolve();
        },
      );
    });
  }

  getLoadingManager(): THREE.LoadingManager {
    return this.loadingManager;
  }
}
