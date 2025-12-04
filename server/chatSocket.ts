import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";
import { log } from "./index";

interface ChatClient {
  ws: WebSocket;
  conversationId?: string;
  isAdmin: boolean;
  userId?: string;
  userName?: string;
}

interface ChatMessage {
  type: "join" | "leave" | "message" | "typing" | "read" | "conversations" | "history" | "error" | "connected";
  conversationId?: string;
  senderType?: "user" | "admin";
  senderName?: string;
  message?: string;
  data?: any;
}

const clients: Map<WebSocket, ChatClient> = new Map();
const conversationClients: Map<string, Set<WebSocket>> = new Map();
const adminClients: Set<WebSocket> = new Set();

export function setupChatWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", (ws: WebSocket) => {
    log("New WebSocket connection", "chat");
    
    clients.set(ws, { ws, isAdmin: false });

    ws.send(JSON.stringify({ type: "connected", message: "Connected to chat server" }));

    ws.on("message", async (data: Buffer) => {
      try {
        const message: ChatMessage = JSON.parse(data.toString());
        const client = clients.get(ws);
        
        if (!client) return;

        switch (message.type) {
          case "join":
            await handleJoin(ws, client, message);
            break;
          case "message":
            await handleMessage(ws, client, message);
            break;
          case "typing":
            handleTyping(ws, client, message);
            break;
          case "read":
            await handleRead(ws, client, message);
            break;
          case "conversations":
            await handleGetConversations(ws, client);
            break;
          case "history":
            await handleGetHistory(ws, client, message);
            break;
        }
      } catch (error) {
        log(`WebSocket error: ${error}`, "chat");
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws);
    });

    ws.on("error", (error) => {
      log(`WebSocket error: ${error}`, "chat");
      handleDisconnect(ws);
    });
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  log("Chat WebSocket server initialized", "chat");
  return wss;
}

async function handleJoin(ws: WebSocket, client: ChatClient, message: ChatMessage) {
  const { conversationId, senderType, senderName } = message;
  
  client.isAdmin = senderType === "admin";
  client.userName = senderName;
  
  if (client.isAdmin) {
    adminClients.add(ws);
    log(`Admin ${senderName} joined chat`, "chat");
    
    const conversations = await storage.getAllChatConversations();
    ws.send(JSON.stringify({ type: "conversations", data: conversations }));
  }
  
  if (conversationId) {
    client.conversationId = conversationId;
    
    if (!conversationClients.has(conversationId)) {
      conversationClients.set(conversationId, new Set());
    }
    conversationClients.get(conversationId)!.add(ws);
    
    log(`Client joined conversation ${conversationId}`, "chat");
    
    const messages = await storage.getChatMessages(conversationId);
    ws.send(JSON.stringify({ type: "history", conversationId, data: messages }));
  }
}

async function handleMessage(ws: WebSocket, client: ChatClient, message: ChatMessage) {
  const { conversationId, senderType, senderName, message: content } = message;
  
  if (!conversationId || !content || !senderType || !senderName) {
    ws.send(JSON.stringify({ type: "error", message: "Missing required fields" }));
    return;
  }
  
  const chatMessage = await storage.createChatMessage({
    conversationId,
    senderType,
    senderName,
    message: content,
    isRead: false,
  });
  
  await storage.updateChatConversation(conversationId, { 
    status: "open",
    updatedAt: new Date() 
  });
  
  const broadcastMessage = {
    type: "message",
    conversationId,
    data: chatMessage,
  };
  
  const clients = conversationClients.get(conversationId);
  if (clients) {
    clients.forEach((clientWs) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(broadcastMessage));
      }
    });
  }
  
  adminClients.forEach((adminWs) => {
    if (adminWs.readyState === WebSocket.OPEN && !clients?.has(adminWs)) {
      adminWs.send(JSON.stringify({
        type: "new_message",
        conversationId,
        data: chatMessage,
      }));
    }
  });
  
  log(`Message sent in conversation ${conversationId}`, "chat");
}

function handleTyping(ws: WebSocket, client: ChatClient, message: ChatMessage) {
  const { conversationId, senderType, senderName } = message;
  
  if (!conversationId) return;
  
  const clients = conversationClients.get(conversationId);
  if (clients) {
    clients.forEach((clientWs) => {
      if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: "typing",
          conversationId,
          senderType,
          senderName,
        }));
      }
    });
  }
}

async function handleRead(ws: WebSocket, client: ChatClient, message: ChatMessage) {
  const { conversationId } = message;
  
  if (!conversationId) return;
  
  await storage.markMessagesAsRead(conversationId, client.isAdmin ? "user" : "admin");
  
  const clients = conversationClients.get(conversationId);
  if (clients) {
    clients.forEach((clientWs) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: "read",
          conversationId,
        }));
      }
    });
  }
}

async function handleGetConversations(ws: WebSocket, client: ChatClient) {
  if (!client.isAdmin) {
    ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
    return;
  }
  
  const conversations = await storage.getAllChatConversations();
  ws.send(JSON.stringify({ type: "conversations", data: conversations }));
}

async function handleGetHistory(ws: WebSocket, client: ChatClient, message: ChatMessage) {
  const { conversationId } = message;
  
  if (!conversationId) return;
  
  const messages = await storage.getChatMessages(conversationId);
  ws.send(JSON.stringify({ type: "history", conversationId, data: messages }));
}

function handleDisconnect(ws: WebSocket) {
  const client = clients.get(ws);
  
  if (client) {
    if (client.conversationId) {
      const convClients = conversationClients.get(client.conversationId);
      if (convClients) {
        convClients.delete(ws);
        if (convClients.size === 0) {
          conversationClients.delete(client.conversationId);
        }
      }
    }
    
    if (client.isAdmin) {
      adminClients.delete(ws);
    }
    
    clients.delete(ws);
    log("Client disconnected from chat", "chat");
  }
}

export function broadcastToConversation(conversationId: string, message: any) {
  const clients = conversationClients.get(conversationId);
  if (clients) {
    const messageStr = JSON.stringify(message);
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

export function broadcastToAdmins(message: any) {
  const messageStr = JSON.stringify(message);
  adminClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}
