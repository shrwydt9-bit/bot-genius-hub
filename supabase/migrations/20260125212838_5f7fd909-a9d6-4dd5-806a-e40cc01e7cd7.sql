-- Create deployments table to track bot deployments
CREATE TABLE public.deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id, platform)
);

-- Enable RLS
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view deployments for their bots"
ON public.deployments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = deployments.bot_id
    AND bots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create deployments for their bots"
ON public.deployments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = deployments.bot_id
    AND bots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update deployments for their bots"
ON public.deployments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = deployments.bot_id
    AND bots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete deployments for their bots"
ON public.deployments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = deployments.bot_id
    AND bots.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_deployments_updated_at
BEFORE UPDATE ON public.deployments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create webhook logs table for debugging
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployment_id UUID NOT NULL REFERENCES public.deployments(id) ON DELETE CASCADE,
  request_body JSONB NOT NULL,
  response_status INTEGER,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook logs for their deployments"
ON public.webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deployments
    JOIN public.bots ON bots.id = deployments.bot_id
    WHERE deployments.id = webhook_logs.deployment_id
    AND bots.user_id = auth.uid()
  )
);