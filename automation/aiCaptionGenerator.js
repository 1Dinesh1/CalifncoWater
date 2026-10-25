/**
 * Califnco Water - Instagram AI Caption & Hashtag Generator
 *
 * Phase 2 Implementation:
 * - Deterministic, verified local caption generator (Phase 1 baseline) preserved 100%.
 * - Configurable AI caption provider pipeline (e.g. Google Gemini, OpenAI, or Custom/Mock).
 * - Automatic, graceful fallback to local generator if no API key is configured or if API fails.
 * - Zero secrets logged; strictly preserves verified product specifications without hallucination.
 */

const CATEGORY_HASHTAGS = {
  Purifiers: [
    '#WaterPurifier',
    '#ROUVAlkaline',
    '#PureWaterIndia',
    '#CleanDrinkingWater',
    '#SafeWater',
    '#HomePurifier',
  ],
  Dispensers: [
    '#WaterDispenser',
    '#OfficeHydration',
    '#CommercialWater',
    '#HotAndColdWater',
    '#WorkplaceWellness',
  ],
  Filters: [
    '#WaterFilter',
    '#ROFilter',
    '#FilterReplacement',
    '#CleanWaterSolutions',
    '#WaterPurifierService',
  ],
  Accessories: [
    '#WaterAccessories',
    '#ROSpares',
    '#TDSMeter',
    '#WaterFiltration',
    '#PurifierParts',
  ],
};

const BASE_BRAND_HASHTAGS = [
  '#CalifncoWater',
  '#Califnco',
  '#PureWater',
  '#HealthyLiving',
  '#HydrationMatters',
  '#SafeDrinkingWater',
];

/**
 * Format a number as Indian Rupee currency (₹14,999)
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number') return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Generate relevant, non-spammy hashtags based on the product category and brand
 * @param {Object} product - Product record from src/data/products.js
 * @returns {string[]} Array of hashtag strings
 */
function generateHashtags(product) {
  if (!product) return [...BASE_BRAND_HASHTAGS];

  const categoryTags = CATEGORY_HASHTAGS[product.category] || [];
  const productTags = [];

  // Add specific tags based on product attributes
  if (product.badge) {
    const cleanBadge = product.badge.replace(/\s+/g, '');
    productTags.push(`#${cleanBadge}`);
  }

  // Combine brand, category, and specific tags (deduped)
  const combined = Array.from(new Set([
    ...BASE_BRAND_HASHTAGS,
    ...categoryTags,
    ...productTags,
  ]));

  return combined;
}

/**
 * Safely format badge text for the header without duplicating words already present in the product name
 * @param {Object} product
 * @returns {string}
 */
function getHeaderBadgeText(product) {
  if (!product || !product.badge) return '';
  const cleanBadge = product.badge.trim();
  const nameLower = (product.name || '').toLowerCase();
  const badgeLower = cleanBadge.toLowerCase();

  // If the product name already contains the badge or its root words (e.g. "Mineral Booster" vs "Taste Boost", "Commercial" vs "Commercial"),
  // avoid repeating the badge in the header.
  const badgeWords = badgeLower.split(/\s+/).filter((w) => w.length >= 3);
  const isDuplicate = badgeWords.some((word) => nameLower.includes(word));
  if (isDuplicate) {
    return '';
  }

  return ` [${cleanBadge.toUpperCase()}]`;
}

/**
 * Generate an Instagram caption strictly using verified product attributes (Local Deterministic)
 * @param {Object} product - Product record from src/data/products.js
 * @param {Object} [options] - Optional overrides or settings
 * @returns {{ caption: string, hashtags: string[], fullPostText: string, metadata: Object, provider: string }}
 */
