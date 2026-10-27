import { attribute, bool, float } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { cm, hexToRgb } from '../helper';
import { Store } from '../provider/store';
import { type ShaderName } from '../shader';
import { ring } from '../shader/ringShader';

type ArrowEndpoints = {
  fromRank: number;
  fromFile: number;
  toRank: number;
  toFile: number;
};

export class ShapesService {
  private meshes: Map<ShaderName, THREE.InstancedMesh> = new Map();
  private materials: Map<ShaderName, THREE.MeshBasicNodeMaterial> = new Map();
  private attributes: Map<
    ShaderName,
    {
      colors: THREE.InstancedBufferAttribute;
      visible: THREE.InstancedBufferAttribute;
    }
  > = new Map();
  private readonly instanceCount = 64;

  private readonly arrowsGroup = new THREE.Group();
  private readonly arrows: Map<string, THREE.Mesh> = new Map();
  private readonly arrowMaterials: Map<string, THREE.MeshBasicMaterial> = new Map();
  private previewArrow: THREE.Mesh | null = null;
  // Coplanar transparent arrows need an explicit painter order: depth sorting cannot
  // distinguish them, and their draw order would otherwise depend on the camera.
  private nextArrowRenderOrder = 1;
  private readonly previewArrowRenderOrder = 1_000_000;

  // Arrows lie on the board plane, just above the rings, without z-fighting.
  private readonly arrowY = 0.00007;
  private readonly arrowShaftHalfWidth = cm(0.13);
  private readonly arrowHeadHalfWidth = cm(0.33);
  private readonly arrowHeadLength = cm(0.42);

  constructor(shaderNames: ShaderName[] = ['ring']) {
    this.arrowsGroup.name = '↗ Arrows';

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

    const instanceColor = attribute('instanceColor', 'vec3');
    const instanceVisible = attribute('instanceVisible', 'float');

    const hidden = float(instanceVisible).equal(0.0);

    shaderMaterial.colorNode = ring({
      hidden: bool(hidden),
      color: instanceColor,
    });

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
      const file = i % 8;

      matrix.makeTranslation(this.squareX(rank), yPos, this.squareZ(file));
      matrix.multiply(rotMatrix);
      matrix.multiply(scaleMatrix);

      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  // A square's rank is its X coordinate; its file is mirrored on Z to match the board.
  private squareX(rank: number): number {
    return cm(rank - 3.5);
  }

  private squareZ(file: number): number {
    return cm(3.5 - file);
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

  setShapeAt(
    rank: number,
    file: number,
    colorHex: string,
    show = true,
    shaderName: ShaderName = 'ring',
  ): void {
    const index = rank * 8 + file;
    this.setShape(index, colorHex, show, shaderName);
  }

  getArrowsGroup(): THREE.Group {
    return this.arrowsGroup;
  }

  addArrow(fromRank: number, fromFile: number, toRank: number, toFile: number, colorHex: string): void {
    if (fromRank === toRank && fromFile === toFile) {
      return;
    }

    const key = this.arrowKey({ fromRank, fromFile, toRank, toFile });
    const color = colorHex.toLowerCase();
    const existing = this.arrows.get(key);

    if (existing) {
      this.removeArrowMesh(existing);
      this.arrows.delete(key);

      // Same arrow and same color: the gesture toggles it off, like a ring.
      if (existing.userData['color'] === color) {
        return;
      }
    }

    const mesh = this.createArrowMesh({ fromRank, fromFile, toRank, toFile }, color);
    // Newer arrows consistently paint over older ones, whatever the camera angle.
    mesh.renderOrder = this.nextArrowRenderOrder++;
    mesh.userData['color'] = color;
    this.arrows.set(key, mesh);
    this.arrowsGroup.add(mesh);
  }

  setArrowPreview(
    fromRank: number,
    fromFile: number,
    toRank: number,
    toFile: number,
    colorHex: string,
  ): void {
    this.clearArrowPreview();

    if (fromRank === toRank && fromFile === toFile) {
      return;
    }

    this.previewArrow = this.createArrowMesh({ fromRank, fromFile, toRank, toFile }, colorHex.toLowerCase());
    // The in-progress arrow is always the topmost overlay.
    this.previewArrow.renderOrder = this.previewArrowRenderOrder;
    this.arrowsGroup.add(this.previewArrow);
  }

  clearArrowPreview(): void {
    if (!this.previewArrow) {
      return;
    }

    this.removeArrowMesh(this.previewArrow);
    this.previewArrow = null;
  }

  clearArrows(): void {
    this.clearArrowPreview();

    for (const mesh of this.arrows.values()) {
      this.removeArrowMesh(mesh);
    }

    this.arrows.clear();
    this.nextArrowRenderOrder = 1;
  }

  private arrowKey({ fromRank, fromFile, toRank, toFile }: ArrowEndpoints): string {
    return `${fromRank}:${fromFile}>${toRank}:${toFile}`;
  }

  private createArrowMesh(endpoints: ArrowEndpoints, colorHex: string): THREE.Mesh {
    const { fromRank, fromFile, toRank, toFile } = endpoints;

    const fromX = this.squareX(fromRank);
    const fromZ = this.squareZ(fromFile);
    const toX = this.squareX(toRank);
    const toZ = this.squareZ(toFile);

    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const length = Math.hypot(dx, dz);
    const dirX = dx / length;
    const dirZ = dz / length;
    // Perpendicular in the board plane.
    const perpX = -dirZ;
    const perpZ = dirX;

    const headBaseX = toX - dirX * this.arrowHeadLength;
    const headBaseZ = toZ - dirZ * this.arrowHeadLength;

    const shaftHalf = this.arrowShaftHalfWidth;
    const headHalf = this.arrowHeadHalfWidth;
    const y = this.arrowY;

    // Shaft quad + head triangle, kept as explicit triangles so the barbed polygon is never
    // triangulated incorrectly.
    const positions = new Float32Array([
      fromX + perpX * shaftHalf,
      y,
      fromZ + perpZ * shaftHalf,
      headBaseX + perpX * shaftHalf,
      y,
      headBaseZ + perpZ * shaftHalf,
      headBaseX - perpX * shaftHalf,
      y,
      headBaseZ - perpZ * shaftHalf,

      fromX + perpX * shaftHalf,
      y,
      fromZ + perpZ * shaftHalf,
      headBaseX - perpX * shaftHalf,
      y,
      headBaseZ - perpZ * shaftHalf,
      fromX - perpX * shaftHalf,
      y,
      fromZ - perpZ * shaftHalf,

      headBaseX + perpX * headHalf,
      y,
      headBaseZ + perpZ * headHalf,
      toX,
      y,
      toZ,
      headBaseX - perpX * headHalf,
      y,
      headBaseZ - perpZ * headHalf,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    return new THREE.Mesh(geometry, this.getArrowMaterial(colorHex));
  }

  private getArrowMaterial(colorHex: string): THREE.MeshBasicMaterial {
    let material = this.arrowMaterials.get(colorHex);

    if (!material) {
      material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this.arrowMaterials.set(colorHex, material);
    }

    return material;
  }

  private removeArrowMesh(mesh: THREE.Mesh): void {
    mesh.removeFromParent();
    mesh.geometry.dispose();
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
      this.clearArrows();
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

    this.clearArrows();
    for (const [, material] of this.arrowMaterials) {
      material.dispose();
    }

    this.meshes.clear();
    this.materials.clear();
    this.attributes.clear();
    this.arrowMaterials.clear();
    this.arrowsGroup.clear();
  }
}
