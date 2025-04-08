import * as THREE from 'three';

export class SceneProvider {
  getScene(backgroundColor: string | number): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    return scene;
  }
}
