import { color, float, floor, Fn, mix, select, uv, vec2, vec3 } from 'three/tsl';
export const cbShader = Fn(
  ({
    lightColor = color('white'),
    darkColor = color('black'),
    highlightColor = color('yellow'),
    posStart = vec2(-1, -1),
    posEnd = vec2(-1, -1),
    posCursor = vec2(-1, -1),
  }) => {
    // TSL Graph
    const squareSize = float(0.125);
    const coord = uv().div(squareSize);

    const chess = floor(coord.x).add(floor(coord.y)).mod(2);

    const baseMix = mix(lightColor, darkColor, chess);

    // Check Start Square
    const isStartSquare = floor(coord.x).equal(posStart.x).and(floor(coord.y).equal(posStart.y));

    // Check End Square
    const isEndSquare = floor(coord.x).equal(posEnd.x).and(floor(coord.y).equal(posEnd.y));

    // Check Position of Cursor
    // posCursor
    const isCursorSquare = floor(coord.x).equal(posCursor.x).and(floor(coord.y).equal(posCursor.y));

    // Determine if square is light or dark
    const isLightSquare = chess.equal(float(0));

    // Mix highlight with the appropriate square color
    const highlightLight = mix(lightColor, highlightColor, float(0.5));
    const highlightDark = mix(darkColor, highlightColor, float(0.5));
    const highlightMix = select(isLightSquare, highlightLight, highlightDark);

    // Chain select() calls to apply highlights
    const mixStart = select(isStartSquare, highlightMix, baseMix);

    const mixEnd = select(isEndSquare, highlightMix, mixStart);

    return vec3(select(isCursorSquare, highlightMix, mixEnd));
  },
);
