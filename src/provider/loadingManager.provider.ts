import { ChessfieldConfig } from '../resource/chessfield.config.ts';
import { GameProvider } from './game.provider.ts';
import bakedTexture from '../assets/models/light-pieces.jpg?url';
import bakedBlackTexture from '../assets/models/dark-pieces.jpg?url';
import { LoadingManager, MeshBasicMaterial, SRGBColorSpace, TextureLoader } from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import helvetikerFont from '../assets/fonts/helvetiker_regular.typeface.json?url';

export class LoadingManagerProvider {
  private readonly loadingManager = new LoadingManager();
  private textureLoader: TextureLoader;
  font: Font | null = null;

  constructor(
    private readonly config: ChessfieldConfig,
    private readonly gameProvider: GameProvider,
  ) {
    /**
     * 2. PIECES glb
     */
    // this.gameProvider.loadGltfGeometries(loadingManager);
    this.gameProvider.loadGlbGeometry(this.loadingManager);

    /**
     * 3. TEXTURES baked
     */
    this.textureLoader = new TextureLoader(this.loadingManager);

    this.loadTextures();

    this.loadFont();
  }

  loadTextures() {
    /**
     * 3. TEXTURES baked
     */

    // Load the texture and apply it to the material
    this.textureLoader.load(
      bakedTexture,
      texture => {
        texture.flipY = false;
        texture.colorSpace = SRGBColorSpace;

        this.gameProvider.pieceMaterials.white = new MeshBasicMaterial({ map: texture });
      },
      undefined,
      (e: unknown) => {
        console.error('error bakedTexture', e);
      },
    );
    this.textureLoader.load(
      bakedBlackTexture,
      texture => {
        texture.flipY = false;
        texture.colorSpace = SRGBColorSpace;

        this.gameProvider.pieceMaterials.black = new MeshBasicMaterial({
          // color: Store.themes['bw'].dark,
          map: texture,
        });
      },
      undefined,
      (e: unknown) => {
        console.error('error bakedBlackTexture', e);
      },
    );
  }

  loadFont() {
    if (this.config.coordinatesOnSquares) {
      new FontLoader(this.loadingManager).load(helvetikerFont, async (font: any) => {
        this.font = font;
      });
    }
  }

  getLoadingManager(): LoadingManager {
    return this.loadingManager;
  }
}
