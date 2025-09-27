import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ArrowLeft, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const News = () => {
  const navigate = useNavigate();

  const newsArticles = [
    {
      title: "Mercado de criptomoedas registra alta de 15% esta semana",
      summary: "Bitcoin e principais altcoins lideram movimento de recuperação após correção do mês passado.",
      category: "Criptomoedas",
      time: "2 horas atrás",
      featured: true,
    },
    {
      title: "Banco Central mantém taxa Selic em 11,75%",
      summary: "Decisão era esperada pelo mercado e reflete cenário de inflação controlada.",
      category: "Economia",
      time: "4 horas atrás",
      featured: false,
    },
    {
      title: "Ações da Vale sobem 8% após anúncio de dividendos",
      summary: "Mineradora anuncia distribuição extraordinária de dividendos para acionistas.",
      category: "Bolsa",
      time: "6 horas atrás",
      featured: true,
    },
    {
      title: "Dólar recua para R$ 5,20 em meio a fluxo estrangeiro",
      summary: "Moeda americana perde força com entrada de capital internacional no país.",
      category: "Câmbio",
      time: "8 horas atrás",
      featured: false,
    },
    {
      title: "Fundos imobiliários atraem R$ 2,5 bi em janeiro",
      summary: "Setor de FIIs continua aquecido com alta demanda por renda passiva.",
      category: "Investimentos",
      time: "1 dia atrás",
      featured: false,
    },
    {
      title: "Tesouro Direto: IPCA+ 2029 rende 6,2% ao ano",
      summary: "Títulos públicos oferecem boa oportunidade para proteção contra inflação.",
      category: "Renda Fixa",
      time: "1 dia atrás",
      featured: false,
    },
  ];

  const categories = ["Todas", "Economia", "Bolsa", "Criptomoedas", "Câmbio", "Investimentos", "Renda Fixa"];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Criptomoedas": "bg-primary text-primary-foreground",
      "Economia": "bg-secondary text-secondary-foreground",
      "Bolsa": "bg-warm text-warm-foreground",
      "Câmbio": "bg-accent text-accent-foreground",
      "Investimentos": "bg-muted text-muted-foreground",
      "Renda Fixa": "bg-primary/20 text-primary",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-warm rounded-lg">
                <Newspaper className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Notícias Financeiras</h1>
                <p className="text-sm text-muted-foreground">Últimas do mercado financeiro</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white mb-8 shadow-warm-lg">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="h-8 w-8" />
            <div>
              <h2 className="text-3xl font-bold">Mercado em Tempo Real</h2>
              <p className="text-white/90 text-lg mt-2">
                Acompanhe as principais notícias e tendências do mercado financeiro
              </p>
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Featured Articles */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Destaques</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {newsArticles.filter(article => article.featured).map((article, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-warm transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCategoryColor(article.category)}>
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {article.time}
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {article.summary}
                  </CardDescription>
                  <Button variant="ghost" size="sm" className="p-0 h-auto font-medium text-primary hover:text-primary/80">
                    Ler mais
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Articles */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-foreground">Todas as Notícias</h3>
          <div className="space-y-4">
            {newsArticles.map((article, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-sm transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={getCategoryColor(article.category)}>
                          {article.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {article.time}
                        </div>
                      </div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                        {article.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {article.summary}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" className="px-8">
            Carregar mais notícias
          </Button>
        </div>
      </main>
    </div>
  );
};

export default News;