import { z } from 'zod';

export const goalSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'O título não pode estar vazio')
    .max(200, 'O título deve ter no máximo 200 caracteres'),
  description: z.string()
    .trim()
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  category: z.enum(['savings', 'investment', 'purchase', 'education', 'travel', 'other'], {
    errorMap: () => ({ message: 'Categoria inválida' })
  }),
  targetAmount: z.number()
    .positive('O valor alvo deve ser maior que zero')
    .max(999999999.99, 'O valor alvo deve ser menor que R$ 1 bilhão')
    .multipleOf(0.01, 'Use no máximo 2 casas decimais'),
  currentAmount: z.number()
    .nonnegative('O valor atual não pode ser negativo')
    .max(999999999.99, 'O valor atual deve ser menor que R$ 1 bilhão')
    .multipleOf(0.01, 'Use no máximo 2 casas decimais'),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'O prazo deve ser uma data futura')
    .refine((date) => {
      const d = new Date(date);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 50);
      return d <= maxDate;
    }, 'O prazo não pode ser mais de 50 anos no futuro')
    .optional()
    .or(z.literal(''))
}).refine((data) => data.currentAmount <= data.targetAmount * 1.5, {
  message: 'O valor atual não pode exceder 150% do valor alvo',
  path: ['currentAmount']
});

export const goalUpdateSchema = z.object({
  currentAmount: z.number()
    .nonnegative('O valor não pode ser negativo')
    .max(999999999.99, 'O valor deve ser menor que R$ 1 bilhão')
    .multipleOf(0.01, 'Use no máximo 2 casas decimais')
});
