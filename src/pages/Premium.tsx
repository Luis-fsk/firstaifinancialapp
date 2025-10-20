import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Zap, Shield, TrendingUp, Tag } from 'lucide-react';

export default function Premium() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isPremium, daysLeftInTrial, isTrialActive } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');

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
      // Send promo code to server for validation - never trust client!
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          userId: user.id,
          email: user.email,
          promoCode: promoCode.trim() || undefined
        }
      });

      if (error) throw error;

      // Redirecionar diretamente para o checkout do Mercado Pago
      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a assinatura. Tente novamente.",
        variant: "destructive"
      });
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
              <CardContent className="space-y-6">
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

                <Tabs defaultValue="payment" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="payment">Pagamento</TabsTrigger>
                    <TabsTrigger value="promo">
                      <Tag className="w-4 h-4 mr-2" />
                      Código Promocional
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="payment" className="space-y-4 pt-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>✓ Pagamento seguro via Mercado Pago</p>
                      <p>✓ Cancele quando quiser</p>
                      <p>✓ Suporte prioritário</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="promo" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo-code">Código Promocional</Label>
                      <Input
                        id="promo-code"
                        placeholder="Digite seu código"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="uppercase"
                      />
                      <p className="text-xs text-muted-foreground">
                        Insira seu código promocional para obter desconto
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubscribe} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                >
                  {loading ? 'Redirecionando...' : 'Assinar Premium'}
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
