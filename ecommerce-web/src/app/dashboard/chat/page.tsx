"use client";

import * as React from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "atelier-dashboard-chats";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function loadChats(): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Chat[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function createChat(title = "New chat"): Chat {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createAssistantMessage(content: string): Message {
  return {
    id: generateId(),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}

function ensureWelcomeChat(): Chat[] {
  const loaded = loadChats();
  if (loaded.length > 0) return loaded;
  const welcome = createChat("Welcome");
  welcome.messages.push(
    createAssistantMessage(
      "Hi! This is your dashboard chat. Create a new chat from the sidebar to start a conversation."
    )
  );
  welcome.updatedAt = new Date().toISOString();
  saveChats([welcome]);
  return [welcome];
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ChatPage() {
  const isClient = useIsClient();
  const [chats, setChats] = useState<Chat[]>(() =>
    typeof window === "undefined" ? [] : ensureWelcomeChat()
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : ensureWelcomeChat()[0]?.id ?? null
  );
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, activeChatId]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) || null,
    [chats, activeChatId]
  );

  function handleNewChat() {
    const chat = createChat(`Chat ${chats.length + 1}`);
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !activeChatId) return;

    const text = input.trim();
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setInput("");

    const currentChatId = activeChatId;
    setChats((prev) => {
      const next = prev.map((chat) => {
        if (chat.id !== currentChatId) return chat;
        return {
          ...chat,
          messages: [...chat.messages, userMessage],
          title: chat.title === "New chat" ? text.slice(0, 40) : chat.title,
          updatedAt: userMessage.createdAt,
        };
      });

      setTimeout(() => {
        const assistantMsg = createAssistantMessage(
          "Thanks for your message. This is a UI-only chat; connect an AI provider to get real replies."
        );
        setChats((current) =>
          current.map((chat) => {
            if (chat.id !== currentChatId) return chat;
            return {
              ...chat,
              messages: [...chat.messages, assistantMsg],
              updatedAt: assistantMsg.createdAt,
            };
          })
        );
      }, 600);

      return next;
    });
  }

  function handleDeleteChat(id: string) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  function startRename(chat: Chat) {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  }

  function confirmRename(id: string) {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
    );
    setEditingId(null);
  }

  if (!isClient) {
    return (
      <div className="mx-auto w-full max-w-[1380px]">
        <div className="mb-7 flex items-center justify-between">
          <h1 className="a-h1">Chat</h1>
        </div>
        <div className="a-card h-[calc(100vh-180px)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1380px]">
      <div className="mb-7 flex items-center justify-between">
        <h1 className="a-h1">Chat</h1>
      </div>

      <div
        className="a-card flex overflow-hidden p-0"
        style={{ height: "calc(100vh - 180px)" }}
      >
        {/* Sidebar */}
        <aside className="flex w-full flex-col border-r border-[color:var(--a-border)] sm:w-72 lg:w-80">
          <div className="flex items-center justify-between border-b border-[color:var(--a-border)] p-4">
            <h2 className="a-h2">Conversations</h2>
            <Button size="sm" onClick={handleNewChat}>
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-sm a-muted">
                No chats yet. Create one to start.
              </div>
            ) : (
              <ul className="space-y-1">
                {chats.map((chat) => {
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  const isActive = chat.id === activeChatId;
                  return (
                    <li key={chat.id}>
                      <button
                        type="button"
                        onClick={() => setActiveChatId(chat.id)}
                        className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                          isActive
                            ? "bg-[color:var(--a-primary-soft)] text-[color:var(--a-primary)]"
                            : "hover:bg-[color:var(--a-card-muted)]"
                        }`}
                      >
                        <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                          <AvatarFallback
                            className={`text-xs ${
                              isActive
                                ? "bg-[color:var(--a-primary)] text-white"
                                : "bg-[color:var(--a-card-muted)] text-[color:var(--a-ink-3)]"
                            }`}
                          >
                            {chat.title.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          {editingId === chat.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                confirmRename(chat.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={() => confirmRename(chat.id)}
                                autoFocus
                                className="h-7 text-sm"
                              />
                            </form>
                          ) : (
                            <>
                              <p className="truncate text-sm font-semibold">
                                {chat.title}
                              </p>
                              <p className="truncate text-xs a-muted">
                                {lastMessage
                                  ? lastMessage.content
                                  : "No messages yet"}
                              </p>
                            </>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] a-muted-2">
                            {formatDate(chat.updatedAt)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[color:var(--a-card-muted)]"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRename(chat);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-[color:var(--a-down)] focus:text-[color:var(--a-down)]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChat(chat.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <section className="flex flex-1 flex-col bg-[color:var(--a-bg)]">
          {activeChat ? (
            <>
              <header className="flex items-center justify-between border-b border-[color:var(--a-border)] bg-[color:var(--a-card)] px-5 py-3">
                <div>
                  <h2 className="a-h2">{activeChat.title}</h2>
                  <p className="text-xs a-muted">
                    {activeChat.messages.length}{" "}
                    {activeChat.messages.length === 1 ? "message" : "messages"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="hidden sm:inline-flex"
                >
                  <Plus className="h-4 w-4" />
                  New chat
                </Button>
              </header>

              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
              >
                {activeChat.messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--a-primary-soft)] text-[color:var(--a-primary)]">
                      <Send className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">Start a conversation</p>
                    <p className="max-w-xs text-xs a-muted">
                      Type a message below. This is a local UI demo; connect an
                      AI provider for real replies.
                    </p>
                  </div>
                ) : (
                  activeChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="mt-1 h-8 w-8 shrink-0">
                        <AvatarFallback
                          className={`text-xs ${
                            message.role === "user"
                              ? "bg-[color:var(--a-ink)] text-white"
                              : "bg-[color:var(--a-primary)] text-white"
                          }`}
                        >
                          {message.role === "user" ? "ME" : "AI"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%] ${
                          message.role === "user"
                            ? "bg-[color:var(--a-primary)] text-white"
                            : "bg-[color:var(--a-card)] border border-[color:var(--a-border)] text-[color:var(--a-ink)]"
                        }`}
                      >
                        {message.content}
                        <div
                          className={`mt-1 text-[10px] ${
                            message.role === "user"
                              ? "text-white/70"
                              : "a-muted-2"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              <form
                onSubmit={handleSend}
                className="flex items-center gap-3 bg-[color:var(--a-card)] p-4"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--a-primary-soft)] text-[color:var(--a-primary)]">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">No chat selected</p>
              <p className="text-xs a-muted">
                Create a new chat to start messaging.
              </p>
              <Button className="mt-4" size="sm" onClick={handleNewChat}>
                <Plus className="h-4 w-4" />
                New chat
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
