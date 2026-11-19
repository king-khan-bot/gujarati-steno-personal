
export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.GNANI_API_KEY) {
      return Response.json(
        { error: "Gnani API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const text = String(body.text || "").trim();
    const voiceChoice = body.voice === "female" ? "female" : "male";
    const requestedWpm = Number(body.speed || 80);

    if (!text) {
      return Response.json(
        { error: "Please provide Gujarati text." },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return Response.json(
        { error: "Text is too long. Please use a shorter paragraph." },
        { status: 400 }
      );
    }

    if (![60, 80, 90, 110].includes(requestedWpm)) {
      return Response.json(
        { error: "Unsupported speed." },
        { status: 400 }
      );
    }

    const voice = voiceChoice === "female" ? "Rekha" : "Nitin";

    // Initial speed mapping; actual WPM needs audio testing and calibration.
    const speedMap = {
      60: 1.0,
      80: 1.0,
      90: 1.0,
      110: 1.0
    };

    const apiResponse = await fetch(
      "https://api.vachana.ai/api/v1/tts/inference",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key-ID": env.GNANI_API_KEY
        },
        body: JSON.stringify({
          text,
          model: "timbre-v3.0",
          voice,
          language: "gu-IN",
          speed: speedMap[requestedWpm],
          audio_config: {
            sample_rate: 48000,
            num_channels: 1,
            sample_width: 2,
            encoding: "linear_pcm",
            container: "wav"
          }
        })
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();

      return Response.json(
        {
          error: "Gnani TTS request failed.",
          details: errorText.slice(0, 1000)
        },
        { status: apiResponse.status }
      );
    }

    const audio = await apiResponse.arrayBuffer();

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    return Response.json(
      { error: error.message || "Audio generation failed." },
      { status: 500 }
    );
  }
}
