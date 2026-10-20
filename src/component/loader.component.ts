import type UniformNode from 'three/src/nodes/core/UniformNode.js';
import { cameraViewMatrix, div, float, positionLocal, smoothstep, sub, time, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { hexToRgb } from '../helper.ts';

export interface LoaderOptions {
  overlayFadeDuration?: number; // milliseconds
  progressBarHeight?: number; // world units
  onLoadingComplete?: () => void;
}

export class LoaderComponent {
  private onCompleteCallback?: () => void;
  private fadeStartTimeUniform: UniformNode<'float', number>;
  private fadeDurationUniform: UniformNode<'float', number>;
  private progressScaleUniform: UniformNode<'float', number>;

  constructor(options?: LoaderOptions) {
    this.onCompleteCallback = options?.onLoadingComplete;

    // Create uniforms for GPU-driven animations with explicit float type
    this.fadeStartTimeUniform = uniform(-1.0, 'float'); // -1 means not started
    this.fadeDurationUniform = uniform((options?.overlayFadeDuration ?? 500) / 1000, 'float');
    this.progressScaleUniform = uniform(0.0, 'float');
  }

  getOverlay(overlayColor: string | number, fadeDurationMs: number = 500): THREE.Mesh {
    const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const overlayMaterial = new THREE.MeshBasicNodeMaterial({
      color: 0xff_00_00,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      depthWrite: false,
    });
    const colors = hexToRgb(overlayColor);
    overlayMaterial.colorNode = vec3(colors[0], colors[1], colors[2]);
    overlayMaterial.positionNode = positionLocal.mul(cameraViewMatrix);

    // Update fade duration uniform if provided
    this.fadeDurationUniform.value = fadeDurationMs / 1000;

    // GPU-driven fade: opacity = 1 - smoothstep(0, 1, (time - fadeStartTime) / fadeDuration)
    const elapsed = sub(time, this.fadeStartTimeUniform);
    const progress = smoothstep(float(0), float(1), div(elapsed, this.fadeDurationUniform));
    overlayMaterial.opacityNode = sub(float(1), progress);

    const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
    overlay.renderOrder = 1;
    overlay.userData['fadeStartTimeUniform'] = this.fadeStartTimeUniform;
    overlay.userData['fadeDurationUniform'] = this.fadeDurationUniform;
    overlay.userData['onFadeComplete'] = this.onCompleteCallback;

    return overlay;
  }

  getProgressBar(barColor: string | number, height: number = 0.01): THREE.Mesh {
    // Create a 1x1 plane (local coordinates 0 to 1 in X), easier to reason about
    const progressGeometry = new THREE.PlaneGeometry(1, height, 1, 1);
    const progressMaterial = new THREE.MeshBasicNodeMaterial({
      color: 0xff_00_00,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const colors2 = hexToRgb(barColor);
    progressMaterial.colorNode = vec3(colors2[0], colors2[1], colors2[2]);

    // Position at bottom of screen in camera-relative coordinates
    // Y = -1 + height/2 (bottom edge), Z = 0 (in front of everything)
    // X position: scale positionLocal.x (0 to 1) by progressScale (0 to 1)
    // This grows the bar from left (X=0) to right (X=1) as progressScale increases
    const yOffset = float(-1).add(float(height / 2));
    const scaleX = this.progressScaleUniform;
    progressMaterial.positionNode = vec3(positionLocal.x.mul(scaleX), yOffset, float(0)).mul(
      cameraViewMatrix,
    );

    const progress = new THREE.Mesh(progressGeometry, progressMaterial);
    progress.renderOrder = 1;
    progress.userData['progressScaleUniform'] = this.progressScaleUniform;

    return progress;
  }

  startFade(): void {
    this.fadeStartTimeUniform.value = performance.now() / 1000;
  }

  setProgress(value: number): void {
    this.progressScaleUniform.value = Math.max(0, Math.min(1, value));
  }

  getFadeStartTimeUniform(): UniformNode<'float', number> {
    return this.fadeStartTimeUniform;
  }

  getFadeDurationUniform(): UniformNode<'float', number> {
    return this.fadeDurationUniform;
  }
}
