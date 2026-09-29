import {
  InstancedMesh,
  PlaneGeometry,
  Matrix4,
  InstancedBufferAttribute,
  ShaderMaterial,
  DynamicDrawUsage,
  type Usage,
  DoubleSide,
  MeshBasicMaterial,
} from 'three';
import { Store } from '../provider/store';
import { cm, hexToRgb } from '../helper';
import { shaderRegistry, type ShaderName } from '../shader';

export class ShapesService {
  private shapes: InstancedMesh;
  private materials: Map<ShaderName, ShaderMaterial | MeshBasicMaterial>;
  private currentShader: ShaderName = 'ring';
  private readonly instanceCount = 64;

  private colors!: InstancedBufferAttribute;
  private visible!: InstancedBufferAttribute;

  constructor(shaderName: ShaderName = 'ring') {
    this.materials = new Map();
    this.currentShader = shaderName;
    this.shapes = this.createShapes(shaderName);
  }

  public createShaderMaterial(shaderName: ShaderName): ShaderMaterial | MeshBasicMaterial {
    if (this.materials.has(shaderName)) {
      return this.materials.get(shaderName)!;
    }

    const shaderDef = shaderRegistry[shaderName];
    const shaderMaterial = new ShaderMaterial({
      uniforms: shaderDef.uniforms,
      vertexShader: shaderDef.vertexShader,
      fragmentShader: shaderDef.fragmentShader,
      transparent: true,
      opacity: 1,
      side: DoubleSide,
      depthWrite: true,
    });

    shaderMaterial.needsUpdate = true;
    this.materials.set(shaderName, shaderMaterial);

    return shaderMaterial;
  }

  private createShapes(shaderName: ShaderName): InstancedMesh {
    const geometry = new PlaneGeometry(Store.squareSize, Store.squareSize, 1, 1);
    // geometry.scale(0.25, 0.25, 0.25);

    this.colors = new InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
    this.visible = new InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);

    geometry.setAttribute('instanceColor', this.colors);
    geometry.setAttribute('instanceVisible', this.visible);

    const material = this.createShaderMaterial(shaderName);

    const mesh = new InstancedMesh(geometry, material, this.instanceCount);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage as Usage);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;

    this.initializeTransforms(mesh);
    this.resetAll();

    return mesh;
  }

  private initializeTransforms(mesh: InstancedMesh): void {
    const matrix = new Matrix4();
    const scaleMatrix = new Matrix4().makeScale(0.25, 0.25, 0.25);
    const rotMatrix = new Matrix4().makeRotationX(Math.PI / 2);
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

  private resetAll(): void {
    for (let i = 0; i < this.instanceCount; i++) {
      this.colors.setXYZ(i, 0, 1, 0);
      this.visible.setX(i, 0);
    }
    this.colors.needsUpdate = true;
    this.visible.needsUpdate = true;
  }

  getMesh(): InstancedMesh {
    return this.shapes;
  }

  setShape(index: number, colorHex: string, show = true): void {
    const [r, g, b] = hexToRgb(colorHex);
    this.colors.setXYZ(index, r, g, b);
    console.log('setX', index);
    this.visible.setX(index, show ? 1 : 0);
    this.colors.needsUpdate = true;
    this.visible.needsUpdate = true;
  }

  setShapeAt(rank: number, file: number, colorHex: string, show = true): void {
    const index = rank * 8 + file;
    this.setShape(index, colorHex, show);
  }

  clearShape(index?: number): void {
    if (index !== undefined) {
      this.visible.setX(index, 0);
    } else {
      this.visible.array.fill(0);
    }
    this.visible.needsUpdate = true;
  }

  clearAll(): void {
    this.clearShape();
  }

  getVisible(index: number): boolean {
    return this.visible.getX(index) === 1;
  }

  setShader(shaderName: ShaderName): void {
    if (shaderName === this.currentShader) return;
    this.currentShader = shaderName;
    const material = this.createShaderMaterial(shaderName);
    this.shapes.material = material;
  }

  dispose(): void {
    this.shapes.geometry.dispose();
    this.materials.forEach(m => m.dispose());
    this.materials.clear();
  }
}
