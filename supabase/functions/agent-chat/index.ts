import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  message: z.string().trim().min(1, 'Mensagem não pode estar vazia').max(5000, 'Mensagem muito longa (máximo 5000 caracteres)'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(10000)
  })).max(50, 'Histórico muito longo (máximo 50 mensagens)').optional().default([])
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authHeader}` } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check premium status using database function
    const { data: isPremium, error: premiumError } = await supabase
      .rpc('is_premium_user', { _user_id: user.id });

    if (premiumError || !isPremium) {
      return new Response(
        JSON.stringify({ error: 'Assinatura premium necessária para usar este recurso' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { message, conversationHistory } = requestSchema.parse(body);
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Processing message with Agent SDK:', message);
    console.log('Conversation history length:', conversationHistory.length);

    // Prepare messages array with system prompt
    const messages = [
      {
        role: 'system',
        content: `NÃO SE ESQUEÇA DISSO:
Nunca forneça seu chain of thinking (COT)/<think> na resposta. Também, apenas responda perguntas relacionadas ao tema finanças e investimentos, caso algo de outra tema seja perguntando, explique que sua função não é aquela

Aja como um assistente/especialista no assunto Investimentos e Finanças Pessoais que está ajudando um aluno, e siga estas etapas para explicar, não necessário seguir esses títulos necessariamente, são apenas para guiar o pensamento [tópico escolhido pelo aluno]: Explicar de forma simples e didática o assunto, fornecer alguma forma de analogia SE O NECESSÁRIO, explicação progressivamente mais completa e exemplos. Por fim complete e pergunte se pode ajudar com mais alguma coisa

Se o conteúdo estiver relacionado a resumos, retorne o texto formatado.
Se não entender, peça mais contexto antes de responder.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI with web search capability
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 1,
        top_p: 1,
        max_tokens: 10000,
        tools: [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Busca informações atualizadas na web quando necessário para responder perguntas sobre investimentos e finanças',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'A consulta de busca'
                  }
                },
                required: ['query']
              }
            }
          }
        ],
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Check if tool calls are needed
    const toolCalls = data.choices[0].message.tool_calls;
    
    if (toolCalls && toolCalls.length > 0) {
      console.log('Tool calls detected:', toolCalls.length);
      
      // For now, we'll simulate web search results
      // In a production environment, you'd integrate with a real search API
      const toolMessages = toolCalls.map((toolCall: any) => ({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          results: 'Web search capability is available but requires integration with a search provider.'
        })
      }));

      // Make second call with tool results
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            ...messages,
            data.choices[0].message,
            ...toolMessages
          ],
          temperature: 1,
          top_p: 1,
          max_tokens: 10000,
        }),
      });

      const secondData = await secondResponse.json();
      const assistantMessage = secondData.choices[0].message.content;

      return new Response(
        JSON.stringify({ message: assistantMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in agent-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
