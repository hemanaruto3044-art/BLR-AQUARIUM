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
  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'signaling' | 'connecting' | 'connected'>('initializing');
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    console.log(`LiveCall mounting. isHost: ${isHost}, callId: ${callId}`);
    
    let isMounted = true;

    // 1. Get User Media
    const startMedia = async () => {
      try {
        setConnectionStatus('initializing');
        console.log('Requesting media devices...');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported in this browser/context');
        }

        let currentStream: MediaStream;
        try {
          // Attempt 1: High quality + facing mode
          currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: isHost ? 'environment' : 'user'
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (err1) {
          console.warn('Attempt 1 failed, trying Attempt 2...', err1);
          try {
            currentStream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: isHost ? 'environment' : 'user' }, 
              audio: true 
            });
          } catch (err2) {
            console.warn('Attempt 2 failed, trying Attempt 3...', err2);
            currentStream = await navigator.mediaDevices.getUserMedia({ 
              video: true, 
              audio: true 
            });
          }
        }
        
        if (!isMounted) return;

        console.log('Media devices secured');
        setStream(currentStream);
        setConnectionStatus('signaling');

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
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com' },
        ];

        socket.on('connect', () => {
          console.log('Connected to signaling server with ID:', socket.id);
          socket.emit('join-call', callId);
        });

        socket.on('user-joined', (userId) => {
          if (!isMounted) return;
          console.log('Event: user-joined', userId);
          setConnectionStatus('connecting');
          
          // In a 1-on-1, if someone joins, we can initiate
          if (isHost) {
            initiatePeer(userId, currentStream, iceServers);
          } else {
            // If participant joins and sees a host (or anyone), they can say hello
            socket.emit('signal', {
              to: userId,
              type: 'presence' 
            });
          }
        });

        socket.on('signal', (data) => {
          if (!isMounted) return;
          const { from, signal, type } = data;
          console.log('Received signal:', type || 'SDP', 'from:', from);
          
          if (type === 'presence') {
            if (isHost) {
              console.log('Received presence signal, initiating peer to:', from);
              setConnectionStatus('connecting');
              initiatePeer(from, currentStream, iceServers);
            }
            return;
          }

          if (signal) {
            setConnectionStatus('connecting');
            if (peerRef.current && !peerRef.current.destroyed) {
              try {
                peerRef.current.signal(signal);
              } catch (e) {
                console.error('Error signaling existing peer:', e);
              }
            } else if (!isHost) {
              // Participant waits for host to initiate, then accepts
              acceptPeer(from, signal, currentStream, iceServers);
            }
          }
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from signaling server');
          if (isMounted) {
            setConnected(false);
            setConnectionStatus('signaling');
          }
        });

      } catch (err: any) {
        console.error('Failed to initialize call:', err);
        if (!isMounted) return;
        const errorMsg = err.name === 'NotAllowedError' 
          ? 'Camera/Microphone access denied. Please enable permissions.' 
          : err.name === 'NotFoundError'
          ? 'No camera or microphone found.'
          : 'Failed to access camera/microphone. please open in new tab.';
        toast.error(errorMsg);
        onEnd();
      }
    };

    startMedia();

    return () => {
      isMounted = false;
      console.log('LiveCall unmounting. Cleaning up...');
      stream?.getTracks().forEach(track => track.stop());
      socketRef.current?.disconnect();
      peerRef.current?.destroy();
    };
  }, [callId, isHost]);

  // Sync streams to refs (extra safety for React 19)
  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      console.log('Syncing remote stream to video element');
      remoteVideo.current.srcObject = remoteStream;
      if (remoteVideo.current.paused) {
        remoteVideo.current.play().catch(e => console.error('Auto-play blocked:', e));
      }
    }
  }, [remoteStream]);

  const initiatePeer = (userId: string, currentStream: MediaStream, iceServers: any[]) => {
    if (peerRef.current && !peerRef.current.destroyed) return;
    console.log('Creating initiator peer for:', userId);
    
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream: currentStream,
      config: { iceServers }
    });

    peer.on('connect', () => {
      console.log('Peer connected (initiator)');
      setConnected(true);
      setConnectionStatus('connected');
    });

    peer.on('signal', (data) => {
      console.log('Initiator generated signal');
      socketRef.current?.emit('signal', {
        to: userId,
        signal: data
      });
    });

    peer.on('stream', (rStream) => {
      console.log('Initiator received remote stream', rStream.id);
      setRemoteStream(rStream);
    });

    peer.on('error', (err) => {
      console.error('Peer error (initiator):', err);
      if (err.code === 'ERR_ICE_CONNECTION_FAILURE') {
        toast.error('Connection failed. Retrying...');
      }
    });

    peerRef.current = peer;
  };

  const acceptPeer = (userId: string, incomingSignal: any, currentStream: MediaStream, iceServers: any[]) => {
    if (peerRef.current && !peerRef.current.destroyed) return;
    console.log('Creating participant peer to accept signal from:', userId);
    
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream: currentStream,
      config: { iceServers }
    });

    peer.on('connect', () => {
      console.log('Peer connected (participant)');
      setConnected(true);
      setConnectionStatus('connected');
    });

    peer.on('signal', (data) => {
      console.log('Participant generated signal');
      socketRef.current?.emit('signal', {
        to: userId,
        signal: data
      });
    });

    peer.on('stream', (rStream) => {
      console.log('Participant received remote stream', rStream.id);
      setRemoteStream(rStream);
    });

    peer.on('error', (err) => {
      console.error('Peer error (participant):', err);
    });

    try {
      peer.signal(incomingSignal);
    } catch (e) {
      console.error('Initial signal failed:', e);
    }
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
        
        {/* Remote Person Label */}
        {connected && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-zinc-950/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                {isHost ? 'Visitor Connected' : 'Admin Live'}
              </span>
            </div>
          </div>
        )}

        {/* Local Video (Small Bubble) */}
        <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-zinc-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-40 transition-all hover:scale-105 group">
          <video 
            ref={myVideo} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
            <span className="text-[8px] font-bold text-white uppercase">You</span>
          </div>
          {!videoActive && (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-zinc-700" />
            </div>
          )}
        </div>

        {/* Global Connection Overlay */}
        <AnimatePresence>
          {!connected && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-2xl z-50 px-8"
            >
              <div className="relative">
                <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-8 animate-pulse border border-cyan-500/20">
                  <User className="w-12 h-12 text-cyan-400" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-4 border-2 border-cyan-500/20 rounded-full"
                />
              </div>

              <div className="text-center max-w-sm">
                <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-2">
                  {connectionStatus === 'initializing' && 'Booting Systems...'}
                  {connectionStatus === 'signaling' && 'Broadcasting Signal...'}
                  {connectionStatus === 'connecting' && 'Opening Portal...'}
                </h3>
                <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-8">
                  {connectionStatus === 'signaling' && 'Waiting for the other party to join the frequency.'}
                  {connectionStatus === 'connecting' && 'Synchronization in progress. Almost there.'}
                </p>

                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                </div>
              </div>

              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2">
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">
                  Encrypted Bridge ID
                </p>
                <div className="px-4 py-1 bg-white/5 rounded-full border border-white/10 font-mono text-[10px] text-cyan-500/70">
                  {callId}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
