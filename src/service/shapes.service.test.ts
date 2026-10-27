import * as THREE from 'three/webgpu';
import { describe, expect, it } from 'vitest';

import { cm } from '../helper';

import { ShapesService } from './shapes.service';

function arrowMeshes(service: ShapesService): THREE.Mesh[] {
  return service.getArrowsGroup().children as THREE.Mesh[];
}

describe('ShapesService arrows', () => {
  it('draws an arrow between the two square centers in the board plane', () => {
    const service = new ShapesService(['ring']);

    // e2 -> e4: same file (X), ranks 2 and 4 (Z).
    service.addArrow(4, 1, 4, 3, '#73a45d');

    const [arrow] = arrowMeshes(service);
    expect(arrow).toBeInstanceOf(THREE.Mesh);

    const geometry = arrow.geometry as THREE.BufferGeometry;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;

    const centerX = cm(4 - 3.5);
    const startZ = cm(3.5 - 1);
    const endZ = cm(3.5 - 3);

    expect(box.min.x).toBeCloseTo(centerX - cm(0.33));
    expect(box.max.x).toBeCloseTo(centerX + cm(0.33));
    expect(box.min.y).toBeCloseTo(0.00007);
    expect(box.max.y).toBeCloseTo(0.00007);
    expect(box.min.z).toBeCloseTo(endZ);
    expect(box.max.z).toBeCloseTo(startZ);

    // The arrow tip lands exactly on the target ring's center.
    const ringMatrix = new THREE.Matrix4();
    service.getMesh('ring').getMatrixAt(4 * 8 + 3, ringMatrix);
    const ringCenter = new THREE.Vector3().setFromMatrixPosition(ringMatrix);
    const positions = geometry.getAttribute('position');

    expect(positions.getX(7)).toBeCloseTo(ringCenter.x);
    expect(positions.getZ(7)).toBeCloseTo(ringCenter.z);
  });

  it('gives overlapping arrows a stable painter order', () => {
    const service = new ShapesService(['ring']);

    service.addArrow(0, 0, 7, 7, '#73a45d');
    service.addArrow(0, 7, 7, 0, '#66799f');

    const [first, second] = arrowMeshes(service);
    expect(first.renderOrder).toBeLessThan(second.renderOrder);

    service.setArrowPreview(0, 0, 0, 7, '#73a45d');
    const preview = arrowMeshes(service)[2];
    expect(preview.renderOrder).toBeGreaterThan(second.renderOrder);
  });

  it('toggles an identical arrow off', () => {
    const service = new ShapesService(['ring']);

    service.addArrow(4, 1, 4, 3, '#73a45d');
    expect(arrowMeshes(service)).toHaveLength(1);

    service.addArrow(4, 1, 4, 3, '#73a45d');
    expect(arrowMeshes(service)).toHaveLength(0);
  });

  it('replaces an existing arrow drawn with another color', () => {
    const service = new ShapesService(['ring']);

    service.addArrow(4, 1, 4, 3, '#73a45d');
    service.addArrow(4, 1, 4, 3, '#66799f');

    const [arrow] = arrowMeshes(service);
    const material = arrow.material as THREE.MeshBasicMaterial;
    expect(material.color.getHexString()).toBe('66799f');
  });

  it('replaces the live preview instead of stacking previews', () => {
    const service = new ShapesService(['ring']);

    service.addArrow(4, 1, 4, 3, '#73a45d');
    service.setArrowPreview(0, 0, 7, 7, '#73a45d');
    expect(arrowMeshes(service)).toHaveLength(2);

    service.setArrowPreview(0, 0, 4, 4, '#73a45d');
    expect(arrowMeshes(service)).toHaveLength(2);

    service.clearArrowPreview();
    expect(arrowMeshes(service)).toHaveLength(1);
  });

  it('clears arrows with the rest of the shapes', () => {
    const service = new ShapesService(['ring']);

    service.addArrow(4, 1, 4, 3, '#73a45d');
    service.setArrowPreview(0, 0, 7, 7, '#73a45d');

    service.clearAll();

    expect(arrowMeshes(service)).toHaveLength(0);
  });
});
