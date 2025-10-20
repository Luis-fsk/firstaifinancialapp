import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, PlusCircle, Target, Sparkles, TrendingUp, DollarSign, PiggyBank, Rocket, Home, GraduationCap, Plane, Car, Heart, Edit, Trash2, CheckCircle2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { UserMenu } from "@/components/UserMenu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import growingLogo from "@/assets/growing-logo-new.png";
import DOMPurify from 'dompurify';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'savings' | 'investment' | 'purchase' | 'education' | 'travel' | 'other';
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: Date;
}

const goalCategories = [
  { value: 'savings', label: 'Poupança', icon: PiggyBank, color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { value: 'investment', label: 'Investimento', icon: TrendingUp, color: 'bg-gradient-to-br from-green-500 to-green-600' },
  { value: 'purchase', label: 'Compra', icon: Home, color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  { value: 'education', label: 'Educação', icon: GraduationCap, color: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  { value: 'travel', label: 'Viagem', icon: Plane, color: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
  { value: 'other', label: 'Outro', icon: Target, color: 'bg-gradient-to-br from-orange-500 to-orange-600' },
];

const formatMessage = (text: string): string => {
  let formatted = text;
  
  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Headers
  formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  
  // Tables
  const tableRegex = /\|(.+)\|\n\|[-: |]+\|\n((?:\|.+\|\n?)+)/g;
  formatted = formatted.replace(tableRegex, (match, header, rows) => {
    const headerCells = header.split('|').filter(Boolean).map((cell: string) => 
      `<th class="border border-border px-4 py-2 bg-muted">${cell.trim()}</th>`
    ).join('');
    
    const bodyRows = rows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter(Boolean).map((cell: string) => 
        `<td class="border border-border px-4 py-2">${cell.trim()}</td>`
      ).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    return `<table class="border-collapse border border-border my-4"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  });
  
  // Preserve line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Sanitize HTML to prevent XSS attacks
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['strong', 'em', 'br', 'table', 'tbody', 'tr', 'td', 'th', 'h2', 'h3', 'div', 'thead'],
    ALLOWED_ATTR: ['class']
  });
};

const Goals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedGoalForAI, setSelectedGoalForAI] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'savings' as Goal['category'],
    targetAmount: '',
    currentAmount: '0',
    deadline: ''
  });

  // Load goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
      const parsed = JSON.parse(savedGoals);
      setGoals(parsed.map((g: any) => ({ ...g, createdAt: new Date(g.createdAt) })));
    }
  }, []);

  // Save goals to localStorage
  const saveGoals = (updatedGoals: Goal[]) => {
    localStorage.setItem('userGoals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount) {
      toast.error("Preencha pelo menos o título e o valor alvo");
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount),
      deadline: newGoal.deadline || undefined,
      createdAt: new Date()
    };

    saveGoals([...goals, goal]);
    setIsAddDialogOpen(false);
    setNewGoal({
      title: '',
      description: '',
      category: 'savings',
      targetAmount: '',
      currentAmount: '0',
      deadline: ''
    });
    toast.success("Meta criada com sucesso!");
  };

  const handleUpdateProgress = (goalId: string, newAmount: string) => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) return;

    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, currentAmount: amount }
        : goal
    );
    saveGoals(updatedGoals);
    toast.success("Progresso atualizado!");
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
    toast.success("Meta excluída");
  };

  const handleEditGoal = () => {
    if (!editingGoal) return;

    const updatedGoals = goals.map(goal =>
      goal.id === editingGoal.id ? editingGoal : goal
    );
    saveGoals(updatedGoals);
    setIsEditDialogOpen(false);
    setEditingGoal(null);
    toast.success("Meta atualizada!");
  };

  const getAITips = async (goal: Goal) => {
    setSelectedGoalForAI(goal);
    setIsLoadingAI(true);
    setIsAIDialogOpen(true);
    setAiResponse("");

    try {
      const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1);
      const remaining = goal.targetAmount - goal.currentAmount;
      const categoryLabels = {
        savings: 'Poupança',
        investment: 'Investimento',
        purchase: 'Compra',
        education: 'Educação',
        travel: 'Viagem',
        other: 'Outro'
      };

      const goalContext = `
Meta: ${goal.title}
Categoria: ${categoryLabels[goal.category]}
Descrição: ${goal.description || 'Sem descrição'}
Valor Alvo: R$ ${goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Atual: R$ ${goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Faltam: R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Progresso: ${progress}%
${goal.deadline ? `Prazo: ${new Date(goal.deadline).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}
      `;

      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          message: `Você é um consultor financeiro especializado em planejamento de metas. 

Analise a meta financeira abaixo e forneça um plano detalhado e personalizado:

${goalContext}

Forneça:
1. **Análise do Progresso Atual**: Avalie onde a pessoa está e o que já conquistou
2. **Plano de Ação Específico**: Dicas práticas e acionáveis para alcançar esta meta
3. **Estratégias de Economia**: Como economizar e acelerar o progresso
4. **Sugestões de Investimento**: Se aplicável, onde investir o dinheiro poupado
5. **Cronograma Sugerido**: Timeline realista para alcançar a meta
6. **Motivação**: Mensagem encorajadora e próximos passos

Seja MUITO específico, prático e motivador. Use números, exemplos concretos e cálculos quando possível.`,
          conversationHistory: []
        }
      });

      if (error) throw error;

      setAiResponse(data.message || "Não foi possível gerar dicas no momento.");
    } catch (error: any) {
      console.error('Erro ao obter dicas da IA:', error);
      toast.error("Erro ao gerar dicas. Tente novamente.");
      setAiResponse("Erro ao gerar dicas. Por favor, tente novamente mais tarde.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = goalCategories.find(c => c.value === category);
    return cat ? cat.icon : Target;
  };

  const getCategoryColor = (category: string) => {
    const cat = goalCategories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src={growingLogo} 
                alt="Growing Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">Metas Financeiras</h1>
                <p className="text-sm text-muted-foreground">Planeje e acompanhe seus objetivos</p>
              </div>
            </div>
            
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-warm-lg mb-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-10 w-10" />
              <h2 className="text-3xl font-bold">Seus Objetivos Financeiros</h2>
            </div>
            <p className="text-white/90 text-lg mb-6">
              Defina suas metas, acompanhe seu progresso e receba dicas personalizadas da IA para alcançar seus objetivos.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-white text-primary hover:bg-white/90"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Nova Meta
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{goals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{activeGoals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedGoals.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="active">Em Andamento ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">Concluídas ({completedGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeGoals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma meta em andamento</h3>
                  <p className="text-muted-foreground mb-4">Comece criando sua primeira meta financeira!</p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Criar Meta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {activeGoals.map((goal) => {
                  const Icon = getCategoryIcon(goal.category);
                  const progress = calculateProgress(goal);
                  
                  return (
                    <Card key={goal.id} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-16 h-16 ${getCategoryColor(goal.category)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <Icon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl mb-1">{goal.title}</CardTitle>
                              <CardDescription>{goal.description}</CardDescription>
                              {goal.deadline && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingGoal(goal);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGoal(goal.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-foreground">
                              R$ {goal.currentAmount.toFixed(2)}
                            </span>
                            <span className="text-muted-foreground">
                              Meta: R$ {goal.targetAmount.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={progress} className="h-3 mb-2" />
                          <p className="text-sm text-right text-muted-foreground">
                            {progress.toFixed(1)}% concluído
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Valor atual"
                            defaultValue={goal.currentAmount}
                            onBlur={(e) => handleUpdateProgress(goal.id, e.target.value)}
                            className="flex-1"
                          />
                          <Button variant="outline">Atualizar</Button>
                        </div>
                        <Button 
                          onClick={() => getAITips(goal)}
                          className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                        >
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Dicas da IA para esta Meta
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedGoals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma meta concluída ainda</h3>
                  <p className="text-muted-foreground">Continue trabalhando em suas metas!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {completedGoals.map((goal) => {
                  const Icon = getCategoryIcon(goal.category);
                  
                  return (
                    <Card key={goal.id} className="overflow-hidden border-green-500">
                      <CardHeader className="pb-4 bg-green-50 dark:bg-green-950">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-16 h-16 ${getCategoryColor(goal.category)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <Icon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-xl">{goal.title}</CardTitle>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                              <CardDescription>{goal.description}</CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Valor alcançado</p>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {goal.currentAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Meta</p>
                            <p className="text-2xl font-bold">
                              R$ {goal.targetAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Goal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Meta</DialogTitle>
            <DialogDescription>
              Defina uma meta financeira e acompanhe seu progresso ao longo do tempo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Título da Meta *</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="Ex: Comprar um carro"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Descreva sua meta..."
              />
            </div>
            <div>
              <Label>Categoria *</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {goalCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.value}
                      type="button"
                      variant={newGoal.category === cat.value ? "default" : "outline"}
                      className={`h-auto py-4 flex-col gap-2 ${newGoal.category === cat.value ? cat.color + ' text-white' : ''}`}
                      onClick={() => setNewGoal({ ...newGoal, category: cat.value as Goal['category'] })}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs">{cat.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetAmount">Valor Alvo *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currentAmount">Valor Atual</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="deadline">Prazo (Opcional)</Label>
              <Input
                id="deadline"
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddGoal}>
              Criar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
            <DialogDescription>
              Atualize as informações da sua meta financeira.
            </DialogDescription>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-title">Título da Meta</Label>
                <Input
                  id="edit-title"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingGoal.description}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {goalCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Button
                        key={cat.value}
                        type="button"
                        variant={editingGoal.category === cat.value ? "default" : "outline"}
                        className={`h-auto py-4 flex-col gap-2 ${editingGoal.category === cat.value ? cat.color + ' text-white' : ''}`}
                        onClick={() => setEditingGoal({ ...editingGoal, category: cat.value as Goal['category'] })}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs">{cat.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-targetAmount">Valor Alvo</Label>
                  <Input
                    id="edit-targetAmount"
                    type="number"
                    value={editingGoal.targetAmount}
                    onChange={(e) => setEditingGoal({ ...editingGoal, targetAmount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-currentAmount">Valor Atual</Label>
                  <Input
                    id="edit-currentAmount"
                    type="number"
                    value={editingGoal.currentAmount}
                    onChange={(e) => setEditingGoal({ ...editingGoal, currentAmount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-deadline">Prazo</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={editingGoal.deadline || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditGoal}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Tips Dialog */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              Dicas Personalizadas da IA
            </DialogTitle>
            <DialogDescription>
              {selectedGoalForAI ? `Análise detalhada: ${selectedGoalForAI.title}` : 'Análise inteligente da sua meta financeira'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingAI ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Analisando suas metas...</p>
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMessage(aiResponse) }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
