"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Circle, Radio, Users } from "lucide-react";

type Event = {
  type: "message" | "typing" | "presence";
  user?: string;
  message?: string;
  online?: number;
};
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8080/api/v1/realtime";

export default function RealtimePage() {
  const [name] = useState(
    () => `Guest-${Math.floor(Math.random() * 900 + 100)}`,
  );
  const [room, setRoom] = useState("lobby");
  const [draft, setDraft] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [online, setOnline] = useState(0);
  const [status, setStatus] = useState<"connecting" | "live" | "retrying">(
    "connecting",
  );
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;
    let retry: ReturnType<typeof setTimeout>;
    function connect() {
      setStatus(socketRef.current ? "retrying" : "connecting");
      const socket = new WebSocket(
        `${WS_URL}/rooms/${encodeURIComponent(room)}/connect?user=${encodeURIComponent(name)}`,
      );
      socketRef.current = socket;
      socket.onopen = () => setStatus("live");
      socket.onmessage = (message) => {
        const event = JSON.parse(message.data) as Event;
        if (event.type === "presence") setOnline(event.online ?? 0);
        setEvents((current) => [...current.slice(-80), event]);
      };
      socket.onclose = () => {
        if (!disposed) {
          setStatus("retrying");
          retry = setTimeout(connect, 1200);
        }
      };
    }
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      socketRef.current?.close();
    };
  }, [name, room]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    socketRef.current?.send(draft.trim());
    setDraft("");
  }

  return (
    <main className="grid min-h-dvh bg-[#eceee8] p-4 text-[#15201c] md:p-8">
      <div className="mx-auto grid h-[calc(100dvh-2rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_80px_rgba(20,35,29,.12)] md:h-[calc(100dvh-4rem)] lg:grid-cols-[280px_1fr]">
        <aside className="hidden bg-[#17231e] p-7 text-white lg:flex lg:flex-col">
          <Radio className="text-[#d9f391]" />
          <h1 className="mt-5 text-3xl font-semibold tracking-[-.05em]">
            Relay
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Realtime rooms without the mystery.
          </p>
          <label className="mt-10 text-xs text-white/45">
            Room
            <input
              className="mt-2 w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-white outline-none"
              value={room}
              onChange={(event) => setRoom(event.target.value || "lobby")}
            />
          </label>
          <div className="mt-auto flex items-center justify-between rounded-2xl bg-white/7 p-4 text-xs">
            <span className="flex items-center gap-2">
              <Circle className="h-2.5 w-2.5 fill-[#9adb79] text-[#9adb79]" />
              {status}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {online}
            </span>
          </div>
        </aside>
        <section className="flex min-h-0 flex-col p-5 md:p-8">
          <header className="flex items-center justify-between border-b border-black/7 pb-5">
            <div>
              <p className="text-xs text-black/35">Room</p>
              <h2 className="text-xl font-semibold">#{room}</h2>
            </div>
            <span className="rounded-full bg-[#edf5d7] px-3 py-2 text-xs font-medium">
              {name}
            </span>
          </header>
          <div className="flex-1 space-y-4 overflow-auto py-6">
            {events.filter((event) => event.type === "message").length === 0 ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <h3 className="text-4xl font-semibold tracking-[-.05em]">
                    Start the room.
                  </h3>
                  <p className="mt-2 text-sm text-black/40">
                    Messages, presence, typing, and reconnect are wired.
                  </p>
                </div>
              </div>
            ) : (
              events
                .filter((event) => event.type === "message")
                .map((event, index) => (
                  <article className="max-w-xl" key={index}>
                    <p className="mb-1 text-xs font-semibold text-black/40">
                      {event.user}
                    </p>
                    <p className="rounded-2xl bg-[#f0f2ec] px-4 py-3 text-sm">
                      {event.message}
                    </p>
                  </article>
                ))
            )}
          </div>
          <form className="flex rounded-2xl bg-[#eef0ea] p-2" onSubmit={submit}>
            <input
              className="min-w-0 flex-1 bg-transparent px-3 outline-none"
              placeholder="Message the room…"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                socketRef.current?.send(
                  `typing:${event.target.value ? "start" : "stop"}`,
                );
              }}
            />
            <button className="grid h-11 w-11 place-items-center rounded-xl bg-[#17231e] text-white">
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
