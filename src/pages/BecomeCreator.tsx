import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Camera, Loader2, CheckCircle } from "lucide-react";

const BecomeCreator = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Faça login primeiro");
      navigate("/login");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("creator_applications")
      .insert({ user_id: user.id });

    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Você já enviou uma solicitação");
      } else {
        toast.error(error.message);
      }
      return;
    }

    setSubmitted(true);
    toast.success("Solicitação enviada!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Solicitação Enviada!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sua solicitação para se tornar criador de conteúdo foi enviada. Aguarde a aprovação do administrador.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground mb-1">Seja um Criador</h1>
          <p className="text-sm text-muted-foreground">
            Monetize seu conteúdo e conecte-se com seus fãs
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
              <Camera className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Publique conteúdo exclusivo</p>
                <p className="text-xs text-muted-foreground">Fotos, vídeos e textos para seus assinantes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Ganhe com assinaturas</p>
                <p className="text-xs text-muted-foreground">Defina preços mensais e anuais</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Após enviar a solicitação, um administrador irá analisar e aprovar seu perfil.
          </p>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar Solicitação
          </button>
        </div>
      </div>
    </div>
  );
};

export default BecomeCreator;
