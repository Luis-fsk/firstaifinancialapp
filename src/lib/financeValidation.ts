import { z } from 'zod';

export const expenseSchema = z.object({
  amount: z.number()
    .positive('O valor deve ser maior que zero')
    .max(999999999.99, 'O valor deve ser menor que R$ 1 bilhão')
    .multipleOf(0.01, 'Use no máximo 2 casas decimais'),
  category: z.enum(['fixed', 'variable', 'investment'], {
    errorMap: () => ({ message: 'Categoria inválida' })
  }),
  description: z.string()
    .trim()
    .min(1, 'A descrição não pode estar vazia')
    .max(500, 'A descrição deve ter no máximo 500 caracteres'),
  location: z.string()
    .trim()
    .max(200, 'A localização deve ter no máximo 200 caracteres')
    .optional()
    .or(z.literal(''))
});

export const quizAnswersSchema = z.object({
  fixedExpenses: z.number()
    .nonnegative('O valor não pode ser negativo')
    .max(999999999.99, 'Valor muito grande')
    .multipleOf(0.01, 'Use no máximo 2 casas decimais'),
  variableExpenses: z.number()
    .nonnegative('O valor não pode ser negativo')
    .max(999999999.99, 'Valor muito grande')
    .multipleOf(0.01, 'Use no máximo 2 casas decimais'),
  investments: z.number()
    .nonnegative('O valor não pode ser negativo')
    .max(999999999.99, 'Valor muito grande')
    .multipleOf(0.01, 'Use no máximo 2 casas decimais')
});
