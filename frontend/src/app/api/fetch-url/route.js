export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { url } = body;

  if (!url || typeof url !== 'string' || !/^https?:\/\/.+/i.test(url.trim())) {
    return Response.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(url.trim(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    return Response.json(
      { error: 'Could not reach the URL. Check your connection or paste the text directly.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const status = response.status;
    if (status === 401 || status === 403) {
      return Response.json(
        { error: 'This article is behind a paywall or access is restricted. Please paste the text directly.' },
        { status: 422 }
      );
    }
    if (status === 404) {
      return Response.json(
        { error: 'Page not found. Check the URL and try again.' },
        { status: 422 }
      );
    }
    if (status === 429) {
      return Response.json(
        { error: 'The website is blocking automated requests. Please paste the text directly.' },
        { status: 422 }
      );
    }
    if (status >= 500) {
      return Response.json(
        { error: 'The website returned a server error. Please try again or paste the text directly.' },
        { status: 422 }
      );
    }
    return Response.json(
      { error: 'Could not fetch the page. Please paste the text directly.' },
      { status: 422 }
    );
  }

  let html;
  try {
    html = await response.text();
  } catch {
    return Response.json(
      { error: 'Could not read the page content. Please paste the text directly.' },
      { status: 502 }
    );
  }

  // Remove script, style, nav, header, footer, aside blocks (including content)
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length < 100) {
    return Response.json(
      { error: 'Could not extract readable content from this page. Please paste the text directly.' },
      { status: 400 }
    );
  }

  text = text.slice(0, 3000);

  return Response.json({ text });
}
