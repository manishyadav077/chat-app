import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import annyang from "annyang";
import "./App.css"

const socket = io("http://localhost:5000");

function App() {
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState("");
  const [userId, setUserId] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => {
      setUserId(socket.id);
    });

    socket.on("private message", ({ content, from }) => {
      setMessages((prevMessages) => [...prevMessages, { content, from }]);
    });

    return () => {
      socket.off("private message");
      socket.off("connect");
    };
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setTranscribedText(""); // Clear previous transcriptions

    // Start video capture
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing webcam: ", error);
        setIsRecording(false); // Stop recording if there's an error
      });

    // Start speech recognition
    if (annyang) {
      const commands = {
        "*text": (text) => {
          setTranscribedText((prev) => prev + " " + text);
          socket.emit("private message", { content: text, to: room });
          setMessages((prevMessages) => [
            ...prevMessages,
            { content: text, from: userId },
          ]); // Add user message
        },
      };
      annyang.addCommands(commands);
      annyang.start({ continuous: true });
    } else {
      alert("Speech recognition not supported in this browser.");
      setIsRecording(false); // Stop recording if not supported
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Stop video capture
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Stop speech recognition
    if (annyang) {
      annyang.abort();
    }
  };

  return (
    <div className="bg-violet-500 w-screen min-h-screen grid sm:grid-cols-2 px-6 rounded-lg overflow-hidden">
      <div className="bg-yellow-300 border-2 border-black p-4 mt-8 h-[20rem] w-full sm:w-3/4 mx-auto rounded-lg">
        <h2 className="text-center">Video</h2>
        <video
          ref={videoRef}
          className="w-full h-full rounded-lg mt-4"
          autoPlay
          muted
        ></video>
      </div>

      <div className="bg-teal-300 border-2 border-black p-4 mt-8 h-[20rem] w-full sm:w-3/4 mx-auto rounded-lg">
        <h2 className="text-center">Live Chat with AI agent</h2>
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.from === userId ? "user-message" : "ai-message"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-5 sm:col-span-1 mb-36">
        <button
          className="border-2 border-black rounded-lg px-4"
          onClick={startRecording}
          disabled={isRecording}
        >
          Start Assessment
        </button>
        <button
          className="border-2 border-black rounded-lg px-4"
          onClick={stopRecording}
          disabled={!isRecording}
        >
          Stop Assessment
        </button>
      </div>
    </div>
  );
}

export default App;
