-- Create financial goals table
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (length(description) <= 1000),
  category TEXT NOT NULL CHECK (category IN ('savings', 'investment', 'purchase', 'education', 'travel', 'other')),
  target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial expenses table
CREATE TABLE public.financial_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (length(category) BETWEEN 1 AND 50),
  description TEXT CHECK (length(description) <= 500),
  location TEXT CHECK (length(location) <= 200),
  expense_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial quiz answers table
CREATE TABLE public.financial_quiz_answers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fixed_expenses DECIMAL(12,2) NOT NULL CHECK (fixed_expenses >= 0),
  variable_expenses DECIMAL(12,2) NOT NULL CHECK (variable_expenses >= 0),
  investments DECIMAL(12,2) NOT NULL CHECK (investments >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for financial_goals
CREATE POLICY "Users can view their own goals"
  ON public.financial_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.financial_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.financial_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.financial_goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for financial_expenses
CREATE POLICY "Users can view their own expenses"
  ON public.financial_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.financial_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.financial_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.financial_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for financial_quiz_answers
CREATE POLICY "Users can view their own quiz answers"
  ON public.financial_quiz_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz answers"
  ON public.financial_quiz_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz answers"
  ON public.financial_quiz_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz answers"
  ON public.financial_quiz_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger for financial_goals
CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for financial_quiz_answers
CREATE TRIGGER update_financial_quiz_answers_updated_at
  BEFORE UPDATE ON public.financial_quiz_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX idx_financial_goals_deadline ON public.financial_goals(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_financial_expenses_user_id ON public.financial_expenses(user_id);
CREATE INDEX idx_financial_expenses_date ON public.financial_expenses(expense_date);