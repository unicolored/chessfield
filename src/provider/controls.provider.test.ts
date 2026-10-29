import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { describe, expect, it } from 'vitest';

import { cm } from '../helper.ts';
import { DEFAULT_ZOOM_MAX_DISTANCE } from '../resource/chessfield.config.ts';

import { CAMERA_FOV } from './camera.provider.ts';
import { ControlsProvider } from './controls.provider.ts';

describe('ControlsProvider.apply', () => {
  it('applies control settings to the live OrbitControls instance', () => {
    const provider = new ControlsProvider({});
    const controls = { enabled: true, minDistance: 0, maxDistance: 0 } as unknown as OrbitControls;

    provider.apply({ controlsEnabled: false, zoomMinDistance: 10, zoomMaxDistance: 30 }, controls);

    expect(controls.enabled).toBe(false);
    expect(controls.minDistance).toBeCloseTo(cm(10));
    expect(controls.maxDistance).toBeCloseTo(cm(30));
  });
});

describe('ControlsProvider.applyZoomLimits', () => {
  it('maps the distance range to zoom factors for an orthographic camera', () => {
    const provider = new ControlsProvider({ zoomMinDistance: 10, zoomMaxDistance: 30 });

    // syncProjection() sizes the frustum from the perspective view at this distance.
    const referenceDistance = cm(DEFAULT_ZOOM_MAX_DISTANCE);
    const halfHeight = referenceDistance * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    const camera = new THREE.OrthographicCamera(-halfHeight, halfHeight, halfHeight, -halfHeight, cm(0.1), 3);
    const controls = { object: camera } as unknown as OrbitControls;

    provider.apply({ zoomMinDistance: 10, zoomMaxDistance: 30 }, controls);

    // zoom === 1 is the perspective view at referenceDistance, so the distance bounds become
    // factors around that reference.
    expect(controls.minZoom).toBeCloseTo(referenceDistance / cm(30));
    expect(controls.maxZoom).toBeCloseTo(referenceDistance / cm(10));
  });

  it('leaves perspective zoom to the distance limits', () => {
    const provider = new ControlsProvider({});
    const controls = { object: new THREE.PerspectiveCamera() } as unknown as OrbitControls;

    provider.apply({}, controls);

    expect(controls.minZoom).toBe(0);
    expect(controls.maxZoom).toBe(Infinity);
  });
});
