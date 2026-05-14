import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface LiveCallProps {
  callId: string;
  isHost: boolean; // Admin is host, User is participant
  onEnd: () => void;
}

const LiveCall: React.FC<LiveCallProps> = ({ callId, isHost, onEnd }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [connected, setConnected] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    console.log(`LiveCall mounting. isHost: ${isHost}, callId: ${callId}`);
    
    // 1. Get User Media
    const startMedia = async () => {
      try {
        console.log('Requesting media devices...');
        const currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: true 
        });
        
        console.log('Media devices secured');
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        // 2. Initialize Socket
        console.log('Connecting to signaling server...');
        const socket = io({
          transports: ['websocket'],
          upgrade: false,
          reconnection: true
        });
        socketRef.current = socket;

        const iceServers = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ];

        socket.on('connect', () => {
          console.log('Connected to signaling server with ID:', socket.id);
          socket.emit('join-call', callId);
        });

        socket.on('user-joined', (userId) => {
          console.log('Event: user-joined', userId);
          if (isHost) {
            console.log('Host detected someone joined. Initiating connection to:', userId);
            initiatePeer(userId, currentStream, iceServers);
          } else {
            // User detected Admin (Host) joined. Send "iam-here" to trigger initiation from Admin
            console.log('Participant detected someone joined. Signaling presence...');
            socket.emit('signal', {
              to: userId,
              from: socket.id,
              type: 'presence' // Custom type to say I am here
            });
          }
        });

        socket.on('signal', (data) => {
          const { from, signal, type } = data;
          
          if (type === 'presence') {
            if (isHost) {
              console.log('Host received presence signal from:', from, '. Initiating connection...');
              initiatePeer(from, currentStream, iceServers);
            }
            return;
          }

          console.log('Received signal from', from);
          if (peerRef.current) {
            peerRef.current.signal(signal);
          } else if (!isHost) {
            console.log('Participant receiving initial signal. Accepting...');
            acceptPeer(from, signal, currentStream, iceServers);
          }
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from signaling server');
          setConnected(false);
        });

      } catch (err) {
        console.error('Failed to initialize call:', err);
        toast.error('Camera/Microphone access denied or failed.');
        onEnd();
      }
    };

    startMedia();

    return () => {
      console.log('LiveCall unmounting. Cleaning up...');
      stream?.getTracks().forEach(track => track.stop());
      socketRef.current?.disconnect();
      peerRef.current?.destroy();
    };
  }, [callId, isHost]);

  const initiatePeer = (userId: string, currentStream: MediaStream, iceServers: any[]) => {
    console.log('Creating initiator peer...');
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
      config: { iceServers }
    });

    peer.on('signal', (data) => {
      console.log('Initiator generated signal, sending to', userId);
      socketRef.current?.emit('signal', {
        to: userId,
        from: socketRef.current.id,
        signal: data
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log('Initiator received remote stream');
      setRemoteStream(remoteStream);
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
      setConnected(true);
    });

    peer.on('error', (err) => {
      console.error('Peer error (initiator):', err);
      toast.error('Connection error occurred');
    });

    peerRef.current = peer;
  };

  const acceptPeer = (userId: string, incomingSignal: any, currentStream: MediaStream, iceServers: any[]) => {
    console.log('Creating participant peer to accept signal from', userId);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream,
      config: { iceServers }
    });

    peer.on('signal', (data) => {
      console.log('Participant generated signal, sending response to', userId);
      socketRef.current?.emit('signal', {
        to: userId,
        from: socketRef.current?.id,
        signal: data
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log('Participant received remote stream');
      setRemoteStream(remoteStream);
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
      setConnected(true);
    });

    peer.on('error', (err) => {
      console.error('Peer error (participant):', err);
      toast.error('Connection error occurred');
    });

    peer.signal(incomingSignal);
    peerRef.current = peer;
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setMicActive(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoActive(videoTrack.enabled);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row items-center justify-center p-4">
      {/* Remote Video (Main) */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
        <video 
          ref={remoteVideo} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        {!connected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-xl">
             <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <User className="w-10 h-10 text-cyan-400" />
             </div>
             <p className="text-white font-black uppercase tracking-widest animate-pulse">
                Establishing Link...
             </p>
          </div>
        )}

        {/* Local Video (Small Bubble) */}
        <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-zinc-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 transition-all hover:scale-105">
          <video 
            ref={myVideo} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
          {!videoActive && (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-zinc-700" />
            </div>
          )}
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-950/50 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl">
          <button 
            onClick={toggleMic}
            className={`p-4 rounded-2xl transition-all ${micActive ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
          >
            {micActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`p-4 rounded-2xl transition-all ${videoActive ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
          >
            {videoActive ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button 
            onClick={onEnd}
            className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-xl shadow-red-600/30 transition-all active:scale-95"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* Info Label */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
           <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
             <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             Live HD Connection
           </p>
        </div>
      </div>
    </div>
  );
};

export default LiveCall;
