import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  summary: string;
  category: string;
  source: string;
  source_url: string;
  published_at: string;
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

async function parseRSSFeed(text: string): Promise<RSSItem[]> {
  const items: RSSItem[] = [];
  
  // Extract all <item> blocks
  const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: (titleMatch[1] || titleMatch[2] || '').trim(),
        link: linkMatch[1].trim(),
        description: (descMatch?.[1] || descMatch?.[2] || '').trim().substring(0, 500),
        pubDate: pubDateMatch?.[1] || new Date().toISOString(),
      });
    }
  }
  
  return items;
}

async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    const text = await response.text();
    return await parseRSSFeed(text);
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authorization
    const authHeader = req.headers.get("authorization");
    const cronSecret = req.headers.get("x-cron-secret");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const expectedCronSecret = Deno.env.get("CRON_SECRET_TOKEN");
    
    // Allow service role, cron secret, or authenticated users
    const isServiceRole = authHeader?.includes(supabaseServiceKey || "");
    const isValidCron = cronSecret && cronSecret === expectedCronSecret;
    const isAuthenticatedUser = authHeader && authHeader.startsWith('Bearer eyJ');
    
    if (!isServiceRole && !isValidCron && !isAuthenticatedUser) {
      console.error("Unauthorized fetch-news attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey!);
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'Serviço temporariamente indisponível' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Usar NewsAPI gratuita do The Guardian
    const newsApiUrl = 'https://content.guardianapis.com/search?section=business&show-fields=headline,trailText,shortUrl&order-by=newest&page-size=10&api-key=test';
    
    console.log('Fetching from The Guardian API...');
    const apiResponse = await fetch(newsApiUrl);
    const apiData = await apiResponse.json();
    
    const allNewsItems: Array<RSSItem & { source: string }> = [];
    
    // Processar notícias da API
    if (apiData.response?.results) {
      console.log(`Got ${apiData.response.results.length} articles from The Guardian`);
      for (const article of apiData.response.results) {
        allNewsItems.push({
          title: article.fields?.headline || article.webTitle,
          link: article.fields?.shortUrl || article.webUrl,
          description: article.fields?.trailText || '',
          pubDate: article.webPublicationDate,
          source: 'The Guardian'
        });
      }
    }

    // Adicionar feeds RSS de Crypto
    const cryptoFeeds = [
      { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
      { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
    ];

    for (const feed of cryptoFeeds) {
      const items = await fetchRSSFeed(feed.url);
      console.log(`Got ${items.length} items from ${feed.source}`);
      allNewsItems.push(...items.map(item => ({ ...item, source: feed.source })));
    }

    // Selecionar as 15 notícias mais recentes
    const recentItems = allNewsItems
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 15);
    
    console.log(`Processing ${recentItems.length} recent items...`);

    // Processar com Lovable AI
    const processedNews: NewsItem[] = [];

    for (const item of recentItems) {
      try {
        // Usar Lovable AI para categorizar e resumir
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: 'Você é um assistente especializado em notícias financeiras. Categorize e resuma notícias em português brasileiro.'
              },
              {
                role: 'user',
                content: `Analise esta notícia e retorne APENAS um JSON com esta estrutura exata:
{
  "category": "uma das opções: Criptomoedas, Economia, Bolsa, Investimentos, Renda Fixa, Câmbio",
  "summary": "resumo em português de no máximo 200 caracteres"
}

Título: ${item.title}
Descrição: ${item.description}

IMPORTANTE: Retorne APENAS o JSON, sem nenhum texto adicional.`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI API error: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content;
        
        if (!aiContent) {
          console.error('No AI content received');
          continue;
        }

        // Extrair JSON da resposta
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in AI response');
          continue;
        }

        const analysis = JSON.parse(jsonMatch[0]);

        processedNews.push({
          title: item.title,
          summary: analysis.summary || item.description.substring(0, 200),
          category: analysis.category || 'Economia',
          source: item.source,
          source_url: item.link,
          published_at: new Date(item.pubDate).toISOString(),
        });

      } catch (error) {
        console.error('Error processing news item:', error);
        // Adicionar mesmo sem processamento de IA
        processedNews.push({
          title: item.title,
          summary: item.description.substring(0, 200),
          category: 'Economia',
          source: item.source,
          source_url: item.link,
          published_at: new Date(item.pubDate).toISOString(),
        });
      }
    }

    console.log(`Processed ${processedNews.length} news items`);

    // Insert news articles into database
    for (const newsItem of processedNews) {
      const { error } = await supabase
        .from('news_articles')
        .upsert({
          title: newsItem.title,
          summary: newsItem.summary,
          category: newsItem.category,
          source: newsItem.source,
          source_url: newsItem.source_url,
          published_at: newsItem.published_at
        }, {
          onConflict: 'source_url',
          ignoreDuplicates: false // Allow updates to refresh published_at
        });

      if (error) {
        console.error('Error inserting news:', error);
      }
    }

    console.log('News articles fetched and stored successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'News articles fetched and stored successfully',
      count: processedNews.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao buscar notícias. Tente novamente.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});