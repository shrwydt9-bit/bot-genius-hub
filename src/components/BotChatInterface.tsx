import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Bot, User } from "lucide-react";
import { streamChat } from "@/lib/streamChat";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

interface BotChatInterfaceProps {
  botId: string;
  initialMessages?: Message[];
  onBotUpdate?: (updates: any) => void;
}

export const BotChatInterface = ({ botId, initialMessages = [], onBotUpdate }: BotChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMessage],
        botId,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => {
          console.error(error);
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to get response from AI. Please try again.",
          });
        },
      });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium mb-2">Start Customizing Your Bot</p>
            <p className="text-sm">
              Tell me how you'd like your bot to behave. For example:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>"Make the bot more friendly and casual"</li>
              <li>"Change the greeting to welcome users"</li>
              <li>"Add product recommendations"</li>
            </ul>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <Card className={`p-4 max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
              </div>
            </Card>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Describe how you want to modify your bot..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="gradient-primary"
            size="icon"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};