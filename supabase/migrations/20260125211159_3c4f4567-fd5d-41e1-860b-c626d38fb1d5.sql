-- Create enum for bot platforms
CREATE TYPE bot_platform AS ENUM ('whatsapp', 'telegram', 'instagram', 'facebook', 'shopify', 'slack', 'discord');

-- Create enum for bot types
CREATE TYPE bot_type AS ENUM ('customer_service', 'lead_generation', 'content_automation', 'ecommerce');

-- Create bots table
CREATE TABLE public.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform bot_platform NOT NULL,
  bot_type bot_type NOT NULL,
  description TEXT,
  personality TEXT DEFAULT 'friendly and professional',
  greeting_message TEXT DEFAULT 'Hello! How can I help you today?',
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customization_chats table for AI conversation history
CREATE TABLE public.customization_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bots
CREATE POLICY "Users can view their own bots"
  ON public.bots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bots"
  ON public.bots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots"
  ON public.bots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots"
  ON public.bots FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for customization_chats
CREATE POLICY "Users can view chats for their bots"
  ON public.customization_chats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = customization_chats.bot_id
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "Users can create chats for their bots"
  ON public.customization_chats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = customization_chats.bot_id
    AND bots.user_id = auth.uid()
  ));

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to bots table
CREATE TRIGGER update_bots_updated_at
  BEFORE UPDATE ON public.bots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create index for faster queries
CREATE INDEX idx_bots_user_id ON public.bots(user_id);
CREATE INDEX idx_customization_chats_bot_id ON public.customization_chats(bot_id);
CREATE INDEX idx_customization_chats_created_at ON public.customization_chats(created_at);