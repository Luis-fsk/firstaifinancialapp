import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import growingLogo from "@/assets/growing-logo-new.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        // Create AI session ID for the user
        const sessionId = `${username || data.user.email?.split('@')[0]}_${Date.now()}`;
        
        await supabase.from('ai_sessions').upsert({
          user_id: data.user.id,
          session_id: sessionId,
          last_activity: new Date().toISOString()
        });

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao seu app de finanças.",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!username.trim()) {
        toast({
          title: "Username obrigatório",
          description: "Por favor, insira um nome de usuário.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
            display_name: displayName || username,
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique seu email para redefinir sua senha.",
      });
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-1 mb-4 -ml-12">
            <img 
              src={growingLogo} 
              alt="Growing Logo" 
              className="h-24 w-24 object-contain"
            />
            <h1 className="text-3xl font-bold text-white mt-5 -ml-2">Growing</h1>
          </div>
          <p className="text-white/80 text-lg">
            Gerencie suas finanças com inteligência
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-warm-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl text-center font-bold text-foreground">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Entre ou crie sua conta no Growing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {!showResetPassword ? (
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-border focus:ring-primary"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="login-password" className="text-sm font-medium">
                          Senha
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 border-border focus:ring-primary"
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-warm transition-all duration-300 hover:shadow-warm-lg hover:scale-105"
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="h-11 border-border focus:ring-primary"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowResetPassword(false)}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? "Enviando..." : "Enviar"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-sm font-medium">
                      Nome de Usuário
                    </Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="meuusername"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 border-border focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-display-name" className="text-sm font-medium">
                      Nome de Exibição (opcional)
                    </Label>
                    <Input
                      id="signup-display-name"
                      type="text"
                      placeholder="Meu Nome Completo"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-11 border-border focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 border-border focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">
                      Senha
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 border-border focus:ring-primary"
                      required
                      minLength={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium shadow-warm transition-all duration-300 hover:shadow-warm-lg hover:scale-105"
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-col items-center gap-4">
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
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <a href="/terms" className="hover:text-primary transition-colors">
                    Termos de Uso
                  </a>
                  <span>•</span>
                  <a href="/privacy" className="hover:text-primary transition-colors">
                    Política de Privacidade
                  </a>
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