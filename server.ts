import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Initialize Firebase Admin
  let adminDb: admin.firestore.Firestore | null = null;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount))
      });
      adminDb = admin.firestore();
      console.log("Firebase Admin initialized successfully");

      // Listen for Notifications
      const setupListener = (collectionName: string, title: string, bodyText: string) => {
        adminDb?.collection(collectionName).onSnapshot(snapshot => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              // Prevent notifying on old historical data (if needed)
              const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
              if (createdAt && (Date.now() - createdAt.getTime() > 60000)) return;

              console.log(`New document in ${collectionName}:`, change.doc.id);
              
              // Get Admin Tokens
              const tokensSnapshot = await adminDb?.collection('fcm_tokens').get();
              const tokens = tokensSnapshot?.docs.map(doc => doc.data().token) || [];

              if (tokens.length > 0) {
                const message = {
                  notification: {
                    title: title,
                    body: `${bodyText} from ${data.userName || data.userEmail || 'Customer'}`,
                  },
                  android: {
                   notification: {
                     sound: 'default'
                   }
                  },
                  apns: {
                    payload: {
                      aps: {
                        sound: 'default'
                      }
                    }
                  },
                  tokens: tokens
                };

                try {
                  const responses = await Promise.all(tokens.map(token => 
                    admin.messaging().send({ ...message, token } as any)
                  ));
                  console.log(`${responses.length} messages were sent successfully for ${collectionName}`);
                } catch (error) {
                  console.error("Error sending FCM:", error);
                }
              }
            }
          });
        });
      };

      setupListener('orders', 'New Order! 🐠', 'A new order has been placed');
      setupListener('live_calls', 'Live Viewing Requested! 📹', 'Someone wants to see live fish');
      setupListener('payments', 'New Payment Request! 💰', 'A QR payment needs verification');

    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT not found in environment. Push notifications disabled.");
  }

  // Socket.io Signaling logic
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-call", (callId) => {
      socket.join(callId);
      console.log(`Socket ${socket.id} joined call ${callId}`);
      
      // 1. Notify OTHERS in the room that someone joined
      socket.to(callId).emit("user-joined", socket.id);
      
      // 2. Notify the JOINER about others already in the room
      const room = io.sockets.adapter.rooms.get(callId);
      if (room) {
        for (const clientId of room) {
          if (clientId !== socket.id) {
            console.log(`Notifying joiner ${socket.id} about existing client ${clientId}`);
            socket.emit("user-joined", clientId);
          }
        }
      }
    });

    socket.on("signal", (data) => {
      const { to, signal, ...rest } = data;
      if (!to) return;
      console.log(`Relaying signal from ${socket.id} to ${to}`);
      io.to(to).emit("signal", { ...rest, signal, from: socket.id });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
