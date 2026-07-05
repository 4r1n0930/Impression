import { AccessToken } from "livekit-server-sdk";

class LivekitService {
  async generateToken({ identity, name, roomName }) {
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity, name }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await token.toJwt();
  }
}

export default new LivekitService();
