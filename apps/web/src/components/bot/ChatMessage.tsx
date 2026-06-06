import type { Message } from "../../hooks/useBotChat";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>

        {message.sources && message.sources.length > 0 && (
          <div className={`mt-2 pt-2 border-t ${isUser ? "border-blue-500" : "border-gray-200"}`}>
            <p className={`text-xs font-medium mb-1 ${isUser ? "text-blue-200" : "text-gray-500"}`}>
              Fuentes:
            </p>
            <ul className="space-y-0.5">
              {message.sources.map((source, idx) => (
                <li key={idx}>
                  <span
                    className={`text-xs ${
                      isUser ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {source.type === "documentation" ? "📄" : "🔗"}{" "}
                    {source.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
