import * as THREE from 'three/webgpu';

import type { ControlsProvider } from '../provider/controls.provider.ts';
import type { GameProvider } from '../provider/game.provider.ts';
import type { RendererProvider } from '../provider/renderer.provider.ts';
import type { Store } from '../provider/store.ts';
import type { EventsService } from '../service/events.service.ts';
import type { ShapesService } from '../service/shapes.service.ts';
import type { StateService } from '../service/state.service.ts';

export interface DisposableResources {
  store: Store;
  shapesService: ShapesService;
  stateService: StateService;
  gameProvider: GameProvider;
  eventsService: EventsService | null;
  renderer: RendererProvider['renderer'] | null;
  controls: ControlsProvider['controls'] | null;
  canvas: HTMLCanvasElement | null;
}

export class ResourceDisposal {
  static dispose(resources: DisposableResources): void {
    const { store, shapesService, stateService, gameProvider, eventsService, renderer, controls, canvas } =
      resources;

    // Clean up moves subscription
    // Note: This is handled by the caller since it's a class property

    // Clean up pieces group from current scene
    if (store.piecesGroup && store.scene) {
      store.scene.remove(store.piecesGroup);
      store.piecesGroup.clear();
    }

    // Dispose old renderer (stops animation loop and releases WebGPU resources)
    if (renderer) {
      renderer.setAnimationLoop(null);
      if (typeof renderer.dispose === 'function') {
        renderer.dispose();
      }
    }

    // Dispose old controls
    if (controls) {
      controls.dispose();
    }

    // Clear service state (NOT dispose - services persist across configUpdates)
    // Old meshes are in the old scene which gets dereferenced and GC'd
    shapesService?.clearAll();
    stateService?.clearAll();
    gameProvider?.disposeOldMeshes?.();

    // Clean up scene - traverse and dispose remaining geometries/materials
    if (store.scene) {
      store.scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m?.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      store.scene.clear();
    }

    eventsService?.dispose();

    if (canvas && canvas.parentNode) {
      canvas.remove();
    }
  }
}
