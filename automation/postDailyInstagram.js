
/**
 * Califnco Water - Daily Instagram Post Orchestrator
 *
 * - Selects one product deterministically per UTC calendar day.
 * - Generates captions and optionally prepares AI images.
 * - Uses verified, publicly accessible product-specific HTTPS images.
 * - Keeps the separate Mineral Booster promotional graphic for flt-02.
 * - Saves preview artifacts for review.
 * - Defaults to dry-run; live publishing requires --publish.
 * - If --dry-run and --publish are both supplied, dry-run wins.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load automation/.env without external packages.
const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key && !Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

const { generateCaptionWithAI } = require('./aiCaptionGenerator');
const { generateProductImageAI } = require('./aiImageGenerator');
const { publishInstagramPost } = require('./instagramPublisher');

const TARGET_ACCOUNT = '@califncowater';
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const LOCAL_IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

/**
 * Local image mapping for review and verification.
 */
const LOCAL_PRODUCT_IMAGES = {
  'pur-01': 'pur-01.png',
  'pur-02': 'pur-02.png',
  'pur-03': 'pur-03.png',
  'pur-04': 'pur-04.png',
  'disp-01': 'pur-05.png',
  'disp-02': 'pur-06.png',
  'disp-03': 'pur-07.png',
  'disp-04': 'pur-08.png',
  'flt-01': 'pur-09.png',
  'flt-02': 'pur-10.png',
  'flt-03': 'pur-11.png',
  'flt-04': 'pur-12.png',
  'acc-01': 'pur-13.png',
  'acc-02': 'pur-14.png',
  'acc-03': 'pur-15.png',
  'acc-04': 'pur-16.png',
};

/**
 * Public direct HTTPS images.
 *
 * pur-01 through pur-04: purifier products
 * pur-05 through pur-08: dispenser products
 * pur-09 through pur-12: filter products
 * pur-13 through pur-16: accessory products
 */
const PRODUCT_IMAGE_URLS = {
  'pur-01': 'https://i.ibb.co/nMXzqNxk/pur-01.png',
  'pur-02': 'https://i.ibb.co/ZpSK7CDT/pur-02.png',
  'pur-03': 'https://i.ibb.co/tMJ27HNq/pur-03.png',
  'pur-04': 'https://i.ibb.co/8LV8ZF7r/pur-04.png',

  'disp-01': 'https://i.ibb.co/YFk5r09c/pur-05.png',
  'disp-02': 'https://i.ibb.co/M577LNmY/pur-06.png',
  'disp-03': 'https://i.ibb.co/xtjtPjVY/pur-07.png',
  'disp-04': 'https://i.ibb.co/HpfDNCmn/pur-08.png',

  'flt-01': 'https://i.ibb.co/Qvk3jq6v/pur-09.png',
  'flt-02': 'https://i.ibb.co/W4ZHN3Wp/pur-10.png',
  'flt-03': 'https://i.ibb.co/dw4yhHMS/pur-11.png',
  'flt-04': 'https://i.ibb.co/k24dML0d/pur-12.png',

  'acc-01': 'https://i.ibb.co/fGq8gL4p/pur-13.png',
  'acc-02': 'https://i.ibb.co/kg3rTv32/pur-14.png',
  'acc-03': 'https://i.ibb.co/vxFQQMzK/pur-15.png',
  'acc-04': 'https://i.ibb.co/991gJtwd/pur-16.png',
};

/**
 * Keep the separate branded Mineral Booster graphic for flt-02.
 * This overrides the standard pur-10.png image for that product.
 */
const BRANDED_IMAGE_URLS = {
  'flt-02':
    'https://i.ibb.co/99nt0c71/Califnco-Mineral-Booster-Filter-Ad.png',
};

/**
 * Load PRODUCTS from src/data/products.js.
 */
