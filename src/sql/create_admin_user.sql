-- ==============================================================================
-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR TO CREATE AN ADMIN USER
-- ==============================================================================

-- 1. Enable crypto extension (usually on by default, but good to ensure)
create extension if not exists pgcrypto;

-- 2. Insert the user safely
DO $$
DECLARE
  -- --------------------------------------------------------------------------
  -- CONFIGURATION: Change these values!
  -- --------------------------------------------------------------------------
  target_email text := 'dhruv@splibiz.com';
  target_password text := 'admin@93068'; -- Change this to a strong password
  -- --------------------------------------------------------------------------
  
  new_uid uuid := gen_random_uuid();
  encrypted_pw text;
BEGIN
  -- Generate hashed password
  encrypted_pw := crypt(target_password, gen_salt('bf'));
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_uid,
    'authenticated',
    'authenticated',
    target_email,
    encrypted_pw,
    now(),
    null,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Insert into auth.identities (Required for sign-in to work properly)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_uid,
    format('{"sub":"%s","email":"%s"}', new_uid, target_email)::jsonb,
    'email',
    target_email, -- For email provider, the provider_id is the email
    now(),
    now(),
    now()
  );

  -- Insert into public.profiles (If you have a customized trigger this might happen automatically, but safe to do here)
  -- Note: If you have a trigger that creates profiles on auth.users insert, you can comment this out.
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, updated_at)
    VALUES (new_uid, target_email, 'System Admin', now());
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if profile already exists (e.g. from trigger)
  END;

  RAISE NOTICE 'Admin user created successfully: %', target_email;
END $$;
