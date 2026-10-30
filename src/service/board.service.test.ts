import * as THREE from 'three/webgpu';
import { describe, expect, it } from 'vitest';

import { Store } from '../provider/store.ts';

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

describe('BoardService.decor', () => {
  const mode = Store.modes['light'];

  function decor(turn: 'white' | 'black' = 'white') {
    const service = new BoardService();
    const group = service.decor(mode, turn);

    return {
      service,
      group,
      turnSwitch: group.getObjectByName('cf-turn-switch') as THREE.Mesh,
    };
  }

  it('does not add player bars', () => {
    const { group } = decor();

    expect(group.children.some(child => child.name.startsWith('cf-player-bar'))).toBe(false);
  });

  it('creates one switch on the left of the board, centred along the side', () => {
    const { group, turnSwitch } = decor();
    const switches = group.children.filter(child => child.name === 'cf-turn-switch');

    expect(switches).toHaveLength(1);
    expect(turnSwitch.position.x).toBeLessThan(0);
    expect(turnSwitch.position.z).toBeCloseTo(0);
  });

  it('raises the white-side end when White is to move', () => {
    const { turnSwitch } = decor('white');

    // White is +Z: a negative X rotation lifts that end.
    expect(turnSwitch.rotation.x).toBeLessThan(0);
  });

  it('raises the black-side end when Black is to move', () => {
    const { service, turnSwitch } = decor('white');

    service.setTurn('black');

    expect(turnSwitch.rotation.x).toBeGreaterThan(0);
  });

  it('matches the background colour and follows mode changes', () => {
    const { service } = decor();

    expect((service as any).switchColor.getHexString(THREE.SRGBColorSpace)).toBe(
      new THREE.Color(mode.light).getHexString(THREE.SRGBColorSpace),
    );

    service.updateDecorColors(Store.modes['dark']);

    expect((service as any).switchColor.getHexString(THREE.SRGBColorSpace)).toBe(
      new THREE.Color(Store.modes['dark'].light).getHexString(THREE.SRGBColorSpace),
    );
  });
});
