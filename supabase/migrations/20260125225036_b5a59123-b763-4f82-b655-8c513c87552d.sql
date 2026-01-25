-- Create conversation_messages table for detailed chat history
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conversation_sessions table for session tracking
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create conversation_insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS public.conversation_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('faq', 'improvement', 'trend', 'sentiment', 'performance')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  frequency INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_messages
CREATE POLICY "Users can view messages for their bots"
  ON public.conversation_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_messages.bot_id 
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages for their bots"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_messages.bot_id 
    AND bots.user_id = auth.uid()
  ));

-- RLS Policies for conversation_sessions
CREATE POLICY "Users can view sessions for their bots"
  ON public.conversation_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_sessions.bot_id 
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "Users can create sessions for their bots"
  ON public.conversation_sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_sessions.bot_id 
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sessions for their bots"
  ON public.conversation_sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_sessions.bot_id 
    AND bots.user_id = auth.uid()
  ));

-- RLS Policies for conversation_insights
CREATE POLICY "Users can view insights for their bots"
  ON public.conversation_insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_insights.bot_id 
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "Users can create insights for their bots"
  ON public.conversation_insights FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_insights.bot_id 
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "Users can update insights for their bots"
  ON public.conversation_insights FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_insights.bot_id 
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete insights for their bots"
  ON public.conversation_insights FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = conversation_insights.bot_id 
    AND bots.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_conversation_messages_bot_id ON public.conversation_messages(bot_id);
CREATE INDEX idx_conversation_messages_session_id ON public.conversation_messages(session_id);
CREATE INDEX idx_conversation_messages_created_at ON public.conversation_messages(created_at DESC);
CREATE INDEX idx_conversation_sessions_bot_id ON public.conversation_sessions(bot_id);
CREATE INDEX idx_conversation_sessions_started_at ON public.conversation_sessions(started_at DESC);
CREATE INDEX idx_conversation_insights_bot_id ON public.conversation_insights(bot_id);
CREATE INDEX idx_conversation_insights_insight_type ON public.conversation_insights(insight_type);

-- Create trigger for updating updated_at
CREATE TRIGGER update_conversation_insights_updated_at
  BEFORE UPDATE ON public.conversation_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();