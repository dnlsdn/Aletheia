# PROMPT — Image Analysis Service (Backend 3, port 3003)

Build a new standalone Node.js/Express service on **port 3003** for image analysis. Create it in a new folder called `image-analyzer` at the project root.

---

## What it does

Given an uploaded image, the service performs two independent analyses and returns a single JSON response:

1. **AI Detection** — determines whether the image was artificially generated (AI-created) or is a real photograph, regardless of its content. The LLM must reason visually about artifacts, inconsistencies, unnatural textures, lighting anomalies, or other tell-tale signs of AI generation.

2. **Content Fact-Check** — analyzes what the image depicts and assesses whether the represented information or event is true or false (e.g., a person shown winning a race, a headline visible in the image, a staged scene, etc.).

These two dimensions are **independent**: an AI-generated image can depict something true, and a real photo can depict something false or misleading.

---

## Stack

- Node.js + Express
- `multer` for handling `multipart/form-data` image uploads (store in memory, not disk)
- `axios` for calling the Groq API
- `dotenv` for environment variables
- `cors` enabled
- `GROQ_API_KEY` loaded from `.env`

---

## Endpoint

`POST /api/analyze-image`

- Accepts `multipart/form-data` with a single field `image` (jpg, png, webp, gif)
- Converts the uploaded image buffer to base64
- Sends a single request to the Groq Vision API with this model: `meta-llama/llama-4-scout-17b-16e-instruct`
- The message must include the image as a base64 `image_url` data URI and a carefully crafted system + user prompt (see below)

---

## Groq API call

- Base URL: `https://api.groq.com/openai/v1`
- Endpoint: `POST /chat/completions`
- Auth: `Authorization: Bearer ${process.env.GROQ_API_KEY}`
- Model: `meta-llama/llama-4-scout-17b-16e-instruct`

The message array must be:

```json
[
  {
    "role": "system",
    "content": "You are an expert forensic image analyst and fact-checker. You analyze images on two independent dimensions: (1) whether the image was AI-generated or is a real photograph, and (2) whether the content depicted in the image is factually accurate. You must always respond with a valid JSON object and nothing else."
  },
  {
    "role": "user",
    "content": [
      {
        "type": "image_url",
        "image_url": { "url": "data:{mimeType};base64,{base64data}" }
      },
      {
        "type": "text",
        "text": "Analyze this image on two independent dimensions and respond ONLY with this JSON structure, no markdown, no explanation outside the JSON:\n{\n  \"is_ai_generated\": true | false,\n  \"ai_confidence\": <integer 0-100>,\n  \"ai_reasoning\": \"<brief explanation of visual cues that led to this conclusion>\",\n  \"content_verdict\": \"VERIFIED\" | \"PARTIALLY_TRUE\" | \"INCONCLUSIVE\" | \"MISLEADING\" | \"FALSE\",\n  \"content_confidence\": <integer 0-100>,\n  \"content_summary\": \"<2-3 sentences describing what is depicted and whether it is accurate>\"\n}"
      }
    ]
  }
]
```

Parse the LLM response as JSON. If parsing fails, return a 500 with `{ "error": "Failed to parse model response" }`.

---

## Response format

```json
{
  "is_ai_generated": true,
  "ai_confidence": 91,
  "ai_reasoning": "Skin texture shows characteristic AI smoothing, background bokeh is unnaturally uniform, and finger geometry is slightly distorted.",
  "content_verdict": "VERIFIED",
  "content_confidence": 85,
  "content_summary": "The image depicts Kimi Antonelli on the podium after a Formula 1 race. This is consistent with verified race results. However, the photograph itself appears to be AI-generated and does not represent a real captured moment."
}
```

---

## Test UI

Serve a simple HTML page at `GET /` that allows manual testing directly in the browser:

- A file input to upload an image (preview the image on screen after selection)
- A "Analyze" button that sends the image to `POST /api/analyze-image`
- Display the JSON response formatted in a readable way, with visual highlights:
  - **AI badge**: green "Real Photo" or red "AI Generated" with confidence %
  - **Verdict badge**: colored by verdict type (green = VERIFIED, yellow = PARTIALLY_TRUE, gray = INCONCLUSIVE, orange = MISLEADING, red = FALSE)
  - Full `ai_reasoning` and `content_summary` displayed as readable text

No external CSS frameworks needed — plain inline styles are fine.

---

## Files to create

```
image-analyzer/
  index.js        ← Express server, multer, route handler
  public/
    index.html    ← Test UI
  .env            ← GROQ_API_KEY=your_key_here
  package.json    ← with start script "node index.js" and dev script "npx nodemon index.js"
```

Do not create a `.env.example`. Write the actual `.env` file with `GROQ_API_KEY=` (empty value, user will fill it in).
