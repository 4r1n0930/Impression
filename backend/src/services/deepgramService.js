import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export function createDeepgramConnection(socket,
  roomName,
  role,
  onTranscript) {
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
    console.log(`Deepgram connected -> ${socket.id}`);

    keepAliveInterval = setInterval(() => {
      connection.keepAlive();
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
  }
  );

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error("Deepgram Error:", err);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log(`Deepgram Closed -> ${socket.id}`);

    clearInterval(keepAliveInterval);
  });

  return connection;
}