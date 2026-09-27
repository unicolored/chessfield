import { ringShader } from './ring.shader';

export { ringShader } from './ring.shader';

export const shaderRegistry = {
  ring: ringShader,
} as const;

export type ShaderName = keyof typeof shaderRegistry;
export type ShaderDef = (typeof shaderRegistry)[ShaderName];
