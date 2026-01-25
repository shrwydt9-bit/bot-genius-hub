import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageCircle } from "lucide-react";

interface BotPreviewProps {
  botName: string;
  personality: string;
  greetingMessage: string;
  platform: string;
}

export const BotPreview = ({ botName, personality, greetingMessage, platform }: BotPreviewProps) => {
  return (
    <Card className="h-full border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Bot Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Bot Name</h4>
            <p className="text-sm text-muted-foreground">{botName || "Untitled Bot"}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Platform</h4>
            <p className="text-sm text-muted-foreground capitalize">{platform}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Personality</h4>
            <p className="text-sm text-muted-foreground">{personality}</p>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4 bg-muted/30">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Greeting Message
          </h4>
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-sm">{greetingMessage}</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          This is how your bot will appear to users. Continue customizing through the chat to modify its behavior.
        </div>
      </CardContent>
    </Card>
  );
};