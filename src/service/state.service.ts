import { attribute, float, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { cm } from '../helper';
import { Store } from '../provider/store';
import { type StateName } from '../shader';

export class StateService {
  private meshes: Map<StateName, THREE.InstancedMesh> = new Map();
  private materials: Map<StateName, THREE.MeshBasicNodeMaterial> = new Map();
  private attributes: Map<
    StateName,
    {
      visible: THREE.InstancedBufferAttribute;
    }
  > = new Map();
  private readonly instanceCount = 64;

  constructor(shaderNames: StateName[] = ['check']) {
    for (const name of shaderNames) {
      this.meshes.set(name, this.createState(name));
    }
  }

  public createShaderMaterial(shaderName: StateName): THREE.MeshBasicNodeMaterial {
    if (this.materials.has(shaderName)) {
      return this.materials.get(shaderName)!;
    }

    const shaderMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
    });

    // const instanceColor = attribute('instanceColor', 'vec3');
    const instanceVisible = attribute('instanceVisible', 'float');

    const shader = new THREE.Color('crimson');
    const pattern = uv().sub(0.5).length().smoothstep(0.68, 0.33);
    shaderMaterial.opacityNode = float(pattern);
    shaderMaterial.colorNode = vec4(shader, instanceVisible);

    this.materials.set(shaderName, shaderMaterial);

    return shaderMaterial;
  }

  private createState(shaderName: StateName): THREE.InstancedMesh {
    const geometry = new THREE.PlaneGeometry(Store.squareSize, Store.squareSize, 1, 1);

    const visible = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);

    geometry.setAttribute('instanceVisible', visible);

    this.attributes.set(shaderName, { visible });

    const material = this.createShaderMaterial(shaderName);

    const mesh = new THREE.InstancedMesh(geometry, material, this.instanceCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage as THREE.Usage);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;

    this.initializeTransforms(mesh);
    this.resetAll(shaderName);

    return mesh;
  }

  private initializeTransforms(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    const scaleMatrix = new THREE.Matrix4().makeScale(0.25, 0.25, 0.25);
    const rotMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    const yPos = 0.000055;

    for (let i = 0; i < this.instanceCount; i++) {
      const rank = Math.floor(i / 8);
      const file = 7 - (i % 8);

      matrix.makeTranslation(cm(rank - 3.5), yPos, cm(file - 3.5));
      matrix.multiply(rotMatrix);
      matrix.multiply(scaleMatrix);

      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private resetAll(shaderName: StateName): void {
    const attrs = this.attributes.get(shaderName)!;
    for (let i = 0; i < this.instanceCount; i++) {
      attrs.visible.setX(i, 0);
    }
    attrs.visible.needsUpdate = true;
  }

  getMesh(shaderName: StateName): THREE.InstancedMesh {
    return this.meshes.get(shaderName)!;
  }

  private setState(index: number, show = true, shaderName: StateName = 'check'): void {
    const attrs = this.attributes.get(shaderName)!;
    attrs.visible.setX(index, show ? 1 : 0);
    attrs.visible.needsUpdate = true;
    console.log('attrs', attrs);
  }

  setStateAt(rank: number, file: number, show = true, shaderName: StateName = 'check'): void {
    const index = rank * 8 + file;
    console.log('setStateAt', index);
    this.setState(index, show, shaderName);
  }

  clearState(index?: number | null, shaderName?: StateName): void {
    if (shaderName) {
      const attrs = this.attributes.get(shaderName)!;
      if (index !== undefined && index !== null) {
        attrs.visible.setX(index, 0);
      } else {
        attrs.visible.array.fill(0);
      }
      attrs.visible.needsUpdate = true;
    } else {
      for (const [, attrs] of this.attributes) {
        if (index !== undefined && index !== null) {
          attrs.visible.setX(index, 0);
        } else {
          attrs.visible.array.fill(0);
        }
        attrs.visible.needsUpdate = true;
      }
    }
  }

  clearAll(shaderNames?: StateName[]): void {
    if (shaderNames) {
      for (const name of shaderNames) {
        this.clearState(null, name);
      }
    } else {
      this.clearState(null);
    }
  }

  getVisible(index: number, shaderName: StateName): boolean {
    const attrs = this.attributes.get(shaderName)!;
    return attrs.visible.getX(index) === 1;
  }

  dispose(): void {
    for (const [, mesh] of this.meshes) {
      mesh.geometry.dispose();
    }
    for (const [, material] of this.materials) {
      material.dispose();
    }
    this.meshes.clear();
    this.materials.clear();
    this.attributes.clear();
  }
}
