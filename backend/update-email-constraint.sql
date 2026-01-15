-- Remove the old unique constraint on email
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Add a new unique constraint on the combination of email and user_type
ALTER TABLE users ADD CONSTRAINT users_email_user_type_key UNIQUE (email, user_type);
