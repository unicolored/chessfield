import * as THREE from 'three/webgpu';

import { cm, hexToRgb } from '../helper';
import { Store } from '../provider/store';
import { type ShaderName } from '../shader';
import { attribute, float, fwidth, smoothstep, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';

export class ShapesService {
  private meshes: Map<ShaderName, THREE.InstancedMesh> = new Map();
  private materials: Map<ShaderName, THREE.MeshBasicNodeMaterial> = new Map();
  private attributes: Map<ShaderName, { 
    colors: THREE.InstancedBufferAttribute; 
    visible: THREE.InstancedBufferAttribute 
  }> = new Map();
  private readonly instanceCount = 64;

  constructor(shaderNames: ShaderName[] = ['ring']) {
    for (const name of shaderNames) {
      this.meshes.set(name, this.createShapes(name));
    }
  }

  public createShaderMaterial(shaderName: ShaderName): THREE.MeshBasicNodeMaterial {
    if (this.materials.has(shaderName)) {
      return this.materials.get(shaderName)!;
    }

    const shaderMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
    });

    const u_outerRadius = uniform(0.5);

    const instanceColor = attribute('instanceColor', 'vec3');
    const instanceVisible = attribute('instanceVisible', 'float');

    const center = vec2(0.5);
    const dist = uv().sub(center).length();

    const delta = fwidth(dist);

    let alpha: any;

    if (shaderName === 'ring') {
      const u_ringWidth = uniform(0.06);
      const innerRadius = u_outerRadius.sub(u_ringWidth);

      const innerEdge = smoothstep(innerRadius.sub(delta), innerRadius.add(delta), dist);
      const outerEdge = float(1.0).sub(smoothstep(u_outerRadius.sub(delta), u_outerRadius.add(delta), dist));

      const mask = innerEdge.mul(outerEdge);
      mask.lessThan(0.01).discard();

      alpha = mask.mul(instanceVisible);
    } else if (shaderName === 'check') {
      const gradient = float(1.0).sub(smoothstep(float(0.0), u_outerRadius.add(delta), dist));
      gradient.lessThan(0.01).discard();
      alpha = gradient.mul(instanceVisible);
    } else {
      alpha = instanceVisible;
    }

    const ring = vec3(instanceColor);
    shaderMaterial.colorNode = vec4(ring, alpha);

    this.materials.set(shaderName, shaderMaterial);

    return shaderMaterial;
  }

  private createShapes(shaderName: ShaderName): THREE.InstancedMesh {
    const geometry = new THREE.PlaneGeometry(Store.squareSize, Store.squareSize, 1, 1);

    const colors = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
    const visible = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);

    geometry.setAttribute('instanceColor', colors);
    geometry.setAttribute('instanceVisible', visible);

    this.attributes.set(shaderName, { colors, visible });

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

  private resetAll(shaderName: ShaderName): void {
    const attrs = this.attributes.get(shaderName)!;
    for (let i = 0; i < this.instanceCount; i++) {
      attrs.colors.setXYZ(i, 0, 0, 0);
      attrs.visible.setX(i, 0);
    }
    attrs.colors.needsUpdate = true;
    attrs.visible.needsUpdate = true;
  }

  getMesh(shaderName: ShaderName): THREE.InstancedMesh {
    return this.meshes.get(shaderName)!;
  }

  private setShape(index: number, colorHex: string, show = true, shaderName: ShaderName = 'ring'): void {
    const attrs = this.attributes.get(shaderName)!;
    const [r, g, b] = hexToRgb(colorHex);
    attrs.colors.setXYZ(index, r, g, b);
    attrs.visible.setX(index, show ? 1 : 0);
    attrs.colors.needsUpdate = true;
    attrs.visible.needsUpdate = true;
  }

  setShapeAt(rank: number, file: number, colorHex: string, show = true, shaderName: ShaderName = 'ring'): void {
    const index = rank * 8 + file;
    this.setShape(index, colorHex, show, shaderName);
  }

  clearShape(index?: number | null, shaderName?: ShaderName): void {
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

  clearAll(shaderNames?: ShaderName[]): void {
    if (shaderNames) {
      for (const name of shaderNames) {
        this.clearShape(null, name);
      }
    } else {
      this.clearShape(null);
    }
  }

  getVisible(index: number, shaderName: ShaderName): boolean {
    const attrs = this.attributes.get(shaderName)!;
    return attrs.visible.getX(index) === 1;
  }

  getColor(index: number, shaderName: ShaderName): string {
    const attrs = this.attributes.get(shaderName)!;
    const r = attrs.colors.getX(index);
    const g = attrs.colors.getY(index);
    const b = attrs.colors.getZ(index);
    const toHex = (c: number) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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