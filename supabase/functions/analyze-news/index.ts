import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  newsId: z.string().uuid('ID de notícia inválido'),
  title: z.string().trim().min(1, 'Título não pode estar vazio').max(500, 'Título muito longo (máximo 500 caracteres)'),
  summary: z.string().trim().min(1, 'Resumo não pode estar vazio').max(2000, 'Resumo muito longo (máximo 2000 caracteres)'),
  category: z.string().trim().min(1, 'Categoria não pode estar vazia').max(100, 'Categoria muito longa')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request received:', requestBody);
    
    const { newsId, title, summary, category } = requestSchema.parse(requestBody);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing news article:', title);
    console.log('Environment check - OPENAI_API_KEY exists:', !!openaiApiKey);

    // Call OpenAI API to generate analysis
    console.log('Making request to OpenAI API...');
    const aiRequestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um analista financeiro especializado. Analise notícias financeiras e explique seus impactos nos investimentos de forma clara e didática para investidores brasileiros.'
        },
        {
          role: 'user',
          content: `Analise esta notícia:
          
Título: ${title}
Resumo: ${summary}
Categoria: ${category}

Forneça uma análise de 2-3 parágrafos explicando:
1. O que esta notícia significa para o mercado
2. Qual o impacto potencial nos investimentos (ações, renda fixa, câmbio, etc.)
3. Recomendações práticas para investidores

Seja objetivo e use linguagem acessível.`
        }
      ],
      temperature: 0.7,
    };

    console.log('AI Request payload:', JSON.stringify(aiRequestBody, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let aiResponse;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('AI Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error response:', errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido pela OpenAI. Tente novamente em alguns minutos." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      aiResponse = await response.json();
      console.log('AI Response received successfully');
      console.log('Response keys:', Object.keys(aiResponse || {}));
      console.log('Full AI Response:', JSON.stringify(aiResponse, null, 2));
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request timeout after 30 seconds');
        return new Response(JSON.stringify({ error: "Timeout ao tentar gerar análise. Tente novamente." }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw fetchError;
    }
    
    // Extract analysis from OpenAI response
    let analysis = '';
    if (aiResponse.choices && aiResponse.choices[0]?.message?.content) {
      analysis = aiResponse.choices[0].message.content;
      console.log('Analysis extracted from OpenAI response');
    } else {
      console.error('Unexpected AI response format:', aiResponse);
      console.error('Available keys:', Object.keys(aiResponse || {}));
      throw new Error('Formato de resposta inesperado da IA');
    }

    console.log('Extracted analysis length:', analysis.length);
    console.log('Analysis preview:', analysis.substring(0, 100) + '...');

    // Update the news article with AI analysis
    console.log('Updating news article with analysis for ID:', newsId);
    const { error: updateError } = await supabase
      .from('news_articles')
      .update({ ai_analysis: analysis })
      .eq('id', newsId);

    if (updateError) {
      console.error('Error updating news with analysis:', updateError);
      throw updateError;
    }

    console.log('News analysis generated and stored successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysis,
      newsId: newsId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-news function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar análise' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});