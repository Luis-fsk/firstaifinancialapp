import { z } from 'zod';

// Post content validation schema
export const postSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'O conteúdo não pode estar vazio')
    .max(5000, 'O conteúdo deve ter no máximo 5000 caracteres'),
  category: z.enum(['Geral', 'Investimentos', 'Finanças'], {
    errorMap: () => ({ message: 'Categoria inválida' })
  }),
  image_url: z.string()
    .url('URL de imagem inválida')
    .regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Formato de imagem não suportado')
    .optional()
    .or(z.literal(''))
});

// Reply content validation schema
export const replySchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'O conteúdo não pode estar vazio')
    .max(2000, 'O comentário deve ter no máximo 2000 caracteres'),
  image_url: z.string()
    .url('URL de imagem inválida')
    .regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Formato de imagem não suportado')
    .optional()
    .or(z.literal(''))
});

// Message content validation schema
export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'A mensagem não pode estar vazia')
    .max(2000, 'A mensagem deve ter no máximo 2000 caracteres')
});
