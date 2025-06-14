
-- Create a table to track user login streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  last_points_awarded_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_streaks table
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_streaks
CREATE POLICY "Users can view their own streaks" 
  ON public.user_streaks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
  ON public.user_streaks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" 
  ON public.user_streaks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create a function to handle streak points awarding
CREATE OR REPLACE FUNCTION public.award_streak_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  points_to_award INTEGER := 0;
  user_uuid UUID;
BEGIN
  user_uuid := NEW.user_id;
  
  -- Only award points if streak increased and we haven't awarded points today
  IF NEW.current_streak > OLD.current_streak AND 
     (NEW.last_points_awarded_date IS NULL OR NEW.last_points_awarded_date < CURRENT_DATE) THEN
    
    -- Determine points based on streak
    CASE NEW.current_streak
      WHEN 3 THEN points_to_award := 10;
      WHEN 4 THEN points_to_award := 15;
      WHEN 5 THEN points_to_award := 20;
      WHEN 6 THEN points_to_award := 30;
      WHEN 7 THEN points_to_award := 40;
      ELSE points_to_award := 0;
    END CASE;
    
    -- Award points if applicable
    IF points_to_award > 0 THEN
      -- Update user points
      INSERT INTO public.user_points (user_id, total_points, available_points)
      VALUES (user_uuid, points_to_award, points_to_award)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_points = user_points.total_points + points_to_award,
        available_points = user_points.available_points + points_to_award,
        updated_at = now();
      
      -- Record the transaction
      INSERT INTO public.points_transactions (user_id, points_change, transaction_type, description)
      VALUES (user_uuid, points_to_award, 'earned', 
              CONCAT(NEW.current_streak, '-day streak bonus'));
      
      -- Update the last_points_awarded_date
      NEW.last_points_awarded_date := CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for streak points
CREATE TRIGGER award_streak_points_trigger
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.award_streak_points();
