import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, PlusCircle, DollarSign, TrendingUp, Target, Award } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { toast } from "sonner";

interface QuizAnswers {
  fixedExpenses: number;
  variableExpenses: number;
  investments: number;
}

interface Expense {
  id: string;
  amount: number;
  category: 'fixed' | 'variable' | 'investment';
  description: string;
  location?: string;
  date: Date;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'fixed' | 'variable' | 'investment';
  target: number;
  progress: number;
  isCompleted: boolean;
}

const Finances = () => {
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    fixedExpenses: 0,
    variableExpenses: 0,
    investments: 0
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
    location: ''
  });

  // Calcular metas baseadas nas despesas reais
  const calculateGoals = (): Goal[] => {
    const fixed = expenses.filter(exp => exp.category === 'fixed').reduce((sum, exp) => sum + exp.amount, 0);
    const variable = expenses.filter(exp => exp.category === 'variable').reduce((sum, exp) => sum + exp.amount, 0);
    const investment = expenses.filter(exp => exp.category === 'investment').reduce((sum, exp) => sum + exp.amount, 0);

    return [
      {
        id: '1',
        title: 'Reduzir gastos fixos',
        description: 'Economize 10% nos gastos fixos este mês',
        category: 'fixed',
        target: quizAnswers.fixedExpenses * 0.9, // Meta: 90% do planejado
        progress: fixed,
        isCompleted: fixed <= quizAnswers.fixedExpenses * 0.9
      },
      {
        id: '2',
        title: 'Controlar gastos variáveis',
        description: `Mantenha gastos variáveis abaixo de R$ ${quizAnswers.variableExpenses.toFixed(2)}`,
        category: 'variable',
        target: quizAnswers.variableExpenses,
        progress: variable,
        isCompleted: variable <= quizAnswers.variableExpenses
      },
      {
        id: '3',
        title: 'Aumentar investimentos',
        description: `Invista pelo menos R$ ${quizAnswers.investments.toFixed(2)} este mês`,
        category: 'investment',
        target: quizAnswers.investments,
        progress: investment,
        isCompleted: investment >= quizAnswers.investments
      }
    ];
  };

  const monthlyGoals = calculateGoals();

  // Load data from localStorage
  useEffect(() => {
    const savedQuizAnswers = localStorage.getItem('financeQuizAnswers');
    const savedExpenses = localStorage.getItem('financeExpenses');
    
    if (savedQuizAnswers) {
      setQuizAnswers(JSON.parse(savedQuizAnswers));
      setShowQuiz(false);
    }
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses).map((exp: any) => ({
        ...exp,
        date: new Date(exp.date)
      })));
    }
  }, []);

  const handleQuizSubmit = () => {
    if (quizAnswers.fixedExpenses === 0 || quizAnswers.variableExpenses === 0) {
      toast.error("Por favor, preencha todos os campos do quiz");
      return;
    }
    
    localStorage.setItem('financeQuizAnswers', JSON.stringify(quizAnswers));
    setShowQuiz(false);
    toast.success("Quiz concluído! Bem-vindo às suas finanças pessoais.");
  };

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.category || !newExpense.description) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(newExpense.amount),
      category: newExpense.category as 'fixed' | 'variable' | 'investment',
      description: newExpense.description,
      location: newExpense.location,
      date: new Date()
    };

    const updatedExpenses = [...expenses, expense];
    setExpenses(updatedExpenses);
    localStorage.setItem('financeExpenses', JSON.stringify(updatedExpenses));
    
    // Salvar dados financeiros para o Dashboard
    const goals = calculateGoalsForExpenses(updatedExpenses);
    localStorage.setItem('financeGoals', JSON.stringify(goals));
    
    setNewExpense({ amount: '', category: '', description: '', location: '' });
    toast.success("Gasto adicionado com sucesso!");
  };

  const calculateGoalsForExpenses = (expensesList: Expense[]): Goal[] => {
    const fixed = expensesList.filter(exp => exp.category === 'fixed').reduce((sum, exp) => sum + exp.amount, 0);
    const variable = expensesList.filter(exp => exp.category === 'variable').reduce((sum, exp) => sum + exp.amount, 0);
    const investment = expensesList.filter(exp => exp.category === 'investment').reduce((sum, exp) => sum + exp.amount, 0);

    return [
      {
        id: '1',
        title: 'Reduzir gastos fixos',
        description: 'Economize 10% nos gastos fixos este mês',
        category: 'fixed',
        target: quizAnswers.fixedExpenses * 0.9,
        progress: fixed,
        isCompleted: fixed <= quizAnswers.fixedExpenses * 0.9
      },
      {
        id: '2',
        title: 'Controlar gastos variáveis',
        description: `Mantenha gastos variáveis abaixo de R$ ${quizAnswers.variableExpenses.toFixed(2)}`,
        category: 'variable',
        target: quizAnswers.variableExpenses,
        progress: variable,
        isCompleted: variable <= quizAnswers.variableExpenses
      },
      {
        id: '3',
        title: 'Aumentar investimentos',
        description: `Invista pelo menos R$ ${quizAnswers.investments.toFixed(2)} este mês`,
        category: 'investment',
        target: quizAnswers.investments,
        progress: investment,
        isCompleted: investment >= quizAnswers.investments
      }
    ];
  };

  const getExpensesByCategory = () => {
    const fixed = expenses.filter(exp => exp.category === 'fixed').reduce((sum, exp) => sum + exp.amount, 0);
    const variable = expenses.filter(exp => exp.category === 'variable').reduce((sum, exp) => sum + exp.amount, 0);
    const investment = expenses.filter(exp => exp.category === 'investment').reduce((sum, exp) => sum + exp.amount, 0);

    return [
      { name: 'Fixos', value: fixed, color: '#3b82f6' },
      { name: 'Variáveis', value: variable, color: '#ef4444' },
      { name: 'Investimentos', value: investment, color: '#10b981' }
    ];
  };

  const getMonthlyExpenseData = () => {
    const currentMonth = new Date().getMonth();
    const monthlyExpenses = expenses.filter(exp => exp.date.getMonth() === currentMonth);
    
    const dailyData: { [key: string]: { fixed: number; variable: number; investment: number } } = {};
    
    monthlyExpenses.forEach(exp => {
      const day = exp.date.getDate().toString();
      if (!dailyData[day]) {
        dailyData[day] = { fixed: 0, variable: 0, investment: 0 };
      }
      dailyData[day][exp.category] += exp.amount;
    });

    return Object.entries(dailyData).map(([day, data]) => ({
      day: `Dia ${day}`,
      ...data
    })).slice(0, 10); // Últimos 10 dias
  };

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center gap-2 justify-center">
              <DollarSign className="h-8 w-8 text-primary" />
              Quiz Financeiro
            </CardTitle>
            <CardDescription>
              Vamos conhecer melhor seus hábitos financeiros para personalizar sua experiência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="fixed">Quanto você gasta em média por mês com gastos fixos? (R$)</Label>
              <Input
                id="fixed"
                type="number"
                placeholder="Ex: 2500"
                value={quizAnswers.fixedExpenses}
                onChange={(e) => setQuizAnswers(prev => ({ ...prev, fixedExpenses: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Gastos fixos: aluguel, financiamentos, assinaturas, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="variable">Quanto você gasta em média por mês com gastos variáveis? (R$)</Label>
              <Input
                id="variable"
                type="number"
                placeholder="Ex: 1200"
                value={quizAnswers.variableExpenses}
                onChange={(e) => setQuizAnswers(prev => ({ ...prev, variableExpenses: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Gastos variáveis: alimentação, transporte, lazer, compras, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="investments">Quanto você investe em média por mês? (R$)</Label>
              <Input
                id="investments"
                type="number"
                placeholder="Ex: 800"
                value={quizAnswers.investments}
                onChange={(e) => setQuizAnswers(prev => ({ ...prev, investments: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Investimentos: poupança, ações, fundos, criptomoedas, etc.
              </p>
            </div>

            <Button onClick={handleQuizSubmit} className="w-full bg-gradient-warm hover:bg-gradient-warm/90">
              Iniciar Jornada Financeira
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Finanças Pessoais</h1>
                <p className="text-sm text-muted-foreground">Gerencie seus gastos e investimentos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Add Expense Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  Adicionar Gasto
                </CardTitle>
                <CardDescription>
                  Registre um novo gasto ou investimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0,00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={newExpense.category} 
                      onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixo</SelectItem>
                        <SelectItem value="variable">Variável</SelectItem>
                        <SelectItem value="investment">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Supermercado, Aluguel, Ações..."
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Local (opcional)</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Shopping, Online, Banco..."
                      value={newExpense.location}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddExpense} className="mt-4 bg-gradient-warm hover:bg-gradient-warm/90">
                  Adicionar Gasto
                </Button>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Gastos</CardTitle>
                  <CardDescription>Gastos por categoria este mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getExpensesByCategory()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getExpensesByCategory().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Dia</CardTitle>
                  <CardDescription>Últimos 10 dias com atividade</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getMonthlyExpenseData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
                      <Legend />
                      <Bar dataKey="fixed" fill="#3b82f6" name="Fixos" />
                      <Bar dataKey="variable" fill="#ef4444" name="Variáveis" />
                      <Bar dataKey="investment" fill="#10b981" name="Investimentos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Gastos Recentes</CardTitle>
                <CardDescription>Últimos lançamentos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses.slice(-5).reverse().map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          expense.category === 'fixed' ? 'bg-blue-500' :
                          expense.category === 'variable' ? 'bg-red-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.location && `${expense.location} • `}
                            {expense.date.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {expense.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground capitalize">{expense.category}</p>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum gasto registrado ainda. Adicione seu primeiro gasto acima!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Goals */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Metas do Mês
                </CardTitle>
                <CardDescription>
                  Desafios para melhorar suas finanças
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {monthlyGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className={`h-4 w-4 ${goal.isCompleted ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{goal.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{goal.description}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>R$ {goal.progress.toFixed(2)}</span>
                        <span>R$ {goal.target.toFixed(2)}</span>
                      </div>
                      <Progress 
                        value={Math.min((goal.progress / goal.target) * 100, 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {((goal.progress / goal.target) * 100).toFixed(1)}% concluído
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dicas Financeiras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Use a regra 50-30-20 para dividir sua renda
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  Revise gastos fixos mensalmente
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Invista pelo menos 10% da renda
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-warm rounded-full" />
                  Mantenha uma reserva de emergência
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Finances;