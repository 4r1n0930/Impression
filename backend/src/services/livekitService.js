import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

class LivekitService {
  async generateToken({
    identity,
    name,
    roomName,
    role,
    livekitApiKey,
    livekitApiSecret,
  }) {
    const token = new AccessToken(
      livekitApiKey || process.env.LIVEKIT_API_KEY,
      livekitApiSecret || process.env.LIVEKIT_API_SECRET,
      { identity, name }
    );

    token.metadata = JSON.stringify({
      role,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await token.toJwt();
  }

  async getInterviewerCount({
    roomName,
    livekitUrl,
    livekitApiKey,
    livekitApiSecret,
  }) {
    try {
      if (!livekitApiKey || !livekitApiSecret) {
        return 0;
      }

      const rawUrl = livekitUrl || process.env.LIVEKIT_URL || "http://localhost:7800";

      const httpUrl = rawUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");

      const roomService = new RoomServiceClient(
        httpUrl,
        livekitApiKey,
        livekitApiSecret
      );

      const participants = await roomService.listParticipants(roomName);
      let count = 0;
      for (const p of participants) {
        try {
          const meta = JSON.parse(p.metadata || "{}");
          if (meta.role === "INTERVIEWER" || meta.role === "interviewer") {
            count++;
          } else if (meta.role !== "INTERVIEWEE" && meta.role !== "interviewee") {
            count++;
          }
        } catch (e) {
          count++;
        }
      }
      return count;
    } catch (err) {
      return 0;
    }
  }
}

export default new LivekitService();