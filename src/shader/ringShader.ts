import {
  If,
  bool,
  EPSILON,
  float,
  Fn,
  fwidth,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  Discard,
} from 'three/tsl';

export const ring = Fn(
  ({
    coordinates = uv(),
    radius = float(0.47),
    thickness = float(0.06),
    center = vec2(0.5),
    color = vec3(0, 1, 0),
    hidden = bool(true),
  }) => {
    const distanceToCenter = coordinates.distance(center);
    const lineSDF = distanceToCenter.sub(radius);
    const line = lineSDF.abs().step(thickness.div(2)).oneMinus();
    line.lessThan(EPSILON).discard();

    If(hidden, () => {
      // line.assign(line.discard());
      Discard();
    });

    return line.mul(color);
  },
);
