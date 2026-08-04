import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

class LivekitService {
  async generateToken({ identity, name, roomName, role }) {
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return "";
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
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

  async getInterviewerCount(roomName) {
    try {
      if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
        return 0;
      }
      const rawUrl = process.env.LIVEKIT_URL || "http://localhost:7800";
      const httpUrl = rawUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
      const roomService = new RoomServiceClient(
        httpUrl,
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
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
