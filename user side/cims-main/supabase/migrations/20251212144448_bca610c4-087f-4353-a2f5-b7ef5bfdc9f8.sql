-- Update the handle_new_user function to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, city, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;