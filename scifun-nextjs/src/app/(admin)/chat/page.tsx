"use client";

import React, { useEffect, useRef, useState } from "react";
import { Client, Frame } from "@stomp/stompjs";
import { getToken, getCurrentUser } from "@/services/authService";

export default function AdminChatPage() {
  const API_BASE = "https://java-app-9trd.onrender.com";
  const WS_URL   = "wss://java-app-9trd.onrender.com/ws";

  const [token, setToken]           = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [status, setStatus]         = useState("DISCONNECTED");
  const [statusOk, setStatusOk]     = useState<boolean | null>(null);
  const [logs, setLogs]             = useState("");

  const [rooms, setRooms]           = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages]     = useState<any[]>([]);
  const [content, setContent]       = useState("");

  // unread: { [roomId]: count }
  const [unread, setUnread]         = useState<Record<string, number>>({});

  const stompRef    = useRef<any>(null);
  const subRef      = useRef<any>(null);
  const roomSubsRef = useRef<Record<string, any>>({});  // subscribe tất cả room
  const adminIdRef  = useRef<string | null>(null);
  const activeRoomRef = useRef<string | null>(null);    // ref để dùng trong closure WS
  const chatBoxRef  = useRef<HTMLDivElement>(null);
  const tokenRef    = useRef<string | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────
  const addLog = (m: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs(s => s + `[${t}] ${m}\n`);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current)
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }, 50);
  };

  const buildMessage = (m: any) => {
    const isMe = !!(adminIdRef.current && m.senderId === adminIdRef.current);
    return {
      ...m,
      isMe,
      displayRole: m.senderRole || (isMe ? "ADMIN" : "USER"),
    };
  };

  // ─── Unread ──────────────────────────────────────────────────────────
  const markUnread = (roomId: string) => {
    setUnread(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
  };

  const clearUnread = (roomId: string) => {
    setUnread(prev => { const n = { ...prev }; delete n[roomId]; return n; });
  };

  // ─── Connect ─────────────────────────────────────────────────────────
  const connectWs = () => {
    const t = tokenRef.current;
    if (!t) return alert("Không có token — hãy đăng nhập trước");

    // Check role từ JWT
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      if (payload.role !== "ADMIN") {
        alert("❌ Tài khoản này không phải ADMIN. Truy cập bị từ chối.");
        return;
      }
      if (!adminIdRef.current && payload.userId) {
        adminIdRef.current = payload.userId;
      }
    } catch(e) {
      addLog("⚠️ Không decode được JWT");
    }

    disconnect(false);
    setStatus("CONNECTING…");
    setStatusOk(null);

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: "Bearer " + t },
      reconnectDelay: 0,
      onConnect: (frame: Frame) => {
        setStatus("CONNECTED");
        setStatusOk(true);
        addLog("✅ STOMP connected — ADMIN verified");

        const userName = frame?.headers?.["user-name"];
        if (userName) {
          adminIdRef.current = ("" + userName).trim();
          addLog("ℹ️ adminId = " + adminIdRef.current);
        }

        stompRef.current = client;
      },
      onStompError: (frame: any) => {
        setStatus("STOMP ERROR"); setStatusOk(false);
        addLog("❌ STOMP ERROR: " + (frame?.body || JSON.stringify(frame)));
      },
      onWebSocketError: () => { setStatus("WS ERROR"); setStatusOk(false); addLog("❌ WS ERROR"); },
      onWebSocketClose: () => { setStatus("WS CLOSED"); setStatusOk(false); addLog("❌ WS CLOSED"); },
    });

    client.activate();
  };

  const disconnect = async (hard = true) => {
    // Unsubscribe tất cả room
    Object.values(roomSubsRef.current).forEach(s => { try { s.unsubscribe(); } catch(e) {} });
    roomSubsRef.current = {};
    try { subRef.current?.unsubscribe(); subRef.current = null; } catch(e) {}
    try { await stompRef.current?.deactivate(); } catch(e) {}
    stompRef.current = null;
    if (hard) { setStatus("DISCONNECTED"); setStatusOk(null); }
  };

  // ─── Load rooms ───────────────────────────────────────────────────────
  const loadRooms = async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const res  = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: { Authorization: "Bearer " + t }
      });
      const json = await res.json();
      const all  = Array.isArray(json) ? json : (json.items || json.data?.items || []);
      // Chỉ lấy HUMAN rooms
      const humanRooms = all.filter((r: any) => !r.type || r.type === "HUMAN");
      setRooms(humanRooms);
      addLog(`✅ Loaded ${humanRooms.length} HUMAN rooms`);

      // Subscribe tất cả room để nhận notify
      humanRooms.forEach((r: any) => subscribeRoomNotify(r.id || r._id));
    } catch(e: any) {
      addLog("❌ loadRooms: " + e);
    }
  };

  // Subscribe room để nhận notify kể cả khi chưa mở
  const subscribeRoomNotify = (roomId: string) => {
    if (!stompRef.current?.connected) return;
    if (roomSubsRef.current[roomId]) return; // đã subscribe

    roomSubsRef.current[roomId] = stompRef.current.subscribe(
      `/topic/chat/${roomId}`,
      (msg: any) => {
        try {
          const m = JSON.parse(msg.body);
          if (adminIdRef.current && m.senderId === adminIdRef.current) return;

          if (activeRoomRef.current === roomId) {
            // Room đang mở → render vào chat
            setMessages(arr => [...arr, buildMessage(m)]);
            scrollToBottom();
          } else {
            // Room khác → đánh dấu unread
            markUnread(roomId);
          }
        } catch(e) {}
      }
    );
  };

  // ─── Open room ────────────────────────────────────────────────────────
  const openRoom = async (id: string) => {
    if (!stompRef.current?.connected) return alert("Chưa connect WS");
    setActiveRoom(id);
    activeRoomRef.current = id;
    clearUnread(id);
    setMessages([]);
    await loadMessages(id);
  };

  // ─── Load messages ────────────────────────────────────────────────────
  const loadMessages = async (conversationId: string) => {
    const t = tokenRef.current;
    try {
      const res  = await fetch(
        `${API_BASE}/api/chat/${conversationId}/messages?page=1&limit=50`,
        { headers: { Authorization: "Bearer " + t } }
      );
      const raw  = await res.json();
      const items = Array.isArray(raw) ? raw : (raw.items || raw.data?.items || raw.content || []);
      setMessages(items.map(buildMessage));
      addLog(`✅ Loaded ${items.length} messages`);
      scrollToBottom();
    } catch(e: any) {
      addLog("❌ loadMessages: " + e);
    }
  };

  // ─── Send ─────────────────────────────────────────────────────────────
  const sendMsg = () => {
    if (!stompRef.current?.connected) return alert("Chưa connect WS");
    if (!activeRoom) return alert("Chưa chọn room");
    const c = content.trim();
    if (!c) return;

    // Optimistic
    setMessages(arr => [...arr, buildMessage({
      senderId: adminIdRef.current,
      senderRole: "ADMIN",
      content: c,
      createdAt: new Date(),
    })]);
    setContent("");
    scrollToBottom();

    stompRef.current.publish({
      destination: `/app/chat/${activeRoom}/send`,
      body: JSON.stringify({ content: c }),
      headers: { "content-type": "application/json" },
    });
  };

  // ─── Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = getToken();
    tokenRef.current = t;
    setToken(t);
    try { setCurrentUser(getCurrentUser()); } catch(e) { setCurrentUser(null); }
    return () => { disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync activeRoom vào ref để dùng trong WS closure
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // ─── UI ───────────────────────────────────────────────────────────────
  const statusColor = statusOk
    ? "bg-green-100 text-green-800"
    : statusOk === false
    ? "bg-red-100 text-red-800"
    : "bg-gray-100 text-gray-600";

  return (
    <div className="w-full overflow-x-hidden p-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">⚙ Chat Support</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{status}</span>
        <span className="ml-auto text-sm text-gray-400 font-medium">ADMIN PANEL</span>
      </div>

      {/* Config card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Đăng nhập với</div>
            <div className="text-sm font-medium mt-1">
              {currentUser
                ? `${currentUser.fullname || currentUser.email || currentUser.id}`
                : token ? "(token present)" : "⚠️ Chưa đăng nhập"}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              onClick={connectWs}
            >🔌 Connect WS</button>
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition"
              onClick={() => disconnect(true)}
            >Disconnect</button>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition"
            onClick={loadRooms}
          >📋 Load rooms</button>
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition"
            onClick={() => activeRoom && loadMessages(activeRoom)}
          >🔄 Reload room hiện tại</button>
        </div>

        <div className="text-xs text-gray-500 mt-2 font-mono">
          Room: <b className="text-blue-600">{activeRoom ? activeRoom.slice(0,16) + "…" : "(chưa chọn)"}</b>
          &nbsp;|&nbsp; AdminId: <b className="text-blue-600">{adminIdRef.current || "(chưa rõ)"}</b>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Room list */}
        <div className="col-span-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Danh sách room HUMAN
            </h3>
            <div className="max-h-[520px] overflow-y-auto border border-gray-100 rounded-lg">
              {rooms.length === 0
                ? <div className="p-3 text-sm text-gray-400">(Chưa load)</div>
                : rooms.map(r => {
                    const id  = r.id || r._id;
                    const st  = (r.status || "").toUpperCase();
                    const cnt = unread[id] || 0;
                    const isActive = activeRoom === id;
                    const hasUnread = cnt > 0;

                    return (
                      <div
                        key={id}
                        onClick={() => openRoom(id)}
                        className={`p-3 border-b last:border-b-0 cursor-pointer transition
                          ${isActive
                            ? "bg-blue-50 border-l-4 border-blue-600"
                            : hasUnread
                            ? "bg-red-50 border-l-4 border-red-500"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`font-semibold text-sm ${hasUnread && !isActive ? "text-red-600" : ""}`}>
                            {r.userId || "(no userId)"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold
                            ${st === "OPEN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {st}
                          </span>
                          {/* Unread badge */}
                          {hasUnread && !isActive && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {cnt}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-1 break-all">id: {id}</div>
                        <div className="text-xs text-gray-400">
                          {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="col-span-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[580px]">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Chat</h3>
              {activeRoom && (
                <span className="text-xs text-gray-400 font-mono">{activeRoom.slice(0,16)}…</span>
              )}
            </div>

            {/* Messages */}
            <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                  <span className="text-4xl">👈</span>
                  <span>Chọn một room để bắt đầu</span>
                </div>
              ) : messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col mb-4 max-w-[72%] ${m.isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  <div className="text-xs text-gray-400 font-mono mb-1 px-1">
                    {m.senderRole === "ADMIN" ? "👨‍💼 Admin" : "🙋 User"}
                    {m.senderId ? " · " + m.senderId.slice(0, 8) + "…" : ""}
                    {m.createdAt ? " · " + new Date(m.createdAt).toLocaleTimeString() : ""}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                    ${m.isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendMsg(); } }}
                placeholder="Nhập tin nhắn... (Enter)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
              <button
                onClick={sendMsg}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >Gửi →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Log */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Log</h3>
        <pre className="h-[120px] overflow-auto bg-gray-900 text-gray-300 p-3 rounded-lg text-xs whitespace-pre-wrap break-words font-mono">
          {logs || "(trống)"}
        </pre>
      </div>

    </div>
  );
}