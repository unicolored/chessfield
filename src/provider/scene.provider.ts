import { Color, Scene } from 'three';

export class SceneProvider {
  getScene(backgroundColor: string | number): Scene {
    const scene = new Scene();
    scene.background = new Color(backgroundColor);

    return scene;
  }
}
