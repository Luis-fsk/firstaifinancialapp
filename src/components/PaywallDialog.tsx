import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallDialog({ open, onOpenChange }: PaywallDialogProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/premium');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Trial Expirado
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Seu período de teste gratuito de 30 dias terminou. 
            Assine o plano Premium para continuar aproveitando todos os recursos da plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Acesso ilimitado à IA</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Análises de mercado em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Gestão completa de finanças</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold mb-1">R$ 12,50<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            <p className="text-xs text-muted-foreground">Cancele quando quiser</p>
          </div>
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            size="lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            Assinar Premium
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
