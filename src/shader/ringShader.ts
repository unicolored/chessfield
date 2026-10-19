import { bool, Discard, EPSILON, float, Fn, If, uv, vec2, vec3 } from 'three/tsl';

export const ring = Fn(
  (args: {
    coordinates?: ReturnType<typeof vec2>;
    radius?: ReturnType<typeof float>;
    thickness?: ReturnType<typeof float>;
    center?: ReturnType<typeof vec2>;
    color?: ReturnType<typeof vec3>;
    hidden?: ReturnType<typeof bool>;
  }) => {
    const coordinates = args.coordinates ?? uv();
    const radius = args.radius ?? float(0.47);
    const thickness = args.thickness ?? float(0.06);
    const center = args.center ?? vec2(0.5);
    const ringColor = args.color ?? vec3(0, 1, 0);
    const hidden = args.hidden ?? bool(true);

    const distanceToCenter = coordinates.distance(center);
    const lineSDF = distanceToCenter.sub(radius);
    const line = lineSDF.abs().step(thickness.div(2)).oneMinus();
    line.lessThan(EPSILON).discard();

    If(hidden, () => {
      // line.assign(line.discard());
      Discard();
    });

    return line.mul(ringColor);
  },
  {
    coordinates: 'vec2',
    radius: 'float',
    thickness: 'float',
    center: 'vec3',
    color: 'vec3',
    hidden: 'bool',
    return: 'vec3',
  },
);
