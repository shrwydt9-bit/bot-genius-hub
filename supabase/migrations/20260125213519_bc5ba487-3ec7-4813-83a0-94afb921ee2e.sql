-- Create brands table for multi-brand management
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  color_scheme JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brands
CREATE POLICY "Users can view their own brands"
ON public.brands
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands"
ON public.brands
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands"
ON public.brands
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands"
ON public.brands
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add brand_id to bots table
ALTER TABLE public.bots ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their bots"
ON public.analytics_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = analytics_events.bot_id
    AND bots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create analytics for their bots"
ON public.analytics_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = analytics_events.bot_id
    AND bots.user_id = auth.uid()
  )
);

-- Create AI suggestions table
CREATE TABLE public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_has_bot_or_brand CHECK (bot_id IS NOT NULL OR brand_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for their bots or brands"
ON public.ai_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = ai_suggestions.bot_id
    AND bots.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = ai_suggestions.brand_id
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create suggestions for their bots or brands"
ON public.ai_suggestions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = ai_suggestions.bot_id
    AND bots.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = ai_suggestions.brand_id
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update suggestions for their bots or brands"
ON public.ai_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = ai_suggestions.bot_id
    AND bots.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = ai_suggestions.brand_id
    AND brands.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_suggestions_updated_at
BEFORE UPDATE ON public.ai_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();