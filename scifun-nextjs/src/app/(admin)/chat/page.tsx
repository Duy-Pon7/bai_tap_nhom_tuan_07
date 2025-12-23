"use client";

import React, { useEffect, useRef, useState } from "react";
import { Client, Frame } from "@stomp/stompjs";
import { getToken, getCurrentUser } from "@/services/authService";

export default function AdminChatPage() {
  // UI state
  const [apiBase, setApiBase] = useState("https://java-app-9trd.onrender.com");
  const [wsUrl, setWsUrl] = useState("wss://java-app-9trd.onrender.com/ws");
  const [token, setToken] = useState<string | null>(null);

  const [status, setStatus] = useState("DISCONNECTED");
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string>("");

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");

  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Refs for WS/STOMP objects
  const stompRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const subRef = useRef<any>(null);
  const adminIdRef = useRef<string | null>(null);

  // helpers
  const log = (m: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs((s) => s + `[${t}] ${m}\n`);
    // also console
    // eslint-disable-next-line no-console
    console.log(m);
  };

  const clearChat = () => setMessages([]);

  const appendMessage = (m: any) => {
    const isMe =
      (adminIdRef.current && m.senderId === adminIdRef.current) ||
      (typeof (window as any).myUserId !== "undefined" && (window as any).myUserId && m.senderId === (window as any).myUserId);

    let displayRole = m.senderRole;
    if (!displayRole) displayRole = isMe ? "ADMIN" : "USER";

    const msg = {
      ...m,
      isMe,
      displayRole,
    };

    setMessages((arr) => [...arr, msg]);
  };

  // STOMP connect/disconnect (using @stomp/stompjs Client)
  const connectWs = () => {
    if (!token) return alert("Thiếu JWT");

    disconnect(false);
    setStatus("CONNECTING...");
    setStatusOk(null);

    try {
      const client = new Client({
        brokerURL: wsUrl,
        connectHeaders: { Authorization: "Bearer " + token },
        debug: (msg: string) => log(msg),
        reconnectDelay: 5000,
        onConnect: (frame: Frame) => {
          setStatus("CONNECTED");
          setStatusOk(true);
          log("✅ STOMP CONNECTED");
          log(JSON.stringify(frame?.headers || {}));

          const userName = frame?.headers?.["user-name"];
          if (userName) {
            adminIdRef.current = ("" + userName).trim();
            log("ℹ️ adminId (from frame.headers) = " + adminIdRef.current);
          } else {
            log("⚠️ Không thấy user-name trong STOMP CONNECTED headers");
          }

          stompRef.current = client;
        },
        onStompError: (frame: any) => {
          setStatus("STOMP ERROR");
          setStatusOk(false);
          log("❌ STOMP ERROR: " + (frame && frame.body ? frame.body : JSON.stringify(frame)));
        },
        onWebSocketError: (ev: any) => {
          log("❌ WS ERROR");
          setStatus("WS ERROR");
          setStatusOk(false);
        },
        onWebSocketClose: (ev: any) => {
          log("❌ WS CLOSED");
          setStatus("WS CLOSED");
          setStatusOk(false);
        },
      });

      client.activate();
      // store ws ref for optional low-level access
      wsRef.current = null; // no native ws instance kept here
    } catch (e) {
      log("❌ CONNECT EXCEPTION: " + e);
    }
  };

  const disconnect = async (hard = true) => {
    try {
      if (subRef.current) {
        try { subRef.current.unsubscribe(); } catch(e) {}
        subRef.current = null;
      }
      if (stompRef.current) {
        try {
          await stompRef.current.deactivate();
          log("✅ STOMP DISCONNECTED");
        } catch(e) {
          log("❌ Error while deactivating: " + e);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      wsRef.current = null;
      stompRef.current = null;
      if (hard) {
        setStatus("DISCONNECTED");
        setStatusOk(null);
      }
    }
  };

  // fetch rooms
  const loadRooms = async () => {
    if (!token) return alert("Thiếu JWT");
    const url = `${apiBase.replace(/\/+$/, "")}/api/chat/conversations`;
    log("➡️ loadRooms " + url);

    try {
      const res = await fetch(url, { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
      const text = await res.text();
      log("⬅️ status=" + res.status);
      log("⬅️ body=" + text);
      if (!res.ok) return;
      let json;
      try { json = JSON.parse(text); } catch { log("❌ Response không phải JSON"); return; }
      const rooms = Array.isArray(json) ? json : (json.items || json.data?.items || []);
      setRooms(rooms);
      log(`✅ rooms loaded: ${rooms.length}`);
    } catch (e: any) {
      log("❌ FETCH ERROR (không gọi được API): " + e);
    }
  };

  const openRoom = async (id: string) => {
    if (!stompRef.current || !stompRef.current.connected) {
      alert("Admin chưa connect WS. Bấm Connect WS trước.");
      return;
    }

    setActiveRoom(id);
    clearChat();
    await loadMessages(id);
    switchSubscription(id);
  };

  const loadMessages = async (conversationId: string) => {
    const t = token;
    const url = `${apiBase.replace(/\/+$/, "")}/api/chat/${conversationId}/messages?page=1&limit=50`;
    log("➡️ loadMessages " + url);
    try {
      const res = await fetch(url, { headers: { Authorization: "Bearer " + t, Accept: "application/json" } });
      const text = await res.text();
      log("⬅️ status=" + res.status);
      log("⬅️ body=" + text);
      if (!res.ok) return;
      let payload;
      try { payload = JSON.parse(text); } catch { log("❌ Response messages không phải JSON"); return; }
      const items = Array.isArray(payload) ? payload : (payload.items || payload.data?.items || payload.content || []);
      (items || []).forEach(appendMessage);
      log(`✅ loaded ${(items||[]).length} messages`);
    } catch (e: any) {
      log("❌ FETCH ERROR (messages): " + e);
    }
  };

  const switchSubscription = (conversationId: string) => {
    try {
      if (subRef.current) { try { subRef.current.unsubscribe(); } catch (e) {} subRef.current = null; }
    } catch (e) {}

    const dest = `/topic/chat/${conversationId}`;
    try {
      if (!stompRef.current) throw new Error("No STOMP client");
      subRef.current = stompRef.current.subscribe(dest, (msg: any) => {
        let body;
        try { body = JSON.parse(msg.body); } catch { log("❌ WS msg không phải JSON: " + msg.body); return; }
        if (body.conversationId && body.conversationId !== conversationId) return;
        appendMessage(body);
      });
      log("✅ Subscribed " + dest);
    } catch (e: any) {
      log("❌ SUBSCRIBE ERROR: " + e);
    }
  };

  const sendMsg = () => {
    if (!stompRef.current) return alert("Chưa connect WS");
    if (!activeRoom) return alert("Chưa chọn room");
    const c = content.trim();
    if (!c) return;
    const dest = `/app/chat/${activeRoom}/send`;
    try {
      stompRef.current.publish({ destination: dest, body: JSON.stringify({ content: c }), headers: { "content-type": "application/json" } });
      setContent("");
    } catch(e:any) {
      log("❌ SEND ERROR: " + e);
    }
  };

  const refreshCurrent = async () => {
    if (!activeRoom) return alert("Chưa chọn room");
    clearChat();
    await loadMessages(activeRoom);
  };

  // load token & current user automatically from auth
  useEffect(() => {
    const t = getToken();
    setToken(t);
    try {
      const u = getCurrentUser();
      setCurrentUser(u);
    } catch (e) {
      setCurrentUser(null);
    }

    // cleanup on unmount
    return () => { disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full overflow-x-hidden">

      <h2 className="text-xl font-semibold flex items-center gap-3">
        Chat Support (ADMIN)
        <span className={`px-3 py-1 rounded-full text-sm ${statusOk ? "bg-green-100 text-green-800" : (statusOk===false?"bg-red-100 text-red-800":"bg-gray-100 text-gray-800")}`}>{status}</span>
      </h2>

      <div className="box mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <label className="block text-sm font-medium text-gray-700">API Base URL</label>
        <input className="mt-2 mb-2 p-2 border rounded w-full" value={apiBase} onChange={(e)=>setApiBase(e.target.value)} />

        <label className="block text-sm font-medium text-gray-700">WS URL</label>
        <input className="mt-2 mb-2 p-2 border rounded w-full" value={wsUrl} onChange={(e)=>setWsUrl(e.target.value)} />

        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-gray-700">Authenticated:</div>
            <div className="text-sm font-medium">{currentUser ? `${currentUser.fullname || currentUser.email || currentUser.id}` : (token?"(token present)":"(not authenticated)")}</div>
          </div>

          <div className="ml-auto flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={connectWs}>Connect WS</button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>disconnect(true)}>Disconnect</button>
          </div>
        </div>

        <div className="flex gap-3 mt-3">
          <button className="px-4 py-2 bg-gray-100 rounded" onClick={loadRooms}>Load danh sách room</button>
          <button className="px-4 py-2 bg-gray-100 rounded" onClick={refreshCurrent}>Reload room hiện tại</button>
        </div>

        <div className="text-sm text-gray-600 mt-2">Room đang chọn: <b>{activeRoom || "(chưa chọn)"}</b> &nbsp;|&nbsp; adminId (frame): <b>{adminIdRef.current || "(chưa rõ)"}</b></div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-4">
        <div className="col-span-4">
          <div className="box p-4 bg-white border rounded">
            <h3 className="text-lg font-medium">Danh sách room / user</h3>
            <div className="text-sm text-gray-500">Click một room để mở chat</div>
            <div className="mt-3 max-h-[520px] overflow-y-auto border rounded">
              {rooms.length===0 ? <div className="p-3 text-sm">(Không có room nào)</div> : rooms.map(r => {
                const id = r.id || r._id;
                const status = (r.status || "").toUpperCase();
                const pillClass = status === "OPEN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                return (
                  <div key={id} className={`p-3 border-b last:border-b-0 cursor-pointer break-words ${activeRoom===id?"bg-blue-50 border-l-4 border-blue-600":"hover:bg-gray-50"}`} onClick={()=>openRoom(id)}>
                    <div><b>{r.userId||"(no userId)"}</b> <span className={`px-2 py-0.5 rounded text-xs ${pillClass}`}>{status||"UNKNOWN"}</span></div>
                    <div className="text-xs text-gray-500 break-all">conversationId: {id}</div>
                    <div className="text-xs text-gray-500">updatedAt: {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-8">
          <div className="box p-4 bg-white border rounded flex flex-col h-[500px]">
            <h3 className="text-lg font-medium">Chat</h3>
            <div id="chatBox" className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded mt-2 min-h-0 overflow-x-hidden break-words">
              {messages.map((m, idx) => (
                <div key={idx} className={`max-w-[75%] mb-4 ${m.isMe?"ml-auto text-right":"mr-auto text-left"}`}>
                  <div className="text-xs text-gray-500 mb-1">{m.displayRole}{m.senderId?" • "+m.senderId:""}{m.createdAt?" • "+new Date(m.createdAt).toLocaleString():""}</div>
                  <div className={`inline-block p-3 rounded-lg ${m.isMe?"bg-blue-600 text-white rounded-br-sm":"bg-white border"} break-words whitespace-pre-wrap`}>{m.content}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-3">
              <input value={content} onChange={(e)=>setContent(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Nhập tin nhắn..." onKeyDown={(e)=>{ if (e.key==='Enter') { e.preventDefault(); sendMsg(); } }} />
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={sendMsg}>Gửi</button>
            </div>
          </div>
        </div>
      </div>

      <div className="box mt-4 p-4 bg-white border rounded">
        <h3 className="text-lg font-medium">Log</h3>
        <pre className="mt-2 h-[140px] overflow-auto bg-black text-neutral-200 p-3 rounded whitespace-pre-wrap break-words">{logs}</pre>
      </div>

    </div>
  );
}
