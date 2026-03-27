export async function POST(request) {
  const { text, voiceId } = await request.json();

  if (!text || text.trim().length === 0) {
    return Response.json({ error: 'text is required' }, { status: 400 });
  }

  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'pNInz6obpgDQGcFmaJgB'}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!elevenLabsResponse.ok) {
    return Response.json({ error: 'ElevenLabs API error' }, { status: 502 });
  }

  const audioBuffer = await elevenLabsResponse.arrayBuffer();
  return new Response(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
