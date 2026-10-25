# Califnco Water — Instagram Product Post Automation

Automated daily Instagram product showcase pipeline for the professional brand account **`@califncowater`**.

---

## 📁 Automation Directory Structure

```
automation/
├── postDailyInstagram.js     # Daily orchestrator and CLI runner (Phase 3A Async)
├── aiCaptionGenerator.js     # AI caption pipeline with configurable providers & local fallback
├── aiImageGenerator.js       # AI image generator (Pollinations/HF/Mock) & stock validator
├── instagramPublisher.js     # Meta Graph API publisher (Safe dry-run, container & publish)
├── testDryRun.js             # Automated 127-check verification suite & preview tool
├── output/                   # Locally saved post review artifacts
│   ├── daily-post-preview.json
│   ├── daily-post-caption.txt
│   └── images/               # Generated AI images (mock/pollinations/huggingface)
└── README.md                 # Setup, architecture & execution guide
```

---

## 🚀 Quick Start: Running the Dry-Run & Verification

The automation runs directly with native Node.js (no new npm packages required).

### 1. Run the Full Test Suite
```bash
node automation/testDryRun.js
```
Runs automated verification checks covering:
- Product catalogue parsing from `src/data/products.js` (all 16 products).
- Deterministic calendar day rotation.
- Real catalogue specification and rating embedding (zero invented specs; no "installations/customers/verified purchases").
- Elimination of duplicate badge text (e.g. `Booster [TASTE BOOST]`).
- Instagram character count compliance (under 2,200 characters).
- Verified public HTTPS image URLs.
- **Unconfigured Provider Defaults**: Caption defaults to `local`, image defaults to `none` (`catalogue_stock`), explicitly notes Unsplash is NOT AI-generated.
- **Configured AI Caption & Fallback**: Tests mock AI caption and verifies graceful fallback to local generator upon API error.
- **Configured AI Image Pipeline**: Tests local image saving, SVG test artifact labeling, and metadata.
- **Image URL Validation**: Tests valid HTTPS JPEG/PNG, and rejection of Windows paths, POSIX paths, `file://`, SVG, HTTP, and malformed URLs.
- **Dry-Run Zero-Network Guarantee**: Proves 0 network requests occur across all publishing steps in dry-run mode.
- **Mocked Instagram Login Publishing Flow**: Verifies 2-step container create on `https://graph.instagram.com/{version}/{user_id}/media`, status polling until `FINISHED`, and `/media_publish` sequence on `https://graph.instagram.com/{version}/{user_id}/media_publish`.
- **Terminal Status & Timeout Handling**: Verifies clean error throwing on `ERROR` status and bounded polling timeout.
- **Duplicate Publish Prevention**: Verifies single-run duplicate guard rejects re-publishing the same container ID.
- **Secret Redaction**: Confirms tokens and keys are thoroughly scrubbed from error messages and logs.

### 2. Run the Daily Orchestrator (Dry-Run Mode)
```bash
# Default dry-run with verified local generator & stock photo
node automation/postDailyInstagram.js --dry-run

# Test with mock AI caption & mock AI image generation
node automation/postDailyInstagram.js --caption-provider=mock --image-provider=mock

# Test specific product or future calendar date
node automation/postDailyInstagram.js --product=pur-01
node automation/postDailyInstagram.js --date=2026-10-26
```

---

## 🤖 AI Provider Configuration & Free-Tier Options

### 1. AI Caption Generation Options

| Provider | Prerequisite / Account | API Key Env Var | Free-Tier Limitations | Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`local`** *(Default)* | **None** | None needed | **Unlimited & $0 cost** | Primary baseline |
| **`gemini`** | Google AI Studio account | `GEMINI_API_KEY` | **15 RPM / 1,500 RPD / 1M TPM** (Free of charge) | Automatic fallback to `local` |
| **`openai`** | OpenAI Platform account | `OPENAI_API_KEY` | Paid credits only (No permanent free tier) | Automatic fallback to `local` |
| **`mock`** | **None** (Test mode) | None needed | Unlimited (Offline verification) | N/A |

