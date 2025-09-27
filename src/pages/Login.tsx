import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao seu app de finanças.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Erro no login",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">FinanceApp</h1>
          </div>
          <p className="text-white/80 text-lg">
            Gerencie suas finanças com inteligência
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-warm-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl text-center font-bold text-foreground">
              Entre na sua conta
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Acesse seu dashboard financeiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-border focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-border focus:ring-primary"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-warm transition-all duration-300 hover:shadow-warm-lg hover:scale-105"
              >
                Entrar
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>Controle financeiro</span>
                </div>
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-secondary" />
                  <span>IA inteligente</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;