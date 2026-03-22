import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useState, useRef, useCallback } from "react";

export function useAiCoachMessages() {
  return useQuery({
    queryKey: [api.aiCoach.messages.path],
    queryFn: async () => {
      const res = await fetch(api.aiCoach.messages.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch AI messages");
      return res.json();
    },
  });
}

export function useAiCoachStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string, coachType: string = "beginner", onComplete?: () => void) => {
    if (isStreaming) return;

    setIsStreaming(true);
    setStreamingContent("");

    abortControllerRef.current = new AbortController();

    const language = localStorage.getItem("fitforge_lang") || "ro";

    try {
      const res = await fetch(api.aiCoach.chat.path, {
        method: api.aiCoach.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, coachType, language }),
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                setIsStreaming(false);
                if (onComplete) onComplete();
                break;
              }
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
            } catch (e) {
              console.error("Failed to parse chunk", e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Streaming error:", err);
      }
      setIsStreaming(false);
    }
  }, [isStreaming]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { sendMessage, isStreaming, streamingContent, stopStream };
}
