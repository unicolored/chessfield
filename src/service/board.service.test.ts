import type * as THREE from 'three/webgpu';
import { describe, expect, it } from 'vitest';

import { BoardService } from './board.service.ts';

describe('BoardService.createCases', () => {
  it('creates 64 invisible hit-boxes sharing one geometry and material', () => {
    const cases = new BoardService().createCases(null);
    const meshes = cases.children as THREE.Mesh[];

    expect(meshes).toHaveLength(64);
    // Raycast-only squares must not add draw calls: one shared geometry/material, hidden.
    expect(new Set(meshes.map(mesh => mesh.geometry)).size).toBe(1);
    expect(new Set(meshes.map(mesh => mesh.material)).size).toBe(1);
    expect(meshes.every(mesh => mesh.visible === false)).toBe(true);
  });

  it('stores the square on the mesh so raycasts resolve it directly', () => {
    const cases = new BoardService().createCases(null);
    const e4 = cases.children.find(mesh => mesh.userData['square'] === 'e4');

    expect(e4?.name).toBe('e4');
    expect(e4?.position.y).toBeCloseTo(0.0001);
  });
});
