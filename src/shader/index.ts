// import { checkShader } from './check.shader';
// import { ringShader } from './ring.shader';
//
// export { ringShader } from './ring.shader';
// export { checkShader } from './check.shader';

import { ring } from './ringShader';

export const shaderRegistry = {
  ring: ring,
} as const;

export const stateRegistry = {
  check: ring,
} as const;

export type ShaderName = keyof typeof shaderRegistry;
export type ShaderDef = (typeof shaderRegistry)[ShaderName];

export type StateName = keyof typeof stateRegistry;
