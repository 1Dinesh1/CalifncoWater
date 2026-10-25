
/**
 * Califnco Water - Instagram Graph API Publisher
 *
 * Phase 3A Implementation (Instagram Login Architecture):
 * - Standalone client for Meta's Instagram Graph API using Instagram Login.
 * - API Host: https://graph.instagram.com
 * - Credentials: INSTAGRAM_USER_ID & INSTAGRAM_ACCESS_TOKEN (no silent fallback).
 * - Enforces strict URL validation (public HTTPS raster only; rejects SVG and local paths).
 * - Default: dryRun = true. In dry-run mode, zero network calls are made.
 * - Implements 2-step container-create -> poll status -> publish sequence.
 * - Configurable Graph API version via INSTAGRAM_GRAPH_API_VERSION (default: v21.0).
 * - Safe error handling: never leaks or logs access tokens.
 * - Duplicate publish prevention: guards against double-posting in a single run;
 *   never automatically retries uncertain publish calls.
 */

const DEFAULT_API_HOST = 'https://graph.instagram.com';
const DEFAULT_GRAPH_API_VERSION = 'v21.0';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 1500;

// In-memory set tracking published container IDs in the current process to prevent double-posting
const publishedContainers = new Set();

/**
 * Resolve credentials without replacing explicitly supplied empty strings
 * with environment variables. This allows missing-credential tests to work
 * even when real credentials are loaded from .env.
 */
function resolveOptionOrEnv(options, optionName, envName) {
  return options[optionName] !== undefined
    ? options[optionName]
    : process.env[envName];
}

/**
 * Redact sensitive tokens and credentials from any string or error message
 * @param {string} text
 * @param {string} [tokenToMask]
 * @returns {string}
 */
function redactSecrets(text, tokenToMask) {
  if (typeof text !== 'string') {
    text = String(text || '');
  }
  if (tokenToMask && typeof tokenToMask === 'string' && tokenToMask.length > 4) {
    text = text.split(tokenToMask).join('[REDACTED_ACCESS_TOKEN]');
  }
  text = text.replace(/access_token=[a-zA-Z0-9_\-\.]+/gi, 'access_token=[REDACTED]');
  text = text.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
  return text;
}

/**
 * Validate that an image URL is a publicly accessible HTTPS raster URL supported by Meta
 * @param {string} url
 * @returns {{ isValid: boolean, error: string | null, format: string | null }}
 */
function validateImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { isValid: false, error: 'Image URL is required and must be a non-empty string.', format: null };
  }

  const trimmed = url.trim();

  if (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('/') ||
    /^[a-zA-Z]:\\/.test(trimmed) ||
    trimmed.includes('\\')
  ) {
    return {
      isValid: false,
      error: 'Local filesystem paths and file:// schemes are not accessible to Meta servers. Use a public HTTPS URL.',
      format: null,
    };
  }

  if (trimmed.startsWith('http://')) {
    return {
      isValid: false,
      error: 'Insecure HTTP URLs are not supported by Meta Graph API. Use secure HTTPS.',
      format: null,
    };
  }

  if (!trimmed.startsWith('https://')) {
    return {
      isValid: false,
      error: 'Image URL must use secure HTTPS protocol.',
      format: null,
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed URL syntax.', format: null };
  }

  const pathname = parsed.pathname.toLowerCase();
  const formatQuery = (parsed.searchParams.get('format') || parsed.searchParams.get('fm') || '').toLowerCase();

  if (pathname.endsWith('.svg') || formatQuery === 'svg') {
    return {
      isValid: false,
      error: 'SVG format is not supported by Instagram Graph API. Use JPEG or PNG.',
      format: 'svg',
    };
  }

  let detectedFormat = 'jpeg';

  if (pathname.endsWith('.png') || formatQuery === 'png') {
    detectedFormat = 'png';
  } else if (
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    formatQuery === 'jpg' ||
    formatQuery === 'jpeg'
  ) {
    detectedFormat = 'jpeg';
  } else if (pathname.endsWith('.gif') || pathname.endsWith('.webp')) {
    return {
      isValid: false,
      error: 'Animated GIF or WebP formats are not reliably supported by Instagram Single-Photo endpoint. Use JPEG or PNG.',
      format: 'unsupported',
    };
  }

  return { isValid: true, error: null, format: detectedFormat };
}

