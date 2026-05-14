import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Peer } from 'peerjs';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface LiveCallProps {
  callId: string;
  isHost: boolean;
  onEnd: () => void;
}

const LiveCall: React.FC<LiveCallProps> = ({ callId, isHost, onEnd }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [webcamOn, setWebcamOn] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [statusLog, setStatusLog] = useState<string>("Initializing...");
  const [targetId, setTargetId] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const handleStream = (call: any) => {
    call.on('stream', (remoteMediaStream: MediaStream) => {
      console.log("Remote stream received");
      setRemoteStream(remoteMediaStream);
      setConnected(true);
      setStatusLog("HD Link Established");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteMediaStream;
      }
    });

    call.on('close', () => {
      console.log("Call closed");
      setConnected(false);
      onEnd();
    });

    call.on('error', (err: any) => {
      console.error("Call stream error:", err);
      setConnected(false);
    });
  };

  useEffect(() => {
    let currentPeer: Peer | null = null;
    let currentStream: MediaStream | null = null;
    let unsubscribeSync: (() => void) | null = null;

    const initMedia = async () => {
      try {
        setStatusLog("Accessing Media...");
        let stream: MediaStream;
        
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: isHost ? "environment" : "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaErr: any) {
          console.warn("Initial media access failed, trying fallback:", mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (secondErr: any) {
            console.warn("Second media access failed, trying video only:", secondErr);
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setMicOn(false);
            setErrorStatus("Microphone restricted. Video only enabled.");
          }
        }

        setLocalStream(stream);
        currentStream = stream;
        setupPeer(stream);
      } catch (err: any) {
        console.error("Media access error:", err);
        setErrorStatus(`Hardware Error: ${err.message || 'Permission Denied'}`);
      }
    };

    const setupPeer = (stream: MediaStream) => {
      setStatusLog("Connecting to Peer Network...");
      
      const newPeer = new Peer();
      currentPeer = newPeer;
      setPeer(newPeer);

      newPeer.on('open', (id) => {
        console.log('Peer registered as:', id);
        setStatusLog("Signal Active. Waiting for Peer...");
        
        const callRef = doc(db, 'live_calls', callId);
        const peerField = isHost ? 'hostPeerId' : 'visitorPeerId';
        const targetField = isHost ? 'visitorPeerId' : 'hostPeerId';

        updateDoc(callRef, { [peerField]: id }).catch(err => {
          console.error("ID Sync Fail:", err);
          setStatusLog("Sync Error.");
        });

        unsubscribeSync = onSnapshot(callRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const remoteId = data[targetField];
            if (remoteId && remoteId !== targetId) {
              setTargetId(remoteId);
            }
          }
        });
      });

      newPeer.on('call', (incomingCall) => {
        console.log("Receiving incoming call...");
        setStatusLog("Connecting Stream...");
        incomingCall.answer(stream);
        handleStream(incomingCall);
      });

      newPeer.on('error', (err) => {
        console.error("Peer error:", err);
        if (err.type === 'peer-unavailable') {
          setStatusLog("Waiting for participant...");
        } else if (err.type === 'unavailable-id') {
          setStatusLog("ID conflict. Re-connecting...");
          setTimeout(() => {
            if (newPeer && !newPeer.destroyed) {
              setupPeer(stream);
            }
          }, 1000);
        } else {
          setStatusLog(`Link Error: ${err.type}`);
        }
      });
    };

    initMedia();

    return () => {
      if (currentStream) currentStream.getTracks().forEach(t => t.stop());
      if (currentPeer) currentPeer.destroy();
      if (unsubscribeSync) unsubscribeSync();
    };
  }, [callId, isHost]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isHost && targetId && !connected && peer && !peer.destroyed && localStream) {
      const attemptCall = () => {
        if (connected) return;
        setStatusLog("Initiating Secure Call...");
        const call = peer.call(targetId, localStream);
        if (call) {
          handleStream(call);
        }
      };

      attemptCall();
      interval = setInterval(attemptCall, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHost, targetId, connected, peer, localStream]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleWebcam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setWebcamOn(videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleLeave = () => {
    onEnd();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center p-0 md:p-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="relative w-full h-[100dvh] md:h-full md:aspect-video bg-zinc-950 md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        
        {/* Remote Video (Main Background) */}
        <div className="w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn("w-full h-full object-cover", !connected && "hidden")}
          />
          {!connected && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-zinc-950">
               <motion.div 
                 animate={{ 
                   scale: [1, 1.1, 1],
                   opacity: [0.3, 0.5, 0.3]
                 }}
                 transition={{ duration: 4, repeat: Infinity }}
                 className="w-40 h-40 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center"
               >
                 <User className="w-16 h-16 text-zinc-800" />
               </motion.div>
               <div className="text-center">
                 <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.4em] mb-2">Syncing Signal</p>
                 <p className="text-zinc-800 text-[10px] font-mono">{callId}</p>
               </div>
            </div>
          )}
        </div>
        
        {/* Connection Quality / Status Overlay (Top Left) */}
        <div className="absolute top-6 left-6 z-50">
          <div className="flex flex-col gap-2">
            <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white uppercase tracking-wider">
                  {connected ? 'Realtime Link' : 'Establishing Link'}
                </span>
                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{statusLog}</span>
              </div>
            </div>
            
            {errorStatus && (
              <div className="bg-red-500/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-red-500/20 text-[9px] font-bold text-red-400 uppercase tracking-widest">
                {errorStatus}
              </div>
            )}
          </div>
        </div>

        {/* Local Video Overlay (Mini Window) */}
        <div className="absolute bottom-40 md:bottom-24 right-6 w-28 md:w-44 aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-[60] transition-all hover:scale-105">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cn("w-full h-full object-cover", !webcamOn && "hidden")}
          />
          {!webcamOn && (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
               <User className="w-8 h-8 text-zinc-700" />
            </div>
          )}
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 z-10 text-white font-mono text-[8px] uppercase">
             You
          </div>
        </div>

        {/* Loading / Waiting UI */}
        <AnimatePresence>
          {!connected && !errorStatus && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-3xl z-[45]"
            >
              <div className="relative mb-12">
                <div className="w-28 h-28 bg-cyan-500/5 rounded-full flex items-center justify-center border border-cyan-500/20">
                  <VideoIcon className="w-10 h-10 text-cyan-500 animate-pulse" />
                </div>
                <div className="absolute -inset-6 border border-cyan-500/10 rounded-full animate-[ping_3s_infinite]" />
              </div>

              <div className="text-center px-12">
                  <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-3 italic">
                    {isHost ? 'Establishing Link' : 'Connecting to Host'}
                  </h3>
                  <p className="text-zinc-500 text-[11px] font-medium leading-relaxed max-w-[240px] mx-auto uppercase tracking-wider mb-8">
                    {isHost 
                      ? 'DIRECT PEER-TO-PEER ENCRYPTION ACTIVE. THE STREAM WILL AUTOMATICALLY BEGIN ONCE VISITOR ACCEPTS.'
                      : 'WAITING FOR SECURE HANDSHAKE FROM THE ADMIN TERMINAL. PLEASE KEEP THIS WINDOW OPEN.'
                    }
                  </p>
                <div className="flex items-center justify-center gap-2 text-cyan-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{statusLog}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Controls */}
        <div className="absolute bottom-12 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[92%] md:w-auto">
          <div className="bg-zinc-900/90 backdrop-blur-3xl p-4 md:p-5 rounded-[2.5rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between md:justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-4 md:gap-5">
              <button 
                onClick={toggleMic}
                className={cn(
                  "p-5 md:p-6 rounded-2xl transition-all active:scale-90 flex items-center justify-center",
                  micOn ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                )}
              >
                 {micOn ? <Mic className="w-6 h-6 md:w-7 md:h-7" /> : <MicOff className="w-6 h-6 md:w-7 md:h-7" />}
              </button>
              
              <button 
                onClick={toggleWebcam}
                className={cn(
                  "p-5 md:p-6 rounded-2xl transition-all active:scale-90 flex items-center justify-center",
                  webcamOn ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                )}
              >
                {webcamOn ? <VideoIcon className="w-6 h-6 md:w-7 md:h-7" /> : <VideoOff className="w-6 h-6 md:w-7 md:h-7" />}
              </button>
            </div>

            <button 
              onClick={handleLeave}
              className="px-8 md:px-12 py-5 md:py-6 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-2xl shadow-red-600/40 transition-all active:scale-95 group flex items-center gap-3 border border-red-500/50"
            >
              <PhoneOff className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline text-[11px] font-black uppercase tracking-[0.2em]">End Call</span>
            </button>
          </div>
        </div>

        {/* Context Label */}
        <div className="absolute top-8 right-6 hidden md:block">
           <div className="bg-sky-500/10 backdrop-blur-md px-6 py-2 rounded-full border border-sky-500/20">
              <p className="text-[9px] font-black text-sky-400 uppercase tracking-[0.3em] flex items-center gap-2">
                {isHost ? 'Admin Terminal' : 'Customer View'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCall;
