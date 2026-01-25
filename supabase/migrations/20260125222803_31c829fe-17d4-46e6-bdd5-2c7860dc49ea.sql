-- Create response_templates table
CREATE TABLE IF NOT EXISTS response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  platform bot_platform NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own templates"
  ON response_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON response_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON response_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON response_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_response_templates_user_id ON response_templates(user_id);
CREATE INDEX idx_response_templates_bot_id ON response_templates(bot_id);
CREATE INDEX idx_response_templates_platform ON response_templates(platform);

-- Create trigger for updating updated_at
CREATE TRIGGER update_response_templates_updated_at
  BEFORE UPDATE ON response_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert some default templates
INSERT INTO response_templates (user_id, name, description, platform, template_content, variables, category)
SELECT 
  auth.uid(),
  'Welcome Message',
  'Friendly welcome message for new customers',
  'whatsapp',
  'Hello {customer_name}! 👋 Welcome to {business_name}. How can I help you today?',
  '[{"name": "customer_name", "description": "Customer''s first name"}, {"name": "business_name", "description": "Your business name"}]'::jsonb,
  'greeting'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO response_templates (user_id, name, description, platform, template_content, variables, category)
SELECT 
  auth.uid(),
  'Order Status',
  'Template for providing order status updates',
  'email',
  'Hi {customer_name},\n\nYour order #{order_id} is currently {order_status}.\n\nExpected delivery: {delivery_date}\n\nThank you for choosing {business_name}!',
  '[{"name": "customer_name", "description": "Customer''s name"}, {"name": "order_id", "description": "Order number"}, {"name": "order_status", "description": "Current order status"}, {"name": "delivery_date", "description": "Estimated delivery date"}, {"name": "business_name", "description": "Your business name"}]'::jsonb,
  'ecommerce'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;