function generateCaption(product, options = {}) {
  if (!product || typeof product !== 'object') {
    throw new Error('Invalid product provided to generateCaption');
  }

  const icon = product.placeholderIcon || '💧';
  const badgeText = getHeaderBadgeText(product);

  // 1. Hook & Header
  const header = `${icon} Califnco Product Spotlight: ${product.name}${badgeText}\nCertified purity engineered for healthy living.`;

  // 2. Rating & Reviews (strictly factual from catalogue; no invented installation/customer claims)
  let socialProof = '';
  if (product.rating && product.reviewsCount) {
    socialProof = `⭐ Rated ${product.rating}/5 (${product.reviewsCount} reviews).`;
  }

  // 3. Real Product Description (verbatim from catalogue)
  const descriptionSection = `🔍 Why Choose This System?\n${product.description}`;

  // 4. Real Specifications (split and formatted as clean bullet points)
  let specsSection = '';
  if (product.specifications) {
    const specBullets = product.specifications
      .split('•')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `  ✓ ${s}`)
      .join('\n');
    specsSection = `⚙️ Technical Highlights:\n${specBullets}`;
  }

  // 5. Pricing & Value Proposition
  const priceFormatted = formatCurrency(product.price);
  const originalPriceFormatted = product.originalPrice ? formatCurrency(product.originalPrice) : null;
  let pricingSection = `💰 Price: ${priceFormatted}`;
  if (originalPriceFormatted && product.originalPrice > product.price) {
    const savings = formatCurrency(product.originalPrice - product.price);
    pricingSection += ` (MRP: ${originalPriceFormatted} • Save ${savings})`;
  }
  if (product.wholesalePrice) {
    pricingSection += `\n🏢 Authorized Wholesale Trade rates available for approved dealers.`;
  }

  // 6. Call to Action (CTA)
  const ctaSection = [
    `📲 Order easily via the Califnco Water mobile app.`,
    `🚚 Cash on Delivery (COD) & technician doorstep installation available.`,
    `🛠️ Need service or filter maintenance? Book directly in-app!`,
    `🔗 Tap the link in bio or visit @califncowater to learn more.`,
  ].join('\n');

  // Assemble caption sections
  const sections = [
    header,
    socialProof,
    descriptionSection,
    specsSection,
    pricingSection,
    ctaSection,
  ].filter(Boolean);

  const captionBody = sections.join('\n\n');

  // 7. Hashtags
  const hashtags = generateHashtags(product);
  const hashtagBlock = hashtags.join(' ');

  // Full Instagram Post Content
  const fullPostText = `${captionBody}\n\n.\n.\n${hashtagBlock}`;

  return {
    caption: captionBody,
    hashtags,
    hashtagBlock,
    fullPostText,
    provider: 'local',
    aiEnhanced: false,
    metadata: {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      wholesalePrice: product.wholesalePrice || null,
      characterCount: fullPostText.length,
      instagramLimit: 2200,
      withinLimit: fullPostText.length <= 2200,
    },
  };
}

/**
 * Mask an API key safely for log output without exposing the raw secret
 * @param {string} key
 * @returns {string}
 */
function maskApiKey(key) {
  if (!key || typeof key !== 'string') return 'none';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)} (length: ${key.length})`;
}

/**
 * Build the system and user prompt for LLM caption generation
 * @param {Object} product
 * @returns {string}
 */
function buildAiPrompt(product) {
  return [
    `You are the professional social media copywriter for Califnco Water (@califncowater), an Indian water purification company.`,
    `Write a polished, engaging Instagram caption for the following product:`,
    `- Product Name: ${product.name}`,
    `- Category: ${product.category}`,
    `- Verified Description: ${product.description}`,
    `- Key Technical Specifications: ${product.specifications}`,
    `- Price: ₹${product.price} (MRP: ₹${product.originalPrice || product.price})`,
    `- Rating: ${product.rating || 4.5}/5 (${product.reviewsCount || 0} reviews)`,
    `- Badge: ${product.badge || 'Verified Quality'}`,
    ``,
    `STRICT CONTENT RULES:`,
    `1. Use ONLY the verified specifications and description above. Do not invent technical claims, certifications, or features. Do not describe reviews as installations, customers, or verified purchases; state only the rating and review count.`,
    `2. Tone: Trustworthy, professional, health-focused, and premium yet accessible.`,
    `3. Structure:`,
    `   - Engaging hook featuring product name and category icon`,
    `   - Why customers love it (based on real description)`,
    `   - Key specifications formatted with bullet points`,
    `   - Pricing and savings`,
    `   - Call to action: download Califnco Water app, Cash on Delivery (COD) & doorstep installation available`,
    `4. Keep caption body under 1,500 characters.`,
    `5. Do NOT output markdown code blocks. Output plain text ready for Instagram.`,
  ].join('\n');
}

/**
 * Asynchronously generate an Instagram caption with configurable AI providers (Gemini, OpenAI, Mock, Local)
 * Automatically falls back to verified local generator if provider is unconfigured or fails.
 *
 * @param {Object} product - Product record
 * @param {Object} [options]
 * @param {'local'|'gemini'|'openai'|'mock'} [options.provider] - AI provider to use
 * @param {string} [options.apiKey] - Optional explicit API key
 * @param {string} [options.model] - Optional model identifier
 * @param {number} [options.timeoutMs=10000] - Request timeout in ms
 * @returns {Promise<Object>}
 */
async function generateCaptionWithAI(product, options = {}) {
  // Resolve provider from options, environment, or default to 'local'
  let provider = options.provider || process.env.AI_CAPTION_PROVIDER;
  if (!provider) {
    if (process.env.GEMINI_API_KEY) {
      provider = 'gemini';
    } else if (process.env.OPENAI_API_KEY) {
      provider = 'openai';
    } else {
      provider = 'local';
    }
  }

  // --- 1. Local Fallback Provider (No API key needed) ---
  if (provider === 'local') {
    return generateCaption(product, options);
  }

  // --- 2. Mock Provider (For deterministic testing of AI pipeline without network calls) ---
  if (provider === 'mock') {
    const localBase = generateCaption(product, options);
    const mockCaption = `🤖 [AI-Enhanced by Mock LLM]\n${localBase.caption}\n\n✨ Experience pure hydration today with Califnco Water.`;
    const fullPostText = `${mockCaption}\n\n.\n.\n${localBase.hashtagBlock}`;
    return {
      caption: mockCaption,
      hashtags: localBase.hashtags,
      hashtagBlock: localBase.hashtagBlock,
      fullPostText,
      provider: 'mock',
      aiEnhanced: true,
      metadata: {
        ...localBase.metadata,
        characterCount: fullPostText.length,
        withinLimit: fullPostText.length <= 2200,
        providerUsed: 'mock',
      },
    };
  }

  // --- 3. Google Gemini API Provider (Google AI Studio Free Tier) ---
  if (provider === 'gemini') {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(`[AI Caption] GEMINI_API_KEY is not configured. Falling back to verified local catalogue generator.`);
      return generateCaption(product, options);
    }

    const model = options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const prompt = buildAiPrompt(product);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 10000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText || typeof generatedText !== 'string' || generatedText.trim().length === 0) {
        throw new Error('Gemini API returned an empty text candidate.');
      }

      const cleanText = generatedText.trim();
      const hashtags = generateHashtags(product);
      const hashtagBlock = hashtags.join(' ');
      const fullPostText = `${cleanText}\n\n.\n.\n${hashtagBlock}`;

      return {
        caption: cleanText,
        hashtags,
        hashtagBlock,
        fullPostText,
        provider: 'gemini',
        aiEnhanced: true,
        model,
        metadata: {
          productId: product.id,
          productName: product.name,
          category: product.category,
          characterCount: fullPostText.length,
          withinLimit: fullPostText.length <= 2200,
          providerUsed: 'gemini',
        },
      };
    } catch (err) {
      console.warn(`[AI Caption] Gemini generation failed (${err.message}). Safely falling back to local catalogue generator.`);
      const fallback = generateCaption(product, options);
      fallback.fallbackReason = err.message;
      return fallback;
    }
  }

  // --- 4. OpenAI API Provider ---
  if (provider === 'openai') {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(`[AI Caption] OPENAI_API_KEY is not configured. Falling back to verified local catalogue generator.`);
      return generateCaption(product, options);
    }

    const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const prompt = buildAiPrompt(product);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 10000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are an Instagram copywriter for Califnco Water (@califncowater).' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      const generatedText = data?.choices?.[0]?.message?.content;

      if (!generatedText || typeof generatedText !== 'string') {
        throw new Error('OpenAI API returned an invalid response structure.');
      }

      const cleanText = generatedText.trim();
      const hashtags = generateHashtags(product);
      const hashtagBlock = hashtags.join(' ');
      const fullPostText = `${cleanText}\n\n.\n.\n${hashtagBlock}`;

      return {
        caption: cleanText,
        hashtags,
        hashtagBlock,
        fullPostText,
        provider: 'openai',
        aiEnhanced: true,
        model,
        metadata: {
          productId: product.id,
          productName: product.name,
          category: product.category,
          characterCount: fullPostText.length,
          withinLimit: fullPostText.length <= 2200,
          providerUsed: 'openai',
        },
      };
    } catch (err) {
      console.warn(`[AI Caption] OpenAI generation failed (${err.message}). Safely falling back to local catalogue generator.`);
      const fallback = generateCaption(product, options);
      fallback.fallbackReason = err.message;
      return fallback;
    }
  }

  // Unknown provider fallback
  console.warn(`[AI Caption] Unknown provider "${provider}". Falling back to verified local catalogue generator.`);
  return generateCaption(product, options);
}

module.exports = {
  generateCaption,
  generateCaptionWithAI,
  generateHashtags,
  formatCurrency,
  maskApiKey,
  CATEGORY_HASHTAGS,
  BASE_BRAND_HASHTAGS,
};
