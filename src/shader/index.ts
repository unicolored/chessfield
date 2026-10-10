import { ringShader } from './ring.shader';
import { checkShader } from './check.shader';

export { ringShader } from './ring.shader';
export { checkShader } from './check.shader';

export const shaderRegistry = {
  ring: ringShader,
  check: checkShader,
} as const;

export type ShaderName = keyof typeof shaderRegistry;
export type ShaderDef = (typeof shaderRegistry)[ShaderName];
