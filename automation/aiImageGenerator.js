/**
 * Califnco Water - Instagram AI Image Pipeline
 *
 * Phase 2 Implementation:
 * - Retains baseline catalogue image validation and structured prompt creation.
 * - Adds an optional, decoupled AI image generation step with configurable providers:
 *   - 'none' (default when unconfigured): Explicitly reports that NO AI image was generated
 *     and clearly identifies the Unsplash photo as a stock reference (never mislabels it).
 *   - 'pollinations': Community zero-key AI image generation via Pollinations.ai.
 *   - 'huggingface': Serverless inference with free Hugging Face User Access Token (HF_TOKEN).
 *   - 'mock': Deterministic local test provider for verifying disk-saving and pipeline flow.
 * - Saves any generated images locally to automation/output/images/ for review.
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate and prepare image metadata for an Instagram product post (Phase 1 Baseline)
 * @param {Object} product - Product record from src/data/products.js
 * @returns {Object} Image metadata and AI prompt specification
 */
function prepareProductImage(product) {
  if (!product || typeof product !== 'object') {
    throw new Error('Invalid product provided to prepareProductImage');
  }

  const rawImageUrl = product.image || '';
  const isHttps = typeof rawImageUrl === 'string' && rawImageUrl.startsWith('https://');

  // Construct structured generative AI prompt for studio photography
  const aiStudioPrompt = [
    `Professional studio product photography of ${product.name}.`,
    `Clean, modern aesthetic with pure water droplets and a sparkling glass of clean drinking water.`,
    `Set in a contemporary, minimalist Indian home kitchen with soft cinematic natural lighting.`,
    `Category: ${product.category}. Features: ${product.specifications || 'Premium water purification system'}.`,
    `High resolution, crisp details, commercial advertising style, 1:1 square Instagram aspect ratio.`,
    `No blur, no distorted text, professional brand visual.`
  ].join(' ');

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    placeholderIcon: product.placeholderIcon || '💧',
    // Public HTTPS URL from product catalogue
    imageUrl: rawImageUrl,
    isValidHttps: isHttps,
    // Instagram Graph API specifications
    instagramCompliance: {
      urlScheme: isHttps ? 'HTTPS (Valid for Meta Graph API)' : 'INVALID (Meta requires public HTTPS)',
      recommendedAspectRatio: '1:1 (Square) or 4:5 (Portrait)',
      acceptedFormats: ['JPG', 'PNG'],
    },
    // Prompt ready for AI generative models
    aiPrompt: aiStudioPrompt,
  };
}

/**
 * Ensure an output directory exists on disk
 * @param {string} dirPath
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Optional AI Image Generation Step
 * Strictly distinguishes between AI-generated images and catalogue stock references.
 *
 * @param {Object} product - Product record
 * @param {Object} [options]
 * @param {'none'|'pollinations'|'huggingface'|'mock'} [options.provider='none'] - Image generation provider
 * @param {string} [options.outputDir] - Local folder to store generated files
 * @param {string} [options.apiKey] - Optional provider API key
 * @param {number} [options.timeoutMs=15000] - Request timeout
 * @returns {Promise<Object>} Image generation outcome metadata
 */
