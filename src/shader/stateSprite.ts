import { Fn, bool, vec2, uv, color, If, and, not, Discard, select } from 'three/tsl';
import * as THREE from 'three';

export const stateSprite = Fn(({ show = bool(false), lost = bool(false) }) => {
  const center = vec2(0.5);
  const distanceToCenter = uv().distance(center);

  // Clean circle mask: 1 at the center, smoothly drops to 0 at radius 0.5 (anti-aliased)
  const circle = distanceToCenter.smoothstep(0.5, 0.495);

  // Discard pixels outside the circle
  distanceToCenter.greaterThan(0.49).discard();

  // If 'show' is false, discard the whole sprite
  Discard(show.not());

  const drawColor = color(new THREE.Color('#87c9f8'));
  const lostColor = color(new THREE.Color('#e75656'));

  // Pick color based on 'lost' status
  const stateColor = select(lost, lostColor, drawColor);

  return circle.mul(stateColor);
});