function loadProducts() {
  const filePath = path.resolve(__dirname, '../src/data/products.js');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Products catalogue file not found at: ${filePath}`);
  }

  const rawCode = fs.readFileSync(filePath, 'utf8');

  const transformed = rawCode
    .replace(/export\s+const\s+/g, 'var ')
    .replace(/export\s+function\s+/g, 'function ');

  const sandbox = {};
  const context = vm.createContext(sandbox);

  vm.runInContext(transformed, context);

  if (!Array.isArray(sandbox.PRODUCTS) || sandbox.PRODUCTS.length === 0) {
    throw new Error(
      'Failed to parse PRODUCTS array from src/data/products.js'
    );
  }

  return sandbox.PRODUCTS;
}

/**
 * Select a product deterministically based on the UTC calendar date.
 */
function selectDailyProduct(products, targetDate = new Date()) {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Products array must be a non-empty array.');
  }

  const dateObj =
    typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    throw new Error(
      `Invalid date provided for daily product selection: ${targetDate}`
    );
  }

  const year = dateObj.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);

  const currentUtc = Date.UTC(
    year,
    dateObj.getUTCMonth(),
    dateObj.getUTCDate()
  );

  const dayOfYear = Math.floor(
    (currentUtc - startOfYear) / (24 * 60 * 60 * 1000)
  );

  const index = dayOfYear % products.length;

  return {
    product: products[index],
    dayOfYear,
    index,
    totalProducts: products.length,
    selectedDate: dateObj.toISOString().slice(0, 10),
  };
}

/**
 * Ensure an output directory exists.
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get and verify the mapped local product image.
 */
function getLocalProductImage(product) {
  const filename = LOCAL_PRODUCT_IMAGES[product.id];

  if (!filename) {
    return {
      filename: null,
      localImagePath: null,
      localImageExists: false,
    };
  }

  const localImagePath = path.join(LOCAL_IMAGES_DIR, filename);

  return {
    filename,
    localImagePath,
    localImageExists:
      fs.existsSync(localImagePath) &&
      fs.statSync(localImagePath).isFile(),
  };
}

/**
 * Select the product-specific hosted image.
 *
 * Priority:
 * 1. Branded promotional graphic, if configured.
 * 2. Product-specific hosted image.
 *
 * No catalogue placeholder image is used as a silent fallback.
 */
function selectProductImage(product) {
  if (!product || typeof product.id !== 'string') {
    throw new Error('A valid product with an ID is required.');
  }

  const localImage = getLocalProductImage(product);
  const brandedUrl = BRANDED_IMAGE_URLS[product.id];
  const productUrl = PRODUCT_IMAGE_URLS[product.id];

  const selectedUrl = brandedUrl || productUrl;

  if (
    typeof selectedUrl !== 'string' ||
    !/^https:\/\/i\.ibb\.co\//i.test(selectedUrl)
  ) {
    throw new Error(
      `No configured hosted product image for product "${product.id}".`
    );
  }

  return {
    url: selectedUrl,
    provider: brandedUrl ? 'branded-graphic' : 'hosted-product-image',
    imageSource: brandedUrl
      ? 'branded_promotional_graphic'
      : 'hosted_product_image',
    aiImageGenerated: false,
    localImageFilename: localImage.filename,
    localImagePath: localImage.localImagePath,
    localImageExists: localImage.localImageExists,
    note: brandedUrl
      ? 'Using the separate branded Mineral Booster graphic. Review the graphic and all claims before publishing.'
      : 'Using the configured product-specific hosted image. Review the image and caption before publishing.',
  };
}

/**
 * Save preview artifacts for review.
 */
function saveArtifacts(postResult) {
  ensureDirectory(OUTPUT_DIR);
  ensureDirectory(LOCAL_IMAGES_DIR);

  const jsonPath = path.join(OUTPUT_DIR, 'daily-post-preview.json');
  const captionPath = path.join(OUTPUT_DIR, 'daily-post-caption.txt');

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(postResult, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    captionPath,
    postResult.fullPostText,
    'utf8'
  );

  return { jsonPath, captionPath };
}

/**
 * Execute the daily automation pipeline.
 *
 * Dry-run is the default. Live publishing requires explicit opt-in.
 */
async function runDailyAutomation(options = {}) {
  const isDryRun = options.dryRun !== false;
  const products = loadProducts();

  let selection;

  if (options.productId) {
    const found = products.find(
      (product) => product.id === options.productId
    );

    if (!found) {
      throw new Error(
        `Product with ID "${options.productId}" not found in catalogue.`
      );
    }

    const dateObj = options.date ? new Date(options.date) : new Date();

    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date provided: ${options.date}`);
    }

    selection = {
      product: found,
      dayOfYear: null,
      index: products.indexOf(found),
      totalProducts: products.length,
      selectedDate: dateObj.toISOString().slice(0, 10),
    };
  } else {
    selection = selectDailyProduct(products, options.date || new Date());
  }

  const product = selection.product;

  // Step 1: Generate the caption.
  const captionData = await generateCaptionWithAI(product, {
    provider: options.captionProvider,
    apiKey: options.captionApiKey,
  });

  // Step 2: Run optional image preparation/generation.
  // Publishing still uses the explicitly configured hosted product image.
  const imageData = await generateProductImageAI(product, {
    provider: options.imageProvider || 'none',
    outputDir: LOCAL_IMAGES_DIR,
    apiKey: options.imageApiKey,
    date: selection.selectedDate,
  });

  // Step 3: Choose the configured hosted image.
  const selectedImage = selectProductImage(product);

  // Step 4: Call the existing publisher in dry-run mode by default.
  const publishOutcome = await publishInstagramPost(
    {
      imageUrl: selectedImage.url,
      caption: captionData.fullPostText,
    },
    {
      dryRun: isDryRun,
      userId: options.userId || options.accountId,
      accessToken: options.accessToken,
      apiVersion: options.apiVersion,
      apiHost: options.apiHost,
    }
  );

  const result = {
    account: TARGET_ACCOUNT,
    mode: isDryRun ? 'DRY_RUN' : 'LIVE_PUBLISH',
    date: selection.selectedDate,
    productIndex: selection.index,
    dayOfYear: selection.dayOfYear,

    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      badge: product.badge,
    },

    caption: {
      text: captionData.caption,
      provider: captionData.provider,
      aiEnhanced: Boolean(captionData.aiEnhanced),
      hashtags: captionData.hashtags,
      hashtagCount: captionData.hashtags.length,
      characterCount: captionData.fullPostText.length,
    },

    image: {
  aiImageGenerated: selectedImage.aiImageGenerated,
  provider: selectedImage.provider,
  imageSource: selectedImage.imageSource,
  catalogueStockUrl: selectedImage.url,
  localImageFilename: selectedImage.localImageFilename,
  localImagePath: selectedImage.localImagePath,
  localImageExists: selectedImage.localImageExists,
  note: selectedImage.note,
  aiPrompt: imageData.aiPrompt || null,
},

imagePreparation: {
  aiImageGenerated: imageData.aiImageGenerated,
  provider: imageData.provider,
  imageSource: imageData.imageSource,
  localImagePath: imageData.localImagePath || null,
  note: imageData.note,
  reason: imageData.reason || null,
},

    publisher: {
      dryRun: publishOutcome.dryRun,
      published: publishOutcome.published === true,
      containerId: publishOutcome.containerId,
      mediaId: publishOutcome.mediaId,
      format: publishOutcome.format,
      message: publishOutcome.message,
    },

    fullPostText: captionData.fullPostText,
    characterCount: captionData.fullPostText.length,
    savedFiles: null,
    published: publishOutcome.published === true,

    status:
      publishOutcome.published === true
        ? 'published'
        : isDryRun
          ? 'dry_run_success'
          : 'publish_not_confirmed',
  };

  if (options.saveFiles !== false) {
    result.savedFiles = saveArtifacts(result);
  }

  if (!options.silent) {
    printPreview(result);
  }

  return result;
}

/**
 * Print the post preview.
 */
function printPreview(postResult) {
  const p = postResult.product;
  const divider = '═'.repeat(64);
  const subDivider = '─'.repeat(64);

  console.log('\n' + divider);
  console.log('CALIFNCO WATER — INSTAGRAM AUTOMATION');
  console.log(`Target Account : ${postResult.account}`);
  console.log(
    `Post Date      : ${postResult.date} (Day ${
      postResult.dayOfYear !== null ? postResult.dayOfYear : 'Manual'
    })`
  );
  console.log(`Execution Mode : ${postResult.mode}`);
  console.log(divider);

  console.log('\nSELECTED CATALOGUE PRODUCT:');
  console.log(`ID       : ${p.id}`);
  console.log(`Name     : ${p.name}`);
  console.log(`Category : ${p.category}`);
  console.log(
    `Price    : ₹${Number(p.price).toLocaleString('en-IN')} ` +
      `(MRP: ₹${Number(p.originalPrice).toLocaleString('en-IN')})`
  );
  console.log(`Rating   : ${p.rating}/5 (${p.reviewsCount} reviews)`);

  if (p.badge) {
    console.log(`Badge    : ${p.badge}`);
  }

  console.log('\nCAPTION:');
  console.log(`Provider   : ${postResult.caption.provider}`);
  console.log(`Characters : ${postResult.caption.characterCount} / 2,200`);
  console.log(`Hashtags   : ${postResult.caption.hashtagCount}`);

  console.log('\nIMAGE SELECTION:');
  console.log(`Provider           : ${postResult.image.provider}`);
  console.log(`Image Source       : ${postResult.image.imageSource}`);
  console.log(`Publishing Image   : ${postResult.image.catalogueStockUrl}`);
  console.log(`Local Image        : ${postResult.image.localImageFilename || 'Not mapped'}`);
  console.log(`Local Image Exists : ${postResult.image.localImageExists}`);
  console.log(`Notice             : ${postResult.image.note}`);

  if (postResult.image.localImagePath) {
    console.log(`Local File Path    : ${postResult.image.localImagePath}`);
  }

  console.log('\nINSTAGRAM CAPTION & HASHTAGS:');
  console.log(subDivider);
  console.log(postResult.fullPostText);
  console.log(subDivider);

  if (postResult.savedFiles) {
    console.log('\nLOCAL REVIEW ARTIFACTS:');
    console.log(`JSON Preview : ${postResult.savedFiles.jsonPath}`);
    console.log(`Caption Text : ${postResult.savedFiles.captionPath}`);
  }

  console.log('\nPUBLISHING STATUS:');

  if (postResult.publisher?.published === true) {
    console.log('Status   : PUBLISHED');
    console.log(`Media ID : ${postResult.publisher.mediaId}`);
  } else if (postResult.publisher?.dryRun === true) {
    console.log('Status   : DRY RUN — no live post was created');
    console.log('Network  : No live Instagram publishing calls made');
  } else {
    console.log('Status   : NOT CONFIRMED');
    console.log(
      `Details  : ${
        postResult.publisher?.message ||
        'Check the publisher result before retrying.'
      }`
    );
  }

  console.log(divider + '\n');
}

// CLI runner.
if (require.main === module) {
  (async () => {
    try {
      const args = process.argv.slice(2);
      const publishRequested = args.includes('--publish');
      const dryRunRequested = args.includes('--dry-run');

      // Safe by default; dry-run overrides --publish.
      const isDryRun = !publishRequested || dryRunRequested;

      if (publishRequested && dryRunRequested) {
        console.log(
          'Both --publish and --dry-run were supplied. Dry-run takes priority.'
        );
      }

      if (isDryRun) {
        console.log(
          'Safe mode: preview/dry-run only. No live Instagram post will be created.'
        );
      } else {
        console.log('LIVE PUBLISH MODE requested via --publish.');
        console.log('The publisher will make live Instagram API requests.');
      }

      const dateArg = args.find((arg) => arg.startsWith('--date='));
      const prodArg = args.find((arg) => arg.startsWith('--product='));
      const capArg = args.find((arg) => arg.startsWith('--caption-provider='));
      const imgArg = args.find((arg) => arg.startsWith('--image-provider='));

      await runDailyAutomation({
        dryRun: isDryRun,
        date: dateArg ? dateArg.slice('--date='.length) : undefined,
        productId: prodArg ? prodArg.slice('--product='.length) : undefined,
        captionProvider: capArg ? capArg.slice('--caption-provider='.length) : undefined,
        imageProvider: imgArg ? imgArg.slice('--image-provider='.length) : undefined,
      });
    } catch (err) {
      console.error(
        'Error executing daily Instagram automation:',
        err.message
      );
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  loadProducts,
  selectDailyProduct,
  selectProductImage,
  getLocalProductImage,
  runDailyAutomation,
  saveArtifacts,
  TARGET_ACCOUNT,
  OUTPUT_DIR,
  LOCAL_IMAGES_DIR,
  LOCAL_PRODUCT_IMAGES,
  PRODUCT_IMAGE_URLS,
  BRANDED_IMAGE_URLS,
};
