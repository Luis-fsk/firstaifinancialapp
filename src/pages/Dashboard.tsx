import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Newspaper, Users, TrendingUp, LogOut, DollarSign, PieChart, LineChart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { FinancialGoalsSummary } from "@/components/FinancialGoalsSummary";
import growingLogo from "@/assets/growing-logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
    {
      title: "Ações",
      description: "Análise completa de ações com IA, gráficos e recomendações",
      icon: LineChart,
      path: "/stocks",
      gradient: "bg-gradient-warm-subtle",
      textColor: "text-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={growingLogo} 
                alt="Growing Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-foreground">Growing</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-gradient-hero rounded-2xl p-4 sm:p-8 text-white shadow-warm-lg">
            <div className="max-w-3xl">
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Bem-vindo ao seu centro financeiro
              </h2>
              <p className="text-white/90 text-sm sm:text-lg mb-4 sm:mb-6">
                Gerencie suas finanças com inteligência artificial, acompanhe notícias do mercado 
                e conecte-se com uma comunidade de investidores.
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Análise inteligente</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Mercado em tempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Comunidade ativa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
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
                  <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
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

        {/* Financial Goals Summary */}
        <FinancialGoalsSummary />

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-primary mb-2">100+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Análises de IA</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-secondary mb-2">50+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Notícias diárias</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-warm mb-2">1.2k</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Membros ativos</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-primary mb-2">98%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Satisfação</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;