import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request received:', requestBody);
    
    const { newsId, title, summary, category } = requestBody;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing news article:', title);
    console.log('Environment check - LOVABLE_API_KEY exists:', !!lovableApiKey);

    // Call Lovable AI to generate analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para análise por IA." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('Full AI Response:', JSON.stringify(aiResponse, null, 2));
    
    // Handle different response formats
    let analysis = '';
    if (aiResponse.choices && aiResponse.choices[0]?.message?.content) {
      // Standard OpenAI format
      analysis = aiResponse.choices[0].message.content;
      console.log('Using standard OpenAI format');
    } else if (aiResponse.reply) {
      // Webhook format: { "reply": "response" }
      analysis = aiResponse.reply;
      console.log('Using webhook reply format');
    } else if (aiResponse.resposta) {
      // Portuguese format: { "resposta": "response" }
      analysis = aiResponse.resposta;
      console.log('Using Portuguese resposta format');
    } else if (typeof aiResponse === 'string') {
      // Sometimes the response might be a direct string
      analysis = aiResponse;
      console.log('Using direct string format');
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