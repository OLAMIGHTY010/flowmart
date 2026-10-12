/**
 * ============================================================================
 * UNIT TESTS: SHARP IMAGE OPTIMIZATION & RESPONSIVE WEBP PIPELINE
 * ============================================================================
 */

import sharp from 'sharp';
import { imageProcessorService } from '../../services/media/image-processor.service';

describe('ImageProcessorService (sharp WebP Pipeline)', () => {
  let sampleImageBuffer: Buffer;

  beforeAll(async () => {
    // Generate a test 800x800 red square PNG in memory
    sampleImageBuffer = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();
  });

  describe('1. WebP Multi-Resolution Transcoding', () => {
    it('generates thumbnail, card, and full WebP variants with dimensional specs', async () => {
      const result = await imageProcessorService.optimizeProductImage(sampleImageBuffer);

      expect(result.originalSizeBytes).toBeGreaterThan(0);
      expect(result.variants.length).toBe(3);

      const thumb = result.variants.find((v) => v.label === 'thumbnail');
      expect(thumb).toBeDefined();
      expect(thumb?.width).toBe(150);
      expect(thumb?.height).toBe(150);
      expect(thumb?.format).toBe('webp');

      const card = result.variants.find((v) => v.label === 'card');
      expect(card).toBeDefined();
      expect(card?.width).toBe(400);

      const full = result.variants.find((v) => v.label === 'full');
      expect(full).toBeDefined();
      expect(full?.width).toBeLessThanOrEqual(1080);
    });
  });

  describe('2. Blur Placeholder Generation', () => {
    it('creates lightweight base64 blur placeholder string', async () => {
      const placeholder = await imageProcessorService.generateBlurPlaceholder(sampleImageBuffer);

      expect(placeholder.startsWith('data:image/webp;base64,')).toBe(true);
      expect(placeholder.length).toBeGreaterThan(30);
    });
  });
});
