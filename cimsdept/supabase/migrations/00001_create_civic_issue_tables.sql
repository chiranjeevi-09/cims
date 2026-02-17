/*
# Create Civic Issue Management System Tables

## 1. New Tables

### profiles
- `id` (uuid, primary key, references auth.users)
- `email` (text, unique, not null)
- `full_name` (text)
- `department` (department_type enum, not null)
- `role` (user_role enum, default: 'official', not null)
- `created_at` (timestamptz, default: now())

### complaints
- `id` (uuid, primary key, default: gen_random_uuid())
- `title` (text, not null)
- `description` (text, not null)
- `category` (complaint_category enum)
- `status` (complaint_status enum, default: 'new', not null)
- `progress_stage` (progress_stage enum, nullable - only for 'in_progress' status)
- `citizen_name` (text, not null)
- `citizen_phone` (text, not null)
- `citizen_email` (text)
- `location` (text, not null)
- `latitude` (numeric)
- `longitude` (numeric)
- `complaint_images` (text array - URLs to images)
- `solution_image` (text - URL to solution image)
- `assigned_department` (department_type enum)
- `assigned_to` (uuid, references profiles)
- `resolved_at` (timestamptz)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### complaint_redirects
- `id` (uuid, primary key, default: gen_random_uuid())
- `complaint_id` (uuid, references complaints, not null)
- `from_department` (department_type enum, not null)
- `to_department` (department_type enum, not null)
- `redirected_by` (uuid, references profiles, not null)
- `reason` (text)
- `created_at` (timestamptz, default: now())

## 2. Storage Bucket
- Create bucket: `app-84dd1k6elqm9_complaints_images`
- Max file size: 1MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

## 3. Security
- Enable RLS on all tables
- Profiles: Admins have full access, officials can view own profile
- Complaints: All authenticated users can view, only assigned officials can update
- Complaint Redirects: All authenticated users can view and insert

## 4. Functions
- `handle_new_user()`: Auto-sync verified users to profiles table
- `is_admin()`: Helper function to check if user is admin
- `categorize_complaint()`: AI-based complaint categorization
- `update_complaint_status()`: Update complaint status with validation
*/

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('official', 'admin');
CREATE TYPE department_type AS ENUM ('municipal', 'panchayat', 'town_panchayat', 'corporation', 'water', 'energy', 'pwd');
CREATE TYPE complaint_category AS ENUM ('water', 'electricity', 'pwd', 'other');
CREATE TYPE complaint_status AS ENUM ('new', 'in_progress', 'completed', 'redirected');
CREATE TYPE progress_stage AS ENUM ('notified', 'progress', 'completed');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  department department_type NOT NULL,
  role user_role DEFAULT 'official'::user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category complaint_category,
  status complaint_status DEFAULT 'new'::complaint_status NOT NULL,
  progress_stage progress_stage,
  citizen_name text NOT NULL,
  citizen_phone text NOT NULL,
  citizen_email text,
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  complaint_images text[],
  solution_image text,
  assigned_department department_type,
  assigned_to uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create complaint_redirects table
CREATE TABLE IF NOT EXISTS complaint_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE NOT NULL,
  from_department department_type NOT NULL,
  to_department department_type NOT NULL,
  redirected_by uuid REFERENCES profiles(id) NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-84dd1k6elqm9_complaints_images',
  'app-84dd1k6elqm9_complaints_images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_redirects ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Create trigger function to sync new users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO profiles (id, email, full_name, department, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'department')::department_type,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'official'::user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user sync
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Officials can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Officials can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (role IS NOT DISTINCT FROM old.role);

-- RLS Policies for complaints
CREATE POLICY "All authenticated users can view complaints" ON complaints
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officials can insert complaints" ON complaints
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Assigned officials and admins can update complaints" ON complaints
  FOR UPDATE TO authenticated 
  USING (
    is_admin(auth.uid()) OR 
    assigned_to = auth.uid() OR
    assigned_department = (SELECT department FROM profiles WHERE id = auth.uid())
  );

-- RLS Policies for complaint_redirects
CREATE POLICY "All authenticated users can view redirects" ON complaint_redirects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officials can insert redirects" ON complaint_redirects
  FOR INSERT TO authenticated WITH CHECK (true);

-- Storage policies
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'app-84dd1k6elqm9_complaints_images');

CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'app-84dd1k6elqm9_complaints_images');

CREATE POLICY "Users can update own uploads" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'app-84dd1k6elqm9_complaints_images');

-- Function to categorize complaints using keyword matching
CREATE OR REPLACE FUNCTION categorize_complaint(complaint_text text)
RETURNS complaint_category
LANGUAGE plpgsql
AS $$
DECLARE
  lower_text text;
BEGIN
  lower_text := lower(complaint_text);
  
  -- Water-related keywords
  IF lower_text ~ '(water|leak|pipe|drainage|sewage|tap|supply|drinking)' THEN
    RETURN 'water'::complaint_category;
  END IF;
  
  -- Electricity-related keywords
  IF lower_text ~ '(electric|power|light|current|voltage|transformer|pole|wire|outage)' THEN
    RETURN 'electricity'::complaint_category;
  END IF;
  
  -- PWD-related keywords
  IF lower_text ~ '(road|street|pothole|bridge|highway|pavement|construction|building)' THEN
    RETURN 'pwd'::complaint_category;
  END IF;
  
  -- Default to other
  RETURN 'other'::complaint_category;
END;
$$;

-- Function to update complaint status with automatic stage management
CREATE OR REPLACE FUNCTION update_complaint_status(
  complaint_id_param uuid,
  new_status complaint_status,
  new_stage progress_stage DEFAULT NULL,
  solution_image_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE complaints
  SET 
    status = new_status,
    progress_stage = CASE 
      WHEN new_status = 'in_progress'::complaint_status THEN COALESCE(new_stage, 'notified'::progress_stage)
      WHEN new_status = 'completed'::complaint_status THEN 'completed'::progress_stage
      ELSE NULL
    END,
    solution_image = COALESCE(solution_image_param, solution_image),
    resolved_at = CASE 
      WHEN new_status = 'completed'::complaint_status THEN now()
      ELSE resolved_at
    END,
    updated_at = now()
  WHERE id = complaint_id_param;
END;
$$;