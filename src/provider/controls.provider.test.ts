import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { describe, expect, it } from 'vitest';

import { cm } from '../helper.ts';

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