async function generateProductImageAI(product, options = {}) {
  const baseMeta = prepareProductImage(product);
  const provider = options.provider || process.env.AI_IMAGE_PROVIDER || 'none';
  const outputDir = options.outputDir || path.resolve(__dirname, 'output/images');

  // --- Case 1: Unconfigured / None (Default) ---
  // Explicitly note that no AI image was generated; do not mislabel catalogue Unsplash photo.
  if (provider === 'none') {
    return {
      aiImageGenerated: false,
      provider: 'none',
      reason: 'No AI image provider configured (optional step).',
      imageSource: 'catalogue_stock',
      catalogueImageUrl: product.image,
      localImagePath: null,
      note: 'Catalogue stock photo from Unsplash was used for reference; it was NOT AI-generated.',
      aiPrompt: baseMeta.aiPrompt,
      instagramCompliance: baseMeta.instagramCompliance,
    };
  }

  // --- Case 2: Mock Provider (Local Verification Without External Network) ---
  if (provider === 'mock') {
    ensureDirectory(outputDir);
    const fileName = `${product.id}-mock-ai-product.svg`;
    const targetFile = path.join(outputDir, fileName);

    // Create a branded SVG test artifact banner for local pipeline verification
    const svgContent = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0284c7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0369a1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  <circle cx="512" cy="400" r="180" fill="#ffffff" opacity="0.15" />
  <text x="512" y="380" font-family="sans-serif" font-size="90" text-anchor="middle" fill="#ffffff">💧</text>
  <text x="512" y="460" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#ffffff">CALIFNCO WATER</text>
  <rect x="120" y="560" width="784" height="320" rx="24" fill="#ffffff" opacity="0.95" />
  <text x="512" y="630" font-family="sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#0f172a">${product.name}</text>
  <text x="512" y="680" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#475569">${product.category} • Certified Purity</text>
  <text x="512" y="740" font-family="sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#0284c7">₹${product.price.toLocaleString('en-IN')}</text>
  <text x="512" y="820" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#991b1b">[TEST ARTIFACT ONLY — NOT A REAL AI IMAGE]</text>
</svg>`;

    fs.writeFileSync(targetFile, svgContent, 'utf8');

    return {
      aiImageGenerated: false,
      isTestMockArtifact: true,
      provider: 'mock',
      imageSource: 'test_mock_artifact',
      format: 'svg',
      localImagePath: targetFile,
      fileSize: Buffer.byteLength(svgContent, 'utf8'),
      note: 'Mock SVG test artifact generated for pipeline verification; NOT a real AI-generated product image.',
      aiPrompt: baseMeta.aiPrompt,
      catalogueImageUrl: product.image,
    };
  }

  // --- Case 3: Pollinations.ai (Free Generative AI Image Endpoint) ---
  if (provider === 'pollinations') {
    ensureDirectory(outputDir);
    const dateStr = (options.date ? new Date(options.date) : new Date()).toISOString().slice(0, 10);
    const targetFile = path.join(outputDir, `${product.id}-${dateStr}.jpg`);
    const cleanPrompt = baseMeta.aiPrompt.replace(/[^\w\s,.-]/g, '');
    const seed = Math.floor(Math.random() * 100000);
    const requestUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

      const response = await fetch(requestUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Pollinations API HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 1000) {
        throw new Error('Downloaded image buffer is suspiciously small (<1KB).');
      }

      fs.writeFileSync(targetFile, buffer);

      return {
        aiImageGenerated: true,
        provider: 'pollinations',
        imageSource: 'ai_generated',
        format: 'jpg',
        localImagePath: targetFile,
        fileSize: buffer.length,
        note: 'AI image generated via Pollinations and saved locally.',
        aiPrompt: baseMeta.aiPrompt,
        catalogueImageUrl: product.image,
      };
    } catch (err) {
      console.warn(`[AI Image] Pollinations generation failed (${err.message}). Falling back to catalogue stock image.`);
      return {
        aiImageGenerated: false,
        provider: 'pollinations',
        reason: `Pollinations generation error: ${err.message}`,
        imageSource: 'catalogue_stock',
        catalogueImageUrl: product.image,
        localImagePath: null,
        note: 'Catalogue stock photo from Unsplash used as fallback; it was NOT AI-generated.',
        aiPrompt: baseMeta.aiPrompt,
        instagramCompliance: baseMeta.instagramCompliance,
      };
    }
  }

  // --- Case 4: Hugging Face Serverless Inference ---
  if (provider === 'huggingface') {
    const apiKey = options.apiKey || process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.warn(`[AI Image] HF_TOKEN is not configured. Falling back to catalogue stock image.`);
      return {
        aiImageGenerated: false,
        provider: 'huggingface',
        reason: 'HF_TOKEN not configured.',
        imageSource: 'catalogue_stock',
        catalogueImageUrl: product.image,
        localImagePath: null,
        note: 'Catalogue stock photo from Unsplash used as reference; it was NOT AI-generated.',
        aiPrompt: baseMeta.aiPrompt,
        instagramCompliance: baseMeta.instagramCompliance,
      };
    }

    ensureDirectory(outputDir);
    const dateStr = (options.date ? new Date(options.date) : new Date()).toISOString().slice(0, 10);
    const targetFile = path.join(outputDir, `${product.id}-${dateStr}-hf.jpg`);
    const model = options.model || 'black-forest-labs/FLUX.1-schnell';
    const endpoint = `https://api-inference.huggingface.co/models/${model}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 25000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: baseMeta.aiPrompt }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API HTTP ${response.status}: ${errorText.slice(0, 120)}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(targetFile, buffer);

      return {
        aiImageGenerated: true,
        provider: 'huggingface',
        model,
        imageSource: 'ai_generated',
        format: 'jpg',
        localImagePath: targetFile,
        fileSize: buffer.length,
        note: `AI image generated via Hugging Face (${model}) and saved locally.`,
        aiPrompt: baseMeta.aiPrompt,
        catalogueImageUrl: product.image,
      };
    } catch (err) {
      console.warn(`[AI Image] Hugging Face generation failed (${err.message}). Falling back to catalogue stock image.`);
      return {
        aiImageGenerated: false,
        provider: 'huggingface',
        reason: `Hugging Face error: ${err.message}`,
        imageSource: 'catalogue_stock',
        catalogueImageUrl: product.image,
        localImagePath: null,
        note: 'Catalogue stock photo from Unsplash used as fallback; it was NOT AI-generated.',
        aiPrompt: baseMeta.aiPrompt,
        instagramCompliance: baseMeta.instagramCompliance,
      };
    }
  }

  // Unknown provider fallback
  return {
    aiImageGenerated: false,
    provider,
    reason: `Unknown image provider: ${provider}`,
    imageSource: 'catalogue_stock',
    catalogueImageUrl: product.image,
    localImagePath: null,
    note: 'Catalogue stock photo from Unsplash used as fallback; it was NOT AI-generated.',
    aiPrompt: baseMeta.aiPrompt,
    instagramCompliance: baseMeta.instagramCompliance,
  };
}

module.exports = {
  prepareProductImage,
  generateProductImageAI,
};
