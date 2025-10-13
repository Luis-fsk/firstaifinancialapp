import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "text/xml");
    
    if (!doc) return [];
    
    const items = doc.querySelectorAll("item");
    return Array.from(items).map(item => {
      const element = item as any;
      return {
        title: element.querySelector("title")?.textContent || "",
        link: element.querySelector("link")?.textContent || "",
        description: element.querySelector("description")?.textContent || "",
        pubDate: element.querySelector("pubDate")?.textContent || new Date().toISOString(),
      };
    }).filter(item => item.title && item.link);
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching news from RSS feeds...');
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // RSS feeds de fontes confiáveis
    const rssFeeds = [
      { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com' },
      { url: 'https://www.marketwatch.com/rss/topstories', source: 'MarketWatch' },
      { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline', source: 'Yahoo Finance' },
    ];

    // Buscar notícias de todos os feeds
    const allRSSItems: Array<RSSItem & { source: string }> = [];
    
    for (const feed of rssFeeds) {
      const items = await fetchRSSFeed(feed.url);
      allRSSItems.push(...items.map(item => ({ ...item, source: feed.source })));
    }

    console.log(`Found ${allRSSItems.length} RSS items`);

    // Selecionar as 15 notícias mais recentes
    const recentItems = allRSSItems
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 15);

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
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});