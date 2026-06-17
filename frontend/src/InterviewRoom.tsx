import { useEffect } from "react";
import { Room } from "livekit-client";

import { useLocation } from "react-router-dom";

const location = useLocation();

const { token, roomName, userName } = location.state;

const InterviewRoom = () => {
  useEffect(() => {
    let room: Room;
    const LIVEKIT_URL=import.meta.env.VITE_LIVEKIT_URL;
    const connectToRoom = async () => {
      try {
        
        room = new Room();

        await room.connect(
          LIVEKIT_URL,
          token
        );

        console.log("Connected to room!");

        console.log(
          "Participants:",
          room.remoteParticipants
        );
      } catch (error) {
        console.error(error);
      }
    };

    connectToRoom();

    return () => {
      room?.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Interview Room</h1>
    </div>
  );
};

export default InterviewRoom;