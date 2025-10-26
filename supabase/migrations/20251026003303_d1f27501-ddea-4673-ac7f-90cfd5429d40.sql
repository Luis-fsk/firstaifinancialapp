-- Add database-level validation constraints matching client-side validation

-- Posts: max 5000 chars, valid categories, image URL format
ALTER TABLE public.posts 
  ADD CONSTRAINT posts_content_length CHECK (length(content) > 0 AND length(content) <= 5000);

ALTER TABLE public.posts
  ADD CONSTRAINT posts_category_valid CHECK (category IN ('Geral', 'Investimentos', 'Finanças'));

ALTER TABLE public.posts
  ADD CONSTRAINT posts_image_url_format CHECK (
    image_url IS NULL OR 
    image_url = '' OR 
    (image_url ~* '^https?://.+\.(jpg|jpeg|png|gif|webp)$')
  );

-- Replies: max 2000 chars, image URL format
ALTER TABLE public.replies
  ADD CONSTRAINT replies_content_length CHECK (length(content) > 0 AND length(content) <= 2000);

ALTER TABLE public.replies
  ADD CONSTRAINT replies_image_url_format CHECK (
    image_url IS NULL OR 
    image_url = '' OR 
    (image_url ~* '^https?://.+\.(jpg|jpeg|png|gif|webp)$')
  );

-- Messages: max 2000 chars
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_length CHECK (length(content) > 0 AND length(content) <= 2000);

-- Financial expenses: valid amounts, categories, description length
ALTER TABLE public.financial_expenses
  ADD CONSTRAINT expenses_amount_valid CHECK (amount > 0 AND amount <= 999999999.99);

ALTER TABLE public.financial_expenses
  ADD CONSTRAINT expenses_category_valid CHECK (category IN ('fixed', 'variable', 'investment'));

ALTER TABLE public.financial_expenses
  ADD CONSTRAINT expenses_description_length CHECK (length(description) > 0 AND length(description) <= 500);

ALTER TABLE public.financial_expenses
  ADD CONSTRAINT expenses_location_length CHECK (
    location IS NULL OR 
    location = '' OR 
    length(location) <= 200
  );

-- Financial goals: valid amounts, categories, title/description length
ALTER TABLE public.financial_goals
  ADD CONSTRAINT goals_target_amount_valid CHECK (target_amount > 0 AND target_amount <= 999999999.99);

ALTER TABLE public.financial_goals
  ADD CONSTRAINT goals_current_amount_valid CHECK (current_amount >= 0 AND current_amount <= 999999999.99);

ALTER TABLE public.financial_goals
  ADD CONSTRAINT goals_current_not_exceed_target CHECK (current_amount <= target_amount * 1.5);

ALTER TABLE public.financial_goals
  ADD CONSTRAINT goals_category_valid CHECK (category IN ('savings', 'investment', 'purchase', 'education', 'travel', 'other'));

ALTER TABLE public.financial_goals
  ADD CONSTRAINT goals_title_length CHECK (length(title) > 0 AND length(title) <= 200);

ALTER TABLE public.financial_goals
  ADD CONSTRAINT goals_description_length CHECK (
    description IS NULL OR 
    description = '' OR 
    length(description) <= 1000
  );

-- Financial quiz answers: non-negative amounts
ALTER TABLE public.financial_quiz_answers
  ADD CONSTRAINT quiz_fixed_expenses_valid CHECK (fixed_expenses >= 0 AND fixed_expenses <= 999999999.99);

ALTER TABLE public.financial_quiz_answers
  ADD CONSTRAINT quiz_variable_expenses_valid CHECK (variable_expenses >= 0 AND variable_expenses <= 999999999.99);

ALTER TABLE public.financial_quiz_answers
  ADD CONSTRAINT quiz_investments_valid CHECK (investments >= 0 AND investments <= 999999999.99);