---

### 2. AI Image Generation Options (Optional Step)

| Provider | Prerequisite / Account | API Key Env Var | Pricing & Limitations | Output Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`none`** *(Default)* | **None** | None needed | **$0 cost** | Reports `aiImageGenerated: false`, uses Unsplash catalogue stock URL, and explicitly notes it was **not** AI-generated. |
| **`pollinations`** | **None** (Open community) | None needed | **$0 cost** (Community rate limits apply) | Fetches AI product visual from Pollinations.ai and saves to `automation/output/images/`. |
| **`huggingface`** | Hugging Face free account | `HF_TOKEN` | Free community inference credits (FLUX / SDXL) | Generates image via Hugging Face Inference API and saves locally. |
| **`mock`** | **None** (Test mode) | None needed | Generates local SVG test banner | Saves test artifact graphic to `automation/output/images/` clearly labeled as `[TEST ARTIFACT ONLY]`. |

---

## 📡 Meta Instagram Graph API Setup (Instagram Login Flow)

### 1. Authentication Model: Instagram Login for Business
The publisher uses Meta's direct **Instagram Login** architecture:
- Dedicated API host: **`https://graph.instagram.com`**
- Uses an **Instagram User Access Token** generated via the Instagram Login flow (instead of a Facebook Page access token on `graph.facebook.com`).
- Eliminates Facebook Page dependency, communicating directly with Instagram Graph endpoints.

### 2. Dedicated Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `INSTAGRAM_USER_ID` | Numeric Instagram User ID for `@califncowater` | *(Must be configured for live mode)* |
| `INSTAGRAM_ACCESS_TOKEN` | Long-Lived Instagram User Access Token with publishing permissions | *(Must be configured for live mode)* |
| `INSTAGRAM_GRAPH_API_VERSION` | Configurable Graph API version (fallback: `META_GRAPH_API_VERSION`) | `v21.0` (configurable e.g. `v22.0`) |
| `INSTAGRAM_API_HOST` | Configurable API host | `https://graph.instagram.com` |

> ⚠️ **No Silent Fallback**: Live publishing strictly requires `INSTAGRAM_USER_ID` and `INSTAGRAM_ACCESS_TOKEN`. The publisher will intentionally fail rather than silently falling back to unverified Facebook Login credentials.

### 3. Required Instagram Login Permissions
- `instagram_business_basic`
- `instagram_business_content_publish`

### 4. API Endpoints
- **Create Media Container**:
  `POST https://graph.instagram.com/{apiVersion}/{user_id}/media`
  Headers: `Authorization: Bearer {INSTAGRAM_ACCESS_TOKEN}`
  Body: `image_url={public_https_url}&caption={caption_text}`
- **Check Container Processing Status**:
  `GET https://graph.instagram.com/{apiVersion}/{container_id}?fields=status_code,status`
  Headers: `Authorization: Bearer {INSTAGRAM_ACCESS_TOKEN}`
- **Publish Finished Container**:
  `POST https://graph.instagram.com/{apiVersion}/{user_id}/media_publish`
  Headers: `Authorization: Bearer {INSTAGRAM_ACCESS_TOKEN}`
  Body: `creation_id={container_id}`

### 5. Safety & Anti-Duplicate Architecture
1. **Dry-Run by Default (`dryRun: true`)**: All publishing functions default to dry-run mode. Absolutely zero network requests are made unless explicitly configured.
2. **Strict URL Validation**: Only publicly accessible **HTTPS** URLs in supported raster formats (**JPEG, PNG**) are accepted. Local file paths, `file://` schemes, insecure HTTP, and SVG files are rejected.
3. **Duplicate Publish Guard**: An in-memory registry prevents any container ID from being published more than once in a single execution.
4. **No Uncertain Retries**: If a `/media_publish` call times out, the publisher **never automatically retries** to avoid creating duplicate live posts.
5. **Secret Redaction**: Access tokens are transmitted strictly via `Authorization: Bearer` headers (never in query URLs) and scrubbed from all error logs.
