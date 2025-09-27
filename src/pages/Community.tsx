import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, MessageCircle, Heart, Share2, TrendingUp, Award, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Community = () => {
  const navigate = useNavigate();

  const topContributors = [
    {
      name: "Carlos Silva",
      expertise: "Renda Variável",
      posts: 124,
      likes: 890,
      initials: "CS",
      color: "bg-primary",
    },
    {
      name: "Ana Costa",
      expertise: "Criptomoedas",
      posts: 89,
      likes: 654,
      initials: "AC",
      color: "bg-secondary",
    },
    {
      name: "Pedro Santos",
      expertise: "Renda Fixa",
      posts: 76,
      likes: 432,
      initials: "PS",
      color: "bg-warm",
    },
  ];

  const discussions = [
    {
      title: "Qual a melhor estratégia para diversificar carteira em 2024?",
      author: "Marina Lopez",
      initials: "ML",
      category: "Investimentos",
      replies: 23,
      likes: 45,
      time: "2 horas atrás",
      featured: true,
    },
    {
      title: "Vale a pena investir em fundos imobiliários agora?",
      author: "João Pereira",
      initials: "JP",
      category: "FIIs",
      replies: 18,
      likes: 32,
      time: "4 horas atrás",
      featured: false,
    },
    {
      title: "Como começar a investir com pouco dinheiro?",
      author: "Luciana Ferreira",
      initials: "LF",
      category: "Iniciantes",
      replies: 41,
      likes: 67,
      time: "6 horas atrás",
      featured: true,
    },
    {
      title: "Análise: Tesla vs BYD - qual escolher?",
      author: "Ricardo Oliveira",
      initials: "RO",
      category: "Ações",
      replies: 15,
      likes: 28,
      time: "8 horas atrás",
      featured: false,
    },
    {
      title: "Criptomoedas: ETH vs SOL para longo prazo",
      author: "Beatriz Costa",
      initials: "BC",
      category: "Cripto",
      replies: 29,
      likes: 53,
      time: "1 dia atrás",
      featured: false,
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Investimentos": "bg-primary/20 text-primary",
      "FIIs": "bg-secondary/20 text-secondary",
      "Iniciantes": "bg-warm/20 text-warm",
      "Ações": "bg-accent text-accent-foreground",
      "Cripto": "bg-primary text-primary-foreground",
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
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Comunidade</h1>
                <p className="text-sm text-muted-foreground">Conecte-se com investidores</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white mb-8 shadow-warm-lg">
          <div className="flex items-center gap-4 mb-4">
            <Users className="h-8 w-8" />
            <div>
              <h2 className="text-3xl font-bold">Comunidade de Investidores</h2>
              <p className="text-white/90 text-lg mt-2">
                Compartilhe conhecimento, tire dúvidas e conecte-se com outros investidores
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span>1.2k membros ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span>500+ discussões</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span>50+ especialistas</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Nova Discussão
              </Button>
              <Button variant="outline">
                Fazer Pergunta
              </Button>
            </div>

            {/* Discussions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Discussões Recentes</h3>
              
              {discussions.map((discussion, index) => (
                <Card 
                  key={index} 
                  className={`group cursor-pointer hover:shadow-warm transition-all duration-300 ${
                    discussion.featured ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                          {discussion.initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(discussion.category)}>
                            {discussion.category}
                          </Badge>
                          {discussion.featured && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Em alta
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {discussion.title}
                        </h4>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>por {discussion.author}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {discussion.time}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {discussion.replies}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {discussion.likes}
                            </div>
                            <Button variant="ghost" size="sm" className="p-1 h-auto">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" className="px-8">
                Ver mais discussões
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top Contribuidores
                </CardTitle>
                <CardDescription>
                  Membros mais ativos da comunidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className={`h-10 w-10 ${contributor.color}`}>
                      <AvatarFallback className="text-white font-medium">
                        {contributor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{contributor.name}</div>
                      <div className="text-sm text-muted-foreground">{contributor.expertise}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium text-foreground">{contributor.posts}</div>
                      <div className="text-muted-foreground">posts</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membros</span>
                  <span className="font-medium text-foreground">1.234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discussões</span>
                  <span className="font-medium text-foreground">567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Respostas</span>
                  <span className="font-medium text-foreground">2.890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Online agora</span>
                  <span className="font-medium text-primary">89</span>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Ações", "FIIs", "Cripto", "Renda Fixa", "Iniciantes", "Análise", "Dúvidas", "ETFs"].map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;