/**
 * Step 1: Create an Instagram Media Container
 * POST /{ig-user-id}/media
 */
async function createMediaContainer(imageUrl, caption, options = {}) {
  const isDryRun = options.dryRun !== false;

  const validation = validateImageUrl(imageUrl);
  if (!validation.isValid) {
    throw new Error(`Invalid Image URL for Instagram Container: ${validation.error}`);
  }

  if (!caption || typeof caption !== 'string' || caption.trim().length === 0) {
    throw new Error('Caption must be a non-empty string.');
  }

  if (isDryRun) {
    return {
      success: true,
      dryRun: true,
      containerId: 'dry_run_container_simulated_id',
      status: 'IN_PROGRESS',
      format: validation.format,
      message: 'Dry-run: Media container creation simulated successfully without network calls.',
    };
  }

  const apiHost = options.apiHost || process.env.INSTAGRAM_API_HOST || DEFAULT_API_HOST;

  const userId = options.userId !== undefined
    ? options.userId
    : options.accountId !== undefined
      ? options.accountId
      : process.env.INSTAGRAM_USER_ID;

  const accessToken = resolveOptionOrEnv(
    options,
    'accessToken',
    'INSTAGRAM_ACCESS_TOKEN'
  );

  const apiVersion = options.apiVersion || process.env.INSTAGRAM_GRAPH_API_VERSION || process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;

  if (!userId || !accessToken) {
    throw new Error('Missing Instagram credentials. INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN must be configured for live publishing.');
  }

  const endpoint = `${apiHost}/${apiVersion}/${userId}/media`;
  const fetchImpl = options.fetchFn || globalThis.fetch;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();
    let data;

    try {
      data = JSON.parse(responseBody);
    } catch {
      data = { raw: responseBody };
    }

    if (!response.ok || !data.id) {
      const errorMsg = data?.error?.message || responseBody.slice(0, 200);
      throw new Error(`Meta Graph API Container Error (HTTP ${response.status}): ${redactSecrets(errorMsg, accessToken)}`);
    }

    return {
      success: true,
      dryRun: false,
      containerId: data.id,
      apiVersion,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(redactSecrets(err.message, accessToken));
  }
}

/**
 * Step 2: Check Processing Status of a Media Container
 * GET /{container-id}?fields=status_code,status
 */
async function checkContainerStatus(containerId, options = {}) {
  const isDryRun = options.dryRun !== false;

  if (!containerId || typeof containerId !== 'string') {
    throw new Error('Valid containerId is required.');
  }

  if (isDryRun) {
    return {
      success: true,
      dryRun: true,
      containerId,
      statusCode: 'FINISHED',
      message: 'Dry-run: Container status check simulated successfully.',
    };
  }

  const apiHost = options.apiHost || process.env.INSTAGRAM_API_HOST || DEFAULT_API_HOST;

  const accessToken = resolveOptionOrEnv(
    options,
    'accessToken',
    'INSTAGRAM_ACCESS_TOKEN'
  );

  const apiVersion = options.apiVersion || process.env.INSTAGRAM_GRAPH_API_VERSION || process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;

  if (!accessToken) {
    throw new Error('Missing Instagram credentials. INSTAGRAM_ACCESS_TOKEN is required for container status check.');
  }

  const endpoint = `${apiHost}/${apiVersion}/${containerId}?fields=status_code,status`;
  const fetchImpl = options.fetchFn || globalThis.fetch;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || 'Failed to inspect container status.';
      throw new Error(`Instagram Graph API Status Error (HTTP ${response.status}): ${redactSecrets(errorMsg, accessToken)}`);
    }

    const statusCode = data.status_code || data.status || 'UNKNOWN';

    return {
      success: true,
      dryRun: false,
      containerId,
      statusCode,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(redactSecrets(err.message, accessToken));
  }
}

/**
 * Step 2b: Bounded status polling loop
 * Polls container status until FINISHED, ERROR, or timeout
 */
async function pollContainerUntilFinished(containerId, options = {}) {
  const isDryRun = options.dryRun !== false;

  if (isDryRun) {
    return { success: true, dryRun: true, statusCode: 'FINISHED', containerId };
  }

  const maxAttempts = options.maxAttempts || MAX_POLL_ATTEMPTS;
  const intervalMs = options.intervalMs || POLL_INTERVAL_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const statusResult = await checkContainerStatus(containerId, options);

    if (statusResult.statusCode === 'FINISHED') {
      return statusResult;
    }

    if (statusResult.statusCode === 'ERROR' || statusResult.statusCode === 'EXPIRED') {
      throw new Error(`Media container processing failed with terminal status: ${statusResult.statusCode}`);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`Media container processing timed out after ${maxAttempts} status checks.`);
}

/**
 * Step 3: Publish a Finished Media Container
 * POST /{ig-user-id}/media_publish
 */
async function publishMediaContainer(containerId, options = {}) {
  const isDryRun = options.dryRun !== false;

  if (!containerId || typeof containerId !== 'string') {
    throw new Error('Valid containerId is required to publish.');
  }

  if (publishedContainers.has(containerId)) {
    throw new Error(`Duplicate publish prevented: Container ID "${containerId}" has already been published in this run.`);
  }

  if (isDryRun) {
    return {
      success: true,
      dryRun: true,
      published: false,
      containerId,
      mediaId: 'dry_run_media_simulated_id',
      message: 'Dry-run: Media publication simulated successfully. Zero live posts created.',
    };
  }

  const apiHost = options.apiHost || process.env.INSTAGRAM_API_HOST || DEFAULT_API_HOST;

  const userId = options.userId !== undefined
    ? options.userId
    : options.accountId !== undefined
      ? options.accountId
      : process.env.INSTAGRAM_USER_ID;

  const accessToken = resolveOptionOrEnv(
    options,
    'accessToken',
    'INSTAGRAM_ACCESS_TOKEN'
  );

  const apiVersion = options.apiVersion || process.env.INSTAGRAM_GRAPH_API_VERSION || process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;

  if (!userId || !accessToken) {
    throw new Error('Missing Instagram credentials. INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN are required to publish.');
  }

  const endpoint = `${apiHost}/${apiVersion}/${userId}/media_publish`;
  const fetchImpl = options.fetchFn || globalThis.fetch;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        creation_id: containerId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();
    let data;

    try {
      data = JSON.parse(responseBody);
    } catch {
      data = { raw: responseBody };
    }

    if (!response.ok || !data.id) {
      const errorMsg = data?.error?.message || responseBody.slice(0, 200);
      throw new Error(`Instagram Graph API Publish Error (HTTP ${response.status}): ${redactSecrets(errorMsg, accessToken)}`);
    }

    publishedContainers.add(containerId);

    return {
      success: true,
      dryRun: false,
      published: true,
      containerId,
      mediaId: data.id,
      apiVersion,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    const safeMsg = redactSecrets(err.message, accessToken);

    if (err.name === 'AbortError') {
      throw new Error(`Publish request timed out after ${timeoutMs}ms. Automatic retry prevented because publish outcome is uncertain.`);
    }

    throw new Error(safeMsg);
  }
}

/**
 * End-to-end Instagram Post Publishing Pipeline
 */
async function publishInstagramPost(postData, options = {}) {
  const isDryRun = options.dryRun !== false;

  const containerResult = await createMediaContainer(postData.imageUrl, postData.caption, {
    ...options,
    dryRun: isDryRun,
  });

  await pollContainerUntilFinished(containerResult.containerId, {
    ...options,
    dryRun: isDryRun,
  });

  const publishResult = await publishMediaContainer(containerResult.containerId, {
    ...options,
    dryRun: isDryRun,
  });

  return {
    success: true,
    dryRun: isDryRun,
    published: publishResult.published,
    containerId: containerResult.containerId,
    mediaId: publishResult.mediaId,
    format: containerResult.format || 'jpeg',
    message: isDryRun
      ? 'Dry-run: Full publishing sequence validated with zero network calls.'
      : 'Post published successfully to Instagram.',
  };
}

module.exports = {
  validateImageUrl,
  createMediaContainer,
  checkContainerStatus,
  pollContainerUntilFinished,
  publishMediaContainer,
  publishInstagramPost,
  redactSecrets,
  publishedContainers,
  DEFAULT_API_HOST,
  DEFAULT_GRAPH_API_VERSION,
};
