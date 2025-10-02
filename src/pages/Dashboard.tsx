import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Newspaper, Users, TrendingUp, LogOut, DollarSign, PieChart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import growingLogo from "@/assets/growing-logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, sessionId } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      title: "Assistente IA",
      description: "Análise inteligente das suas finanças e recomendações personalizadas",
      icon: Bot,
      path: "/ai",
      gradient: "bg-gradient-warm",
      textColor: "text-white",
    },
    {
      title: "Finanças",
      description: "Gerencie seus gastos, investimentos e acompanhe metas financeiras",
      icon: PieChart,
      path: "/finances",
      gradient: "bg-gradient-hero",
      textColor: "text-white",
    },
    {
      title: "Notícias Financeiras",
      description: "Mantenha-se atualizado com as últimas tendências do mercado",
      icon: Newspaper,
      path: "/news",
      gradient: "bg-gradient-warm-subtle",
      textColor: "text-foreground",
    },
    {
      title: "Comunidade",
      description: "Conecte-se com outros investidores e compartilhe experiências",
      icon: Users,
      path: "/community",
      gradient: "bg-accent",
      textColor: "text-accent-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src={growingLogo} 
                alt="Growing Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">Growing</h1>
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {sessionId && (
                <div className="text-sm text-muted-foreground">
                  Session ID: <span className="font-mono text-primary">{sessionId}</span>
                </div>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-warm-lg">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold mb-4">
                Bem-vindo ao seu centro financeiro
              </h2>
              <p className="text-white/90 text-lg mb-6">
                Gerencie suas finanças com inteligência artificial, acompanhe notícias do mercado 
                e conecte-se com uma comunidade de investidores.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Análise inteligente</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Mercado em tempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Comunidade ativa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group cursor-pointer transition-all duration-300 hover:shadow-warm-lg hover:scale-105 border-border"
                onClick={() => navigate(feature.path)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${feature.textColor}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-6 group-hover:bg-muted transition-colors"
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
            <div className="text-2xl font-bold text-primary mb-2">100+</div>
            <div className="text-sm text-muted-foreground">Análises de IA</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
            <div className="text-2xl font-bold text-secondary mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Notícias diárias</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
            <div className="text-2xl font-bold text-warm mb-2">1.2k</div>
            <div className="text-sm text-muted-foreground">Membros ativos</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
            <div className="text-2xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Satisfação</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;