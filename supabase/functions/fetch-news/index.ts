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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Processar notícias com categorização simples
    const processedNews: NewsItem[] = [];
    
    // Função auxiliar para categorizar baseado em palavras-chave
    const categorizeNews = (title: string, description: string, source: string): string => {
      const text = `${title} ${description}`.toLowerCase();
      
      if (source === 'CoinDesk' || source === 'CoinTelegraph' || 
          text.includes('bitcoin') || text.includes('crypto') || 
          text.includes('ethereum') || text.includes('blockchain')) {
        return 'Criptomoedas';
      }
      if (text.includes('stock') || text.includes('ação') || text.includes('ações') || 
          text.includes('bolsa') || text.includes('índice')) {
        return 'Bolsa';
      }
      if (text.includes('invest') || text.includes('investimento') || 
          text.includes('fundo') || text.includes('portfolio')) {
        return 'Investimentos';
      }
      if (text.includes('taxa') || text.includes('juros') || text.includes('bond') || 
          text.includes('treasury') || text.includes('tesouro')) {
        return 'Renda Fixa';
      }
      if (text.includes('dólar') || text.includes('euro') || text.includes('câmbio') || 
          text.includes('currency') || text.includes('forex')) {
        return 'Câmbio';
      }
      return 'Economia';
    };

    for (const item of recentItems) {
      try {
        const category = categorizeNews(item.title, item.description, item.source);
        const summary = item.description.length > 200 
          ? item.description.substring(0, 197) + '...' 
          : item.description;

        processedNews.push({
          title: item.title,
          summary: summary,
          category: category,
          source: item.source,
          source_url: item.link,
          published_at: new Date(item.pubDate).toISOString(),
        });
      } catch (error) {
        console.error('Error processing news item:', error);
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