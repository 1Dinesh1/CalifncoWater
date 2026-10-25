/**
 * Califnco Water - Instagram Automation Verification Suite (Phase 2)
 *
 * Verifies:
 * 1. Product catalogue parsing from src/data/products.js (all 16 products).
 * 2. Deterministic daily product rotation across upcoming calendar days.
 * 3. Caption truth & Instagram character limits (Phase 1 baseline checks).
 * 4. Image pipeline validation & AI prompt formatting.
 * 5. Unconfigured provider behavior (default):
 *    - Caption uses verified local catalogue generator.
 *    - Image pipeline clearly reports aiImageGenerated: false; does not mislabel Unsplash as AI.
 *    - Saves local review preview files to automation/output/.
 * 6. Configured AI caption provider behavior & graceful fallback upon failure.
 * 7. Configured AI image provider behavior (mock generation & disk saving).
 * 8. Secret masking and credential protection.
 */

const fs = require('fs');
const path = require('path');
const { loadProducts, selectDailyProduct, runDailyAutomation, TARGET_ACCOUNT } = require('./postDailyInstagram');
const { generateCaption, generateCaptionWithAI, generateHashtags, maskApiKey } = require('./aiCaptionGenerator');
const { prepareProductImage, generateProductImageAI } = require('./aiImageGenerator');
const {
  validateImageUrl,
  createMediaContainer,
  checkContainerStatus,
  pollContainerUntilFinished,
  publishMediaContainer,
  publishInstagramPost,
  redactSecrets,
  DEFAULT_API_HOST,
  DEFAULT_GRAPH_API_VERSION,
} = require('./instagramPublisher');

async function runTestSuite() {
  console.log('🧪 Starting Phase 2 Verification Suite...\n');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, description) {
    testsTotal++;
    if (condition) {
      console.log(`  ✓ [PASS] ${description}`);
      testsPassed++;
    } else {
      console.error(`  ✗ [FAIL] ${description}`);
      process.exitCode = 1;
    }
  }

  // --- Test 1: Catalogue Loading ---
  console.log('Test 1: Product Catalogue Parsing');
  const products = loadProducts();
  assert(Array.isArray(products) && products.length === 16, 'Loaded exactly 16 products from src/data/products.js');
  const allHaveIds = products.every((p) => p.id && typeof p.id === 'string');
  const allHaveImages = products.every((p) => p.image && p.image.startsWith('https://'));
  const allHavePrices = products.every((p) => typeof p.price === 'number' && p.price > 0);
  assert(allHaveIds, 'All products have non-empty string IDs');
  assert(allHaveImages, 'All products have public HTTPS image URLs');
  assert(allHavePrices, 'All products have valid numeric prices');

  // --- Test 2: Deterministic Daily Selection ---
  console.log('\nTest 2: Deterministic Daily Product Selection');
  const today = new Date('2026-10-25T12:00:00Z');
  const selectionA = selectDailyProduct(products, today);
  const selectionB = selectDailyProduct(products, today);
  assert(selectionA.product.id === selectionB.product.id, 'Identical date produces identical product (deterministic)');
  assert(selectionA.index >= 0 && selectionA.index < products.length, 'Selected index is within valid catalogue bounds');

  // Verify consecutive days rotate
  const tomorrow = new Date('2026-10-26T12:00:00Z');
  const selectionTomorrow = selectDailyProduct(products, tomorrow);
  const expectedNextIndex = (selectionA.index + 1) % products.length;
  assert(selectionTomorrow.index === expectedNextIndex, 'Next day cleanly advances to the next product in rotation');

  // --- Test 3: Caption & Specification Integrity (Phase 1 Baseline) ---
  console.log('\nTest 3: Caption Truth & Instagram Limits (All 16 Catalogue Products)');
  for (const product of products) {
    const caption = generateCaption(product);
    assert(caption.metadata.withinLimit, `Product ${product.id}: Caption length (${caption.metadata.characterCount} chars) is under 2,200`);
    assert(caption.hashtags.length >= 5, `Product ${product.id}: Generates at least 5 relevant hashtags`);
    assert(caption.caption.includes(product.description), `Product ${product.id}: Accurately embeds actual catalogue description`);
    assert(!caption.caption.includes('installations') && !caption.caption.includes('verified purchases'), `Product ${product.id}: Accurately states reviews without claiming installations or verified purchases`);
  }
  const flt02Caption = generateCaption(products.find((p) => p.id === 'flt-02'));
  assert(!flt02Caption.caption.includes('Booster [TASTE BOOST]'), 'Eliminates redundant duplicated badge text (Booster [TASTE BOOST])');

  // --- Test 4: Image Validation (Phase 1 Baseline) ---
  console.log('\nTest 4: Image Pipeline Validation');
  const sampleImage = prepareProductImage(products[0]);
  assert(sampleImage.isValidHttps === true, 'Product image is verified public HTTPS');
  assert(typeof sampleImage.aiPrompt === 'string' && sampleImage.aiPrompt.length > 50, 'Generates comprehensive AI studio prompt');

  // --- Test 5: Unconfigured Provider Behavior (Phase 2 Default) ---
  console.log('\nTest 5: Unconfigured Provider Behavior (Defaults)');
  const unconfiguredResult = await runDailyAutomation({
    dryRun: true,
    captionProvider: 'local',
    imageProvider: 'none',
    silent: true,
    saveFiles: true,
  });

  assert(unconfiguredResult.caption.provider === 'local', 'Default caption uses "local" verified catalogue provider');
  assert(unconfiguredResult.caption.aiEnhanced === false, 'Default caption reports aiEnhanced: false');
  assert(unconfiguredResult.image.aiImageGenerated === false, 'Default image reports aiImageGenerated: false');
 assert(
  unconfiguredResult.imagePreparation.provider === 'none',
  'Default image provider is "none"'
);

assert(
  unconfiguredResult.imagePreparation.imageSource === 'catalogue_stock',
  'Default image source is accurately labeled "catalogue_stock"'
);

assert(
  unconfiguredResult.imagePreparation.note.includes('NOT AI-generated'),
  'Explicitly notes catalogue Unsplash photo was NOT AI-generated'
);
  assert(fs.existsSync(unconfiguredResult.savedFiles.jsonPath), 'Saved review artifact daily-post-preview.json exists on disk');
  assert(fs.existsSync(unconfiguredResult.savedFiles.captionPath), 'Saved review artifact daily-post-caption.txt exists on disk');

  // --- Test 6: Configured AI Caption Provider & Fallback ---
  console.log('\nTest 6: Configured AI Caption Provider & Graceful Fallback');
  const mockCaption = await generateCaptionWithAI(products[0], { provider: 'mock' });
  assert(mockCaption.provider === 'mock', 'Configured AI caption provider executes successfully (provider: mock)');
  assert(mockCaption.aiEnhanced === true, 'Mock AI caption reports aiEnhanced: true');
  assert(mockCaption.metadata.withinLimit === true, 'Mock AI caption respects Instagram character limit');
  assert(mockCaption.hashtags.length >= 5, 'Mock AI caption preserves category and brand hashtags');

  // Test failure fallback: missing/invalid API key cleanly defaults to local generator
  const fallbackCaption = await generateCaptionWithAI(products[0], {
    provider: 'gemini',
    apiKey: '', // Empty key simulates unconfigured state
  });
  assert(fallbackCaption.provider === 'local', 'Unconfigured Gemini key gracefully falls back to local catalogue generator');
  assert(fallbackCaption.metadata.withinLimit === true, 'Fallback caption preserves character count validity');

  // --- Test 7: Configured AI Image Provider Behavior ---
  console.log('\nTest 7: Configured AI Image Provider Behavior');
  const mockImage = await generateProductImageAI(products[0], { provider: 'mock' });
  assert(mockImage.isTestMockArtifact === true && mockImage.aiImageGenerated === false, 'Mock image provider clearly identifies output as a test artifact (aiImageGenerated: false)');
  assert(mockImage.provider === 'mock', 'Image provider reports "mock"');
  assert(mockImage.imageSource === 'test_mock_artifact', 'Image source reports "test_mock_artifact" (not real ai_generated)');
  assert(mockImage.note.includes('NOT a real AI-generated product image'), 'Note explicitly states mock SVG is NOT a real AI-generated product image');
  assert(fs.existsSync(mockImage.localImagePath), 'Mock SVG test artifact is saved locally to disk');
  assert(fs.statSync(mockImage.localImagePath).size > 0, 'Saved mock SVG test artifact has non-zero size');

  const unconfiguredImage = await generateProductImageAI(products[0], { provider: 'none' });
  assert(unconfiguredImage.aiImageGenerated === false, 'Unconfigured image provider reports aiImageGenerated: false');
  assert(unconfiguredImage.imageSource === 'catalogue_stock', 'Unconfigured image source is "catalogue_stock"');
  assert(unconfiguredImage.localImagePath === null, 'Unconfigured image has no local AI image path');

  // --- Test 8: Secret Masking & Protection ---
  console.log('\nTest 8: Secret Masking & Protection');
  const sampleKey = 'AIzaSyD_SampleSecretKey1234567890';
  const masked = maskApiKey(sampleKey);
  assert(!masked.includes('SampleSecretKey'), 'maskApiKey never leaks raw secret characters');
  assert(masked.includes('length: 33'), 'maskApiKey reports safe metadata length');
  assert(maskApiKey(null) === 'none', 'maskApiKey handles empty input safely');

  // --- Test 9: Image URL Validation (Meta Graph API Requirements) ---
  console.log('\nTest 9: Image URL Validation (Meta Graph API Requirements)');
  assert(validateImageUrl('https://images.unsplash.com/photo-1548839140.jpg').isValid === true, 'Accepts valid HTTPS JPEG URL');
  assert(validateImageUrl('https://example.com/products/purifier.png').isValid === true, 'Accepts valid HTTPS PNG URL');
  assert(validateImageUrl('https://images.unsplash.com/photo-1548839140?fm=jpg').isValid === true, 'Accepts HTTPS URL with jpg format parameter');
  assert(validateImageUrl('D:\\CalifncoProject\\images\\local.jpg').isValid === false, 'Rejects Windows filesystem paths');
  assert(validateImageUrl('/var/www/images/sample.jpg').isValid === false, 'Rejects POSIX filesystem paths');
  assert(validateImageUrl('file:///D:/image.png').isValid === false, 'Rejects file:// URL scheme');
  assert(validateImageUrl('https://example.com/graphic.svg').isValid === false, 'Rejects SVG image format (unsupported by Instagram)');
  assert(validateImageUrl('http://insecure.com/image.jpg').isValid === false, 'Rejects insecure HTTP protocol');
  assert(validateImageUrl('not-a-valid-url').isValid === false, 'Rejects malformed URL strings');
  assert(validateImageUrl('').isValid === false, 'Rejects empty image URL');

  // --- Test 10: Dry-Run Zero-Network Execution ---
  console.log('\nTest 10: Dry-Run Zero-Network Execution');
  let networkCallsCount = 0;
  const throwingFetch = async () => {
    networkCallsCount++;
    throw new Error('NETWORK CALL DETECTED: Fetch must NEVER be invoked in dry-run mode!');
  };

  const dryContainer = await createMediaContainer('https://example.com/sample.jpg', 'Test caption', {
    dryRun: true,
    fetchFn: throwingFetch,
  });
  assert(dryContainer.dryRun === true && dryContainer.containerId, 'createMediaContainer in dryRun returns simulated container with 0 network calls');

  const dryStatus = await checkContainerStatus('simulated_id', {
    dryRun: true,
    fetchFn: throwingFetch,
  });
  assert(dryStatus.dryRun === true && dryStatus.statusCode === 'FINISHED', 'checkContainerStatus in dryRun returns FINISHED with 0 network calls');

  const dryPublish = await publishMediaContainer('simulated_id', {
    dryRun: true,
    fetchFn: throwingFetch,
  });
  assert(dryPublish.dryRun === true && dryPublish.published === false, 'publishMediaContainer in dryRun returns published: false with 0 network calls');

  const dryPost = await publishInstagramPost({
    imageUrl: 'https://example.com/sample.jpg',
    caption: 'Full test caption',
  }, {
    dryRun: true,
    fetchFn: throwingFetch,
  });
  assert(dryPost.dryRun === true && dryPost.published === false, 'publishInstagramPost in dryRun completes full sequence with 0 network calls');
  assert(networkCallsCount === 0, 'Confirmed exactly 0 network calls made during all dry-run operations');

  // --- Test 11: Mocked Live Publishing & Status Polling ---
  console.log('\nTest 11: Mocked Live Publishing & Status Polling');
  const requestedEndpoints = [];
  const requestedHeaders = [];

  const mockSuccessfulFetch = async (url, options) => {
    requestedEndpoints.push(url);
    requestedHeaders.push(options?.headers || {});

    // Step 1: Media Container
    if (url.includes('/media') && !url.includes('/media_publish')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'mock_cont_9001' }),
      };
    }
    // Step 2: Container Status
    if (url.includes('fields=status_code')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ status_code: 'FINISHED', id: 'mock_cont_9001' }),
      };
    }
    // Step 3: Media Publish
    if (url.includes('/media_publish')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'mock_post_live_777' }),
      };
    }
    throw new Error(`Unexpected mock endpoint: ${url}`);
  };

  const customVersion = 'v22.0';
  const liveResult = await publishInstagramPost({
    imageUrl: 'https://example.com/product.jpg',
    caption: 'Verified caption',
  }, {
    dryRun: false,
    userId: '17841400999999',
    accessToken: 'EAAG_dummy_test_token_123',
    apiVersion: customVersion,
    fetchFn: mockSuccessfulFetch,
  });

  assert(liveResult.published === true, 'Mocked publishing pipeline reports published: true');
  assert(liveResult.mediaId === 'mock_post_live_777', 'Mocked publishing returns correct live post ID');
  assert(requestedEndpoints.length === 3, 'Mocked sequence executed exactly 3 steps (container, status, publish)');
  assert(requestedEndpoints[0].includes(`/${customVersion}/`), 'Configurable Graph API version (v22.0) applied to request endpoint');
  assert(requestedEndpoints[0].startsWith('https://graph.instagram.com/'), 'Media container endpoint uses Instagram Login host https://graph.instagram.com');
  assert(requestedEndpoints[1].startsWith('https://graph.instagram.com/'), 'Container status endpoint uses Instagram Login host https://graph.instagram.com');
  assert(requestedEndpoints[2].startsWith('https://graph.instagram.com/'), 'Media publish endpoint uses Instagram Login host https://graph.instagram.com');
  assert(requestedEndpoints[0].includes('/17841400999999/media'), 'Container endpoint includes user ID in path');
  assert(requestedEndpoints[2].includes('/17841400999999/media_publish'), 'Publish endpoint includes user ID in path');
  assert(requestedHeaders.every((h) => h.Authorization === 'Bearer EAAG_dummy_test_token_123'), 'All requests sent Authorization: Bearer token in headers without URL query leakage');

  // --- Test 12: Terminal Errors, Timeouts & HTTP Failures ---
  console.log('\nTest 12: Terminal Errors, Timeouts & HTTP Failures');

  // 12A: Terminal Error from Meta status check
  const mockErrorStatusFetch = async (url) => {
    if (url.includes('fields=status_code')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ status_code: 'ERROR', id: 'mock_cont_err' }),
      };
    }
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'mock_cont_err' }) };
  };

  let caughtError = null;
  try {
    await pollContainerUntilFinished('mock_cont_err', {
      dryRun: false,
      accessToken: 'test_token',
      fetchFn: mockErrorStatusFetch,
    });
  } catch (err) {
    caughtError = err;
  }
  assert(caughtError && caughtError.message.includes('terminal status: ERROR'), 'pollContainerUntilFinished cleanly catches and reports terminal ERROR status');

  // 12B: Polling Timeout
  const mockTimeoutStatusFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ status_code: 'IN_PROGRESS' }),
  });

  let caughtTimeout = null;
  try {
    await pollContainerUntilFinished('mock_cont_timeout', {
      dryRun: false,
      accessToken: 'test_token',
      maxAttempts: 2,
      intervalMs: 10,
      fetchFn: mockTimeoutStatusFetch,
    });
  } catch (err) {
    caughtTimeout = err;
  }
  assert(caughtTimeout && caughtTimeout.message.includes('timed out after 2 status checks'), 'pollContainerUntilFinished bounds retry attempts and halts with timeout error');

  // 12C: Meta HTTP 400 Error
  const mockMetaHttp400Fetch = async () => ({
    ok: false,
    status: 400,
    text: async () => JSON.stringify({ error: { message: 'Image aspect ratio is outside allowed range (4:5 to 1.91:1)' } }),
  });

  let caughtHttpError = null;
  try {
    await createMediaContainer('https://example.com/bad_ratio.jpg', 'caption', {
      dryRun: false,
      userId: '12345',
      accessToken: 'test_token',
      fetchFn: mockMetaHttp400Fetch,
    });
  } catch (err) {
    caughtHttpError = err;
  }
  assert(caughtHttpError && caughtHttpError.message.includes('Image aspect ratio'), 'createMediaContainer parses and conveys Meta HTTP 400 error message');

  // 12D: Missing Configuration
  let caughtMissingCreds = null;
  try {
    await createMediaContainer('https://example.com/sample.jpg', 'caption', {
      dryRun: false,
      userId: '',
      accessToken: '',
    });
  } catch (err) {
    caughtMissingCreds = err;
  }
  assert(caughtMissingCreds && caughtMissingCreds.message.includes('INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN must be configured'), 'Rejects live publishing attempts when INSTAGRAM_USER_ID or INSTAGRAM_ACCESS_TOKEN is missing');

  // 12E: Missing Status Check Access Token
  let caughtMissingStatusToken = null;
  try {
    await checkContainerStatus('mock_cont_123', {
      dryRun: false,
      accessToken: '',
    });
  } catch (err) {
    caughtMissingStatusToken = err;
  }
  assert(caughtMissingStatusToken && caughtMissingStatusToken.message.includes('INSTAGRAM_ACCESS_TOKEN is required'), 'Rejects live status checks when INSTAGRAM_ACCESS_TOKEN is missing');

  // --- Test 13: Duplicate Publish Prevention & Secret Redaction ---
  console.log('\nTest 13: Duplicate Publish Prevention & Secret Redaction');

  // 13A: Duplicate Publish Prevention
  let caughtDuplicate = null;
  try {
    await publishMediaContainer('mock_cont_9001', {
      dryRun: false,
      userId: '12345',
      accessToken: 'test_token',
      fetchFn: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ id: 'dup_post' }) }),
    });
  } catch (err) {
    caughtDuplicate = err;
  }
  assert(caughtDuplicate && caughtDuplicate.message.includes('Duplicate publish prevented'), 'publishMediaContainer refuses to publish an already-published container in the same run');

  // 13B: Secret Redaction
  const rawLeak = 'Error: Failed to fetch with token EAAG_secret_token_123456789 from https://api.com?access_token=EAAG_secret_token_123456789';
  const sanitized = redactSecrets(rawLeak, 'EAAG_secret_token_123456789');
  assert(!sanitized.includes('EAAG_secret_token_123456789'), 'redactSecrets thoroughly removes raw access token');
  assert(sanitized.includes('[REDACTED'), 'redactSecrets injects safe redaction placeholder');

  console.log(`\n📋 Automated Checks: ${testsPassed} of ${testsTotal} passed.`);

  // --- Print 7-Day Editorial Calendar Preview ---
  console.log('\n🗓️ UPCOMING 7-DAY AUTOMATION EDITORIAL CALENDAR:');
  console.log('─'.repeat(72));
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    const sel = selectDailyProduct(products, d);
    const p = sel.product;
    const dateStr = d.toISOString().slice(0, 10);
    console.log(`  Day +${i} (${dateStr}): [${p.category.padEnd(11)}] ${p.name} (₹${p.price.toLocaleString('en-IN')})`);
  }
  console.log('─'.repeat(72));

  // --- Execute Full Today Dry-Run Preview ---
  console.log('\n🚀 EXECUTING COMPLETE TODAY DRY-RUN (@califncowater):');
  await runDailyAutomation({ dryRun: true });

  if (testsPassed === testsTotal) {
    console.log(`✅ Phase 3A Verification Succeeded: All ${testsPassed} checks passed with zero errors.\n`);
  } else {
    console.error('❌ Verification Failed: Some tests did not pass.\n');
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().catch((err) => {
    console.error('Unhandled error in test runner:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
