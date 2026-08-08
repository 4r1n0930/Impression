import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

export function createDeepgramConnection(socket, roomName, role, onTranscript) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.warn("DEEPGRAM_API_KEY is not set. Deepgram connection skipped.");
      return {
        send: () => {},
        finish: () => {},
      };
    }

    const deepgram = createClient(apiKey);

    const connection = deepgram.listen.live({
      model: "nova-3",
      language: "en",
      smart_format: true,
      punctuate: true,
      interim_results: false,
      encoding: "linear16",
      sample_rate: 16000,
      channels: 1,
    });

    let keepAliveInterval;

    connection.on(LiveTranscriptionEvents.Open, () => {
      keepAliveInterval = setInterval(() => {
        try {
          connection.keepAlive();
        } catch (e) {
          // ignore send error on closed connection
        }
      }, 3000);
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript =
        data.channel?.alternatives?.[0]?.transcript ?? "";

      if (!transcript.trim()) return;

      if (onTranscript) {
        onTranscript({
          roomName,
          role,
          transcript,
        });
      }

      socket.emit("transcript", {
        roomName,
        role,
        transcript,
      });
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error("Deepgram Connection Error:", err);
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    });

    connection.on("error", (err) => {
      console.error("Deepgram Socket Error:", err);
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    });

    return connection;
  } catch (err) {
    console.error("Failed to initialize Deepgram connection:", err);
    return {
      send: () => {},
      finish: () => {},
    };
  }
}