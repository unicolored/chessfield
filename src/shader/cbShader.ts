import { color, float, floor, Fn, mix, select, uv, vec2, vec3 } from 'three/tsl';
export const cbShader = Fn(
  (args: {
    lightColor?: ReturnType<typeof vec3>;
    darkColor?: ReturnType<typeof vec3>;
    highlightColor?: ReturnType<typeof vec3>;
    posStart?: ReturnType<typeof vec2>;
    posEnd?: ReturnType<typeof vec2>;
  }) => {
    const lightColor = args.lightColor ?? color('white');
    const darkColor = args.darkColor ?? color('black');
    const highlightColor = args.highlightColor ?? color('yellow');
    const posStart = args.posStart ?? vec2(-1, -1);
    const posEnd = args.posEnd ?? vec2(-1, -1);

    // TSL Graph
    const squareSize = float(0.125);
    const coord = uv().div(squareSize);

    const chess = floor(coord.x).add(floor(coord.y)).mod(2);

    const baseMix = mix(lightColor, darkColor, chess);

    // Check Start Square
    const isStartSquare = floor(coord.x).equal(posStart.x).and(floor(coord.y).equal(posStart.y));

    // Check End Square
    const isEndSquare = floor(coord.x).equal(posEnd.x).and(floor(coord.y).equal(posEnd.y));

    // Determine if square is light or dark
    const isLightSquare = chess.equal(float(0));

    // Mix highlight with the appropriate square color
    const highlightLight = mix(lightColor, highlightColor, float(0.5));
    const highlightDark = mix(darkColor, highlightColor, float(0.5));
    const highlightMix = select(isLightSquare, highlightLight, highlightDark);

    // Chain select() calls to apply highlights
    const mixStart = select(isStartSquare, highlightMix, baseMix);

    return vec3(select(isEndSquare, highlightMix, mixStart));
  },
  {
    lightColor: 'vec3',
    darkColor: 'vec3',
    highlightColor: 'vec3',
    posStart: 'vec2',
    posEnd: 'vec2',
    return: 'vec3',
  },
);
