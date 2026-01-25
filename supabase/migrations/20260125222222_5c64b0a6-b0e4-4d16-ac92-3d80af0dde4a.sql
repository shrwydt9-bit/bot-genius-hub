-- Add all new platform types to bot_platform enum
DO $$ 
BEGIN
  -- Check if we need to add new values to bot_platform enum
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'email' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'email';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sms' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'sms';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'linkedin' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'linkedin';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tiktok' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'tiktok';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'microsoft_teams' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'microsoft_teams';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'twitter' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'twitter';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'snapchat' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'snapchat';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'wechat' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'wechat';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'line' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'line';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'viber' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'viber';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pinterest' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'pinterest';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reddit' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'reddit';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'youtube' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'youtube';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'google_business' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'google_business';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'apple_messages' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'apple_messages';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rcs' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'rcs';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'kik' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'kik';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'signal' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'signal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'matrix' AND enumtypid = 'bot_platform'::regtype) THEN
    ALTER TYPE bot_platform ADD VALUE 'matrix';
  END IF;
END $$;

-- Create platform_integrations table for storing platform-specific credentials
CREATE TABLE IF NOT EXISTS platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform bot_platform NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own platform integrations"
  ON platform_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform integrations"
  ON platform_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform integrations"
  ON platform_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platform integrations"
  ON platform_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_platform_integrations_updated_at
  BEFORE UPDATE ON platform_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();