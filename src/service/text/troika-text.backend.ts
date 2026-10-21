import * as THREE from 'three/webgpu';

import { BaseTextBackend } from './text-backend.ts';
import { type TextBackendType, type TextInstance, type TextOptions } from './types.ts';

let TroikaText: (new () => any) | null = null;

// Default font URL (Inter from Google Fonts - reliable CDN)
const DEFAULT_FONT_URL =
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2';

function isFontUrl(fontFamily: string): boolean {
  return fontFamily.startsWith('http://') || fontFamily.startsWith('https://') || fontFamily.startsWith('/');
}

function resolveFontUrl(fontFamily: string | undefined): string {
  const family = fontFamily ?? 'system-ui, sans-serif';
  return isFontUrl(family) ? family : DEFAULT_FONT_URL;
}

async function loadTroika(): Promise<any> {
  if (TroikaText) return TroikaText;
  const module = await import('troika-three-text');
  TroikaText = module.Text;
  return TroikaText;
}

function toThreeColor(color: string | number): number {
  if (typeof color === 'number') return color;
  return new THREE.Color(color).getHex();
}

export class TroikaTextBackend extends BaseTextBackend {
  readonly type: TextBackendType = 'troika-text';
  private ready = false;

  private async ensureReady(): Promise<void> {
    if (!this.ready) {
      await loadTroika();
      this.ready = true;
    }
  }

  async create(options: TextOptions): Promise<TextInstance> {
    await this.ensureReady();
    const TextConstructor = TroikaText!;

    const text = new TextConstructor();
    text.text = options.text;
    text.fontSize = options.fontSize ?? 0.4;
    text.color = toThreeColor(options.color ?? '#ffffff');
    text.anchorX = options.anchorX ?? 'center';
    text.anchorY = options.anchorY ?? 'center';
    text.maxWidth = options.maxWidth;
    text.font = resolveFontUrl(options.fontFamily);
    text.fontWeight = options.fontWeight ?? '400';
    text.outlineWidth = options.outlineWidth ?? 0;
    text.outlineColor = options.outlineColor ? toThreeColor(options.outlineColor) : 0x00_00_00;
    text.position.copy(options.position);

    if (options.rotation) {
      text.rotation.copy(options.rotation);
    }

    text.sync();

    return this.createTextInstance(text, options, this.type);
  }

  // Sync interface for compatibility - throws if used directly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createSync(_options: TextOptions): TextInstance {
    throw new Error(
      'TroikaTextBackend.createSync() not supported. Use TextService.add() which handles async creation.',
    );
  }

  protected disposeInstance(instance: TextInstance): void {
    const obj = instance.object as any;
    if (obj && typeof obj.dispose === 'function') {
      obj.dispose();
    }
  }

  protected updateInstance(instance: TextInstance, options: Partial<TextOptions>): void {
    const text = instance.object as any;
    const mergedOptions = { ...instance.options, ...options };
    instance.options = mergedOptions;

    if (mergedOptions.text !== undefined) text.text = mergedOptions.text;
    if (mergedOptions.fontSize !== undefined) text.fontSize = mergedOptions.fontSize;
    if (mergedOptions.color !== undefined) text.color = toThreeColor(mergedOptions.color);
    if (mergedOptions.anchorX !== undefined) text.anchorX = mergedOptions.anchorX;
    if (mergedOptions.anchorY !== undefined) text.anchorY = mergedOptions.anchorY;
    if (mergedOptions.maxWidth !== undefined) text.maxWidth = mergedOptions.maxWidth;
    if (mergedOptions.fontFamily !== undefined) text.font = resolveFontUrl(mergedOptions.fontFamily);
    if (mergedOptions.fontWeight !== undefined) text.fontWeight = mergedOptions.fontWeight;
    if (mergedOptions.outlineWidth !== undefined) text.outlineWidth = mergedOptions.outlineWidth;
    if (mergedOptions.outlineColor !== undefined)
      text.outlineColor = toThreeColor(mergedOptions.outlineColor);
    if (mergedOptions.position !== undefined) text.position.copy(mergedOptions.position);
    if (mergedOptions.rotation !== undefined) text.rotation.copy(mergedOptions.rotation);

    text.sync();
  }
}
