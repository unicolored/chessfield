import { describe, expect, it } from 'vitest';

import { cm } from '../helper.ts';
import { DEFAULT_ZOOM_MAX_DISTANCE } from '../resource/chessfield.config.ts';

import { CameraProvider } from './camera.provider.ts';

const sizes = { width: 1200, height: 700 };

describe('CameraProvider default camera', () => {
  it('opens at the default maximum zoom distance', () => {
    const camera = new CameraProvider({}).getCamera(sizes);

    expect(camera.position.length()).toBeCloseTo(cm(DEFAULT_ZOOM_MAX_DISTANCE));
  });

  it('follows a configured maximum zoom distance', () => {
    const camera = new CameraProvider({ zoomMaxDistance: 40 }).getCamera(sizes);

    expect(camera.position.length()).toBeCloseTo(cm(40));
  });
});
