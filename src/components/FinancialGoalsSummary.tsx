import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, Award } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'fixed' | 'variable' | 'investment';
  target: number;
  progress: number;
  isCompleted: boolean;
}

export const FinancialGoalsSummary = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoals = () => {
      const savedGoals = localStorage.getItem('financeGoals');
      
      if (savedGoals) {
        const parsedGoals = JSON.parse(savedGoals);
        setGoals(parsedGoals);
      }
      setLoading(false);
    };

    loadGoals();

    // Listener para mudanças no localStorage (sincronização entre abas/componentes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'financeGoals') {
        loadGoals();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Polling para atualizações em tempo real na mesma aba
    const interval = setInterval(loadGoals, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (loading || goals.length === 0) {
    return null;
  }

  const completedGoals = goals.filter(g => g.isCompleted).length;
  const totalProgress = goals.reduce((acc, goal) => acc + Math.min((goal.progress / goal.target) * 100, 100), 0) / goals.length;

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Relatório Mensal de Finanças
        </h3>
        <p className="text-muted-foreground">Acompanhe o progresso das suas metas financeiras em tempo real</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card de Resumo */}
        <Card className="bg-gradient-warm text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Progresso Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{totalProgress.toFixed(0)}%</div>
            <p className="text-sm text-white/80">{completedGoals} de {goals.length} metas concluídas</p>
          </CardContent>
        </Card>

        {/* Cards das Metas */}
        {goals.map((goal) => {
          const percentage = Math.min((goal.progress / goal.target) * 100, 100);
          const isOverBudget = goal.category !== 'investment' && goal.progress > goal.target;
          
          return (
            <Card key={goal.id} className={goal.isCompleted ? "border-green-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">{goal.title}</CardTitle>
                  {goal.isCompleted ? (
                    <Award className="h-4 w-4 text-green-500" />
                  ) : isOverBudget ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <CardDescription className="text-xs">{goal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">R$ {goal.progress.toFixed(2)}</span>
                    <span className="text-muted-foreground">R$ {goal.target.toFixed(2)}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className={`text-xs ${isOverBudget ? 'text-red-500' : goal.isCompleted ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {percentage.toFixed(1)}% {goal.isCompleted ? '✓ Concluída' : isOverBudget ? '⚠ Acima do planejado' : 'em andamento'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
