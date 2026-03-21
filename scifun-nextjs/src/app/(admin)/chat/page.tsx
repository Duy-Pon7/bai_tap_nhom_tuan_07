"use client";

import React, { useEffect, useRef, useState } from "react";
import { Client, Frame } from "@stomp/stompjs";
import { getToken, getCurrentUser } from "@/services/authService";

export default function AdminChatPage() {
  const API_BASE = "https://java-app-9trd.onrender.com";
  const WS_URL = "wss://java-app-9trd.onrender.com/ws";

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [status, setStatus] = useState("DISCONNECTED");
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [logs, setLogs] = useState("");

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");

  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);

  const [unread, setUnread] = useState<Record<string, number>>({});

  const stompRef = useRef<any>(null);
  const subRef = useRef<any>(null);
  const roomSubsRef = useRef<Record<string, any>>({});
  const adminIdRef = useRef<string | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => `${prev}[${time}] ${message}\n`);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 50);
  };

  const buildMessage = (message: any) => {
    const isMe = Boolean(adminIdRef.current && message.senderId === adminIdRef.current);
    return {
      ...message,
      isMe,
      displayRole: message.senderRole || (isMe ? "ADMIN" : "USER"),
    };
  };

  const markUnread = (roomId: string) => {
    setUnread((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
  };

  const clearUnread = (roomId: string) => {
    setUnread((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  };

  const disconnect = async (hard = true) => {
    if (disconnecting) return;

    setDisconnecting(true);
    try {
      Object.values(roomSubsRef.current).forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {}
      });
      roomSubsRef.current = {};

      try {
        subRef.current?.unsubscribe();
        subRef.current = null;
      } catch {}

      try {
        await stompRef.current?.deactivate();
      } catch {}

      stompRef.current = null;
      if (hard) {
        setStatus("DISCONNECTED");
        setStatusOk(null);
      }
    } finally {
      setDisconnecting(false);
    }
  };

  const connectWs = async () => {
    if (connecting || disconnecting) return;

    const t = tokenRef.current;
    if (!t) {
      alert("Khong co token, hay dang nhap truoc");
      return;
    }

    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      if (payload.role !== "ADMIN") {
        alert("Tai khoan nay khong phai ADMIN");
        return;
      }
      if (!adminIdRef.current && payload.userId) {
        adminIdRef.current = payload.userId;
      }
    } catch {
      addLog("Khong decode duoc JWT");
      return;
    }

    setConnecting(true);
    await disconnect(false);
    setStatus("CONNECTING...");
    setStatusOk(null);

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${t}` },
      reconnectDelay: 0,
      onConnect: (frame: Frame) => {
        setStatus("CONNECTED");
        setStatusOk(true);
        setConnecting(false);
        addLog("STOMP connected - ADMIN verified");

        const userName = frame?.headers?.["user-name"];
        if (userName) {
          adminIdRef.current = String(userName).trim();
          addLog(`adminId = ${adminIdRef.current}`);
        }

        stompRef.current = client;
      },
      onStompError: (frame: any) => {
        setStatus("STOMP ERROR");
        setStatusOk(false);
        setConnecting(false);
        addLog(`STOMP ERROR: ${frame?.body || JSON.stringify(frame)}`);
      },
      onWebSocketError: () => {
        setStatus("WS ERROR");
        setStatusOk(false);
        setConnecting(false);
        addLog("WS ERROR");
      },
      onWebSocketClose: () => {
        setStatus("WS CLOSED");
        setStatusOk(false);
        setConnecting(false);
        addLog("WS CLOSED");
      },
    });

    client.activate();
  };

  const subscribeRoomNotify = (roomId: string) => {
    if (!stompRef.current?.connected) return;
    if (roomSubsRef.current[roomId]) return;

    roomSubsRef.current[roomId] = stompRef.current.subscribe(`/topic/chat/${roomId}`, (msg: any) => {
      try {
        const nextMessage = JSON.parse(msg.body);
        if (adminIdRef.current && nextMessage.senderId === adminIdRef.current) return;

        if (activeRoomRef.current === roomId) {
          setMessages((prev) => [...prev, buildMessage(nextMessage)]);
          scrollToBottom();
        } else {
          markUnread(roomId);
        }
      } catch {}
    });
  };

  const loadRooms = async () => {
    if (loadingRooms) return;

    const t = tokenRef.current;
    if (!t) return;

    setLoadingRooms(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const json = await res.json();
      const all = Array.isArray(json) ? json : json.items || json.data?.items || [];
      const humanRooms = all.filter((room: any) => !room.type || room.type === "HUMAN");
      setRooms(humanRooms);
      addLog(`Loaded ${humanRooms.length} HUMAN rooms`);

      humanRooms.forEach((room: any) => subscribeRoomNotify(room.id || room._id));
    } catch (error: any) {
      addLog(`loadRooms error: ${error}`);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const t = tokenRef.current;
    if (!t || !conversationId) return;

    setLoadingRoomId(conversationId);
    try {
      const res = await fetch(`${API_BASE}/api/chat/${conversationId}/messages?page=1&limit=50`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : raw.items || raw.data?.items || raw.content || [];
      setMessages(items.map(buildMessage));
      addLog(`Loaded ${items.length} messages`);
      scrollToBottom();
    } catch (error: any) {
      addLog(`loadMessages error: ${error}`);
    } finally {
      setLoadingRoomId((prev) => (prev === conversationId ? null : prev));
    }
  };

  const openRoom = async (id: string) => {
    if (loadingRoomId) return;
    if (!stompRef.current?.connected) {
      alert("Chua connect WS");
      return;
    }

    setActiveRoom(id);
    activeRoomRef.current = id;
    clearUnread(id);
    setMessages([]);
    await loadMessages(id);
  };

  const sendMsg = () => {
    if (!stompRef.current?.connected) return alert("Chua connect WS");
    if (!activeRoom) return alert("Chua chon room");

    const messageText = content.trim();
    if (!messageText) return;

    setMessages((prev) => [
      ...prev,
      buildMessage({
        senderId: adminIdRef.current,
        senderRole: "ADMIN",
        content: messageText,
        createdAt: new Date(),
      }),
    ]);

    setContent("");
    scrollToBottom();

    stompRef.current.publish({
      destination: `/app/chat/${activeRoom}/send`,
      body: JSON.stringify({ content: messageText }),
      headers: { "content-type": "application/json" },
    });
  };

  useEffect(() => {
    const t = getToken();
    tokenRef.current = t;
    setToken(t);

    try {
      setCurrentUser(getCurrentUser());
    } catch {
      setCurrentUser(null);
    }

    return () => {
      void disconnect();
    };
  }, []);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const statusColor = statusOk
    ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
    : statusOk === false
      ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
      : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";

  const roomBusy = loadingRoomId !== null;
  const canSend = Boolean(content.trim()) && Boolean(activeRoom) && Boolean(stompRef.current?.connected);

  return (
    <div className="w-full overflow-x-hidden p-4 text-gray-800 dark:text-gray-100">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Chat Support</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>{status}</span>
        <span className="ml-auto text-sm font-medium text-gray-500 dark:text-gray-400">ADMIN PANEL</span>
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dang nhap voi</div>
            <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {currentUser ? `${currentUser.fullname || currentUser.email || currentUser.id}` : token ? "(token present)" : "Chua dang nhap"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void connectWs()}
              disabled={connecting || disconnecting}
            >
              {connecting ? "Dang ket noi..." : "Connect WS"}
            </button>
            <button
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => void disconnect(true)}
              disabled={disconnecting || connecting}
            >
              {disconnecting ? "Dang ngat ket noi..." : "Disconnect"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => void loadRooms()}
            disabled={loadingRooms || connecting || disconnecting}
          >
            {loadingRooms ? "Dang tai rooms..." : "Load rooms"}
          </button>
          <button
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => activeRoom && void loadMessages(activeRoom)}
            disabled={!activeRoom || roomBusy}
          >
            {activeRoom && loadingRoomId === activeRoom ? "Dang tai room..." : "Reload room hien tai"}
          </button>
        </div>

        <div className="mt-2 font-mono text-xs text-gray-500 dark:text-gray-400">
          Room: <b className="text-blue-600 dark:text-blue-400">{activeRoom ? `${activeRoom.slice(0, 16)}...` : "(chua chon)"}</b>
          &nbsp;|&nbsp; AdminId: <b className="text-blue-600 dark:text-blue-400">{adminIdRef.current || "(chua ro)"}</b>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Danh sach room HUMAN</h3>
            <div className="max-h-[520px] overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800 dark:bg-gray-900/20">
              {rooms.length === 0 ? (
                <div className="p-3 text-sm text-gray-400 dark:text-gray-500">(Chua load)</div>
              ) : (
                rooms.map((room) => {
                  const id = room.id || room._id;
                  const statusText = String(room.status || "").toUpperCase();
                  const unreadCount = unread[id] || 0;
                  const isActive = activeRoom === id;
                  const hasUnread = unreadCount > 0;
                  const isLoadingThisRoom = loadingRoomId === id;

                  return (
                    <div
                      key={id}
                      onClick={() => void openRoom(id)}
                      className={`last:border-b-0 border-b border-gray-100 p-3 transition dark:border-gray-800 ${
                        isLoadingThisRoom ? "cursor-wait opacity-70" : "cursor-pointer"
                      } ${
                        isActive
                          ? "border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-500/15"
                          : hasUnread
                            ? "border-l-4 border-red-500 bg-red-50 dark:bg-red-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`text-sm font-semibold ${hasUnread && !isActive ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-100"}`}>
                          {room.userId || "(no userId)"}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            statusText === "OPEN"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                          }`}
                        >
                          {statusText}
                        </span>
                        {hasUnread && !isActive && (
                          <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 break-all font-mono text-xs text-gray-400 dark:text-gray-500">id: {id}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {room.updatedAt ? new Date(room.updatedAt).toLocaleString() : ""}
                      </div>
                      {isLoadingThisRoom && (
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">Dang tai tin nhan...</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="flex h-[580px] flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Chat</h3>
              {activeRoom && (
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                  {activeRoom.slice(0, 16)}...
                  {loadingRoomId === activeRoom ? " (loading)" : ""}
                </span>
              )}
            </div>

            <div ref={chatBoxRef} className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900/40">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <span>Chon mot room de bat dau</span>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`mb-4 flex max-w-[72%] flex-col ${message.isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div className="mb-1 px-1 font-mono text-xs text-gray-400 dark:text-gray-500">
                      {message.senderRole === "ADMIN" ? "Admin" : "User"}
                      {message.senderId ? ` · ${message.senderId.slice(0, 8)}...` : ""}
                      {message.createdAt ? ` · ${new Date(message.createdAt).toLocaleTimeString()}` : ""}
                    </div>
                    <div
                      className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        message.isMe
                          ? "rounded-br-sm bg-blue-600 text-white"
                          : "rounded-bl-sm border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMsg();
                  }
                }}
                placeholder="Nhap tin nhan... (Enter)"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              />
              <button
                onClick={sendMsg}
                disabled={!canSend || roomBusy}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Gui
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Log</h3>
        <pre className="h-[120px] overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-xs whitespace-pre-wrap break-words text-gray-300 dark:bg-black/40 dark:text-gray-200">
          {logs || "(trong)"}
        </pre>
      </div>
    </div>
  );
}
