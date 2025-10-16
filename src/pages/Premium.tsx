import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Zap, Shield, TrendingUp } from 'lucide-react';

export default function Premium() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isPremium, daysLeftInTrial, isTrialActive } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Call Mercado Pago edge function
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          userId: user.id,
          email: user.email,
          planAmount: 12.50
        }
      });

      if (error) throw error;

      // Redirect to Mercado Pago checkout
      if (data?.init_point) {
        window.location.href = data.init_point;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a assinatura. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Seja Premium</h1>
          <p className="text-muted-foreground">
            Desbloqueie todo o potencial da plataforma
          </p>
        </div>

        {isPremium ? (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Você já é Premium! 🎉</CardTitle>
                <Badge className="bg-gradient-to-r from-primary to-primary/80">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <CardDescription>
                Obrigado por apoiar nossa plataforma!
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Voltar ao Dashboard
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            {isTrialActive && (
              <Card className="mb-6 border-amber-500">
                <CardHeader>
                  <CardTitle>Trial Gratuito Ativo</CardTitle>
                  <CardDescription>
                    Você tem {daysLeftInTrial} dias restantes no seu período de teste
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Plano Premium</CardTitle>
                <CardDescription>
                  Acesso completo a todos os recursos
                </CardDescription>
                <div className="pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">R$ 12,50</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary" />
                    <span>Acesso ilimitado à IA Financeira</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <span>Análises de ações em tempo real</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>Notícias personalizadas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Gestão completa de finanças</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-primary" />
                    <span>Badge Premium exclusivo</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                  <p>✓ Pagamento via PIX, Cartão ou Boleto</p>
                  <p>✓ Cancele quando quiser</p>
                  <p>✓ Suporte prioritário</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubscribe} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                >
                  {loading ? 'Processando...' : 'Assinar Premium'}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}

        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
