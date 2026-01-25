-- Fix search_path for update_updated_at function
-- First drop the trigger
DROP TRIGGER IF EXISTS update_bots_updated_at ON public.bots;

-- Drop and recreate the function with search_path
DROP FUNCTION IF EXISTS update_updated_at();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_bots_updated_at
  BEFORE UPDATE ON public.bots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();