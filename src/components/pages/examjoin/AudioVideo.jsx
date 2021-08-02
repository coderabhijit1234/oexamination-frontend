import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import Peer from "simple-peer";
import { getUser } from "../../../utils/localStorage";
import { ExamContextConsumer } from "./context";
import { setCustomAlert, setErrorAlert } from "../../../redux/actions/alert";
import { useDispatch } from "react-redux";
import tone from "../../../assets/alertTone.mp3";

const AudioVideo = ({ active }) => {
  const { currentExam } = useSelector((state) => state.exam);
  const dispatch = useDispatch();
  const { UpdatePeer, getWarn, exitExam, setVideoPermission } =
    ExamContextConsumer();
  const socketRef = useRef();
  const userVideo = useRef();
  const currentPeer = useRef();
  useEffect(() => {
    if (!Peer.WEBRTC_SUPPORT) {
      dispatch(
        setErrorAlert(
          "You browser doesn't support video streaming. Try another browser"
        )
      );
      setVideoPermission(false);
    }
    socketRef.current = io.connect(String(process.env.REACT_APP_SOCKET_URL));
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { max: 352 },
          height: { max: 240 },
          frameRate: { ideal: 10, max: 15 },
        },
        audio: true,
      })
      .then((stream) => {
        userVideo.current.srcObject = stream;

        let user = getUser().user;
        user.type = "candidate";
        socketRef.current.emit("join_room", {
          user,
          examid: currentExam._id,
        });
        socketRef.current.emit("new_join");

        socketRef.current.on("receive_signal", async (payload) => {
          currentPeer.current = await callReceiver(
            payload.to,
            payload.from,
            JSON.parse(payload.signal),
            stream
          );

          UpdatePeer(currentPeer.current);
        });
      })
      .catch((err) => {
        setVideoPermission(false);
        dispatch(setErrorAlert(err.message));
      });
    return () => {
      socketRef.current.disconnect();
    };
  }, [currentExam, dispatch]);

  function playAudio() {
    var audio = new Audio(tone);
    audio.play();
  }

  const callReceiver = async (to, from, signal, stream) => {
    const peer = new Peer({
      initiator: false,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
          {
            url: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
          },
          {
            url: "turn:192.158.29.39:3478?transport=udp",
            credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
            username: "28224511:1379330808",
          },
          {
            url: "turn:192.158.29.39:3478?transport=tcp",
            credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
            username: "28224511:1379330808",
          },
          {
            url: "turn:turn.bistri.com:80",
            credential: "homeo",
            username: "homeo",
          },
          {
            url: "turn:turn.anyfirewall.com:443?transport=tcp",
            credential: "webrtc",
            username: "webrtc",
          },
          {
            urls: ["turn:13.250.13.83:3478?transport=udp"],
            username: "YzYNCouZM1mhqhmseWk6",
            credential: "YzYNCouZM1mhqhmseWk6",
          },
        ],
      },
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("send_signal", {
        to: from,
        from: to,
        signal: JSON.stringify(signal),
        warn: getWarn().toString(),
      });
    });

    peer.signal(signal);
    peer.on("data", (data) => {
      if (`${data}` === "TERMINATE") {
        exitExam("Malpractice");
        currentPeer.current.destroy();
      } else {
        playAudio();
        dispatch(setCustomAlert(`Message: ${data}`, "info", 10000));
      }
    });

    return peer;
  };

  return (
    <video
      style={{
        position: "absolute",
        bottom: active ? "80px" : "10px",
        right: active ? "40px" : "10px",
      }}
      ref={userVideo}
      height="150px"
      muted
      autoPlay
      playsInline
      id="video"
    />
  );
};

export default AudioVideo;
