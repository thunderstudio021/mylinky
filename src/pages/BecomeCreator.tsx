import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Clock, XCircle, ChevronRight, ChevronLeft, Upload, Camera, User, FileText, Shield } from "lucide-react";

const BecomeCreator = () => {
  const { user, profile, isCreator, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingApp, setCheckingApp] = useState(true);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Step 3
  const [docFrontFile, setDocFrontFile] = useState<File | null>(null);
  const [docBackFile, setDocBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isCreator || isAdmin) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const checkApplication = async () => {
      if (!user) { setCheckingApp(false); return; }
      const { data } = await supabase
        .from("creator_applications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setAppStatus(data.status);
        if (data.status === "approved") await refreshProfile();
      }
      setCheckingApp(false);
    };
    checkApplication();
  }, [user, isCreator, isAdmin]);

  useEffect(() => {
    if (appStatus === "approved" && (isCreator || isAdmin)) {
      navigate("/dashboard", { replace: true });
    }
  }, [isCreator, isAdmin, appStatus]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleFileSelect = (file: File, setter: (f: File) => void, previewSetter: (s: string) => void) => {
    setter(file);
    const reader = new FileReader();
    reader.onload = (e) => previewSetter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const ext = file.name.split(".").pop();
    const filePath = `${path}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadPrivateFile = async (file: File, path: string) => {
    const ext = file.name.split(".").pop();
    const filePath = `${user!.id}/${path}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(filePath, file);
    if (error) throw error;
    // For private bucket, we store the path, admin will use signed URLs
    return filePath;
  };

  const canProceedStep1 = fullName.trim().length >= 3 && cpf.replace(/\D/g, "").length === 11 && phone.replace(/\D/g, "").length >= 10;
  const canProceedStep2 = avatarFile && coverFile;
  const canSubmit = docFrontFile && docBackFile && selfieFile;

  const handleSubmit = async () => {
    if (!user) { toast.error("Faça login primeiro"); navigate("/login"); return; }
    setLoading(true);
    try {
      // Upload profile photos to public media bucket
      const avatarUrl = await uploadFile(avatarFile!, "media", `avatars/${user.id}`);
      const coverUrl = await uploadFile(coverFile!, "media", `covers/${user.id}`);

      // Upload documents to private bucket
      const docFrontPath = await uploadPrivateFile(docFrontFile!, "doc_front");
      const docBackPath = await uploadPrivateFile(docBackFile!, "doc_back");
      const selfiePath = await uploadPrivateFile(selfieFile!, "selfie");

      // Update profile with avatar and cover
      await supabase.from("profiles").update({
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        name: fullName,
      }).eq("id", user.id);

      // Create application
      const { error } = await supabase.from("creator_applications").insert({
        user_id: user.id,
        full_name: fullName,
        cpf: cpf.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        document_front_url: docFrontPath,
        document_back_url: docBackPath,
        selfie_url: selfiePath,
      });

      if (error) {
        if (error.code === "23505") toast.error("Você já enviou uma solicitação");
        else toast.error(error.message);
        setLoading(false);
        return;
      }

      setAppStatus("pending");
      toast.success("Solicitação enviada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "Tente novamente"));
    }
    setLoading(false);
  };

  if (checkingApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Status screens
  if (appStatus === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Solicitação em Análise</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sua solicitação está sendo analisada. Você será notificado quando for aprovado.
          </p>
          <button onClick={() => navigate("/")} className="px-6 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (appStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Solicitação Recusada</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Infelizmente sua solicitação não foi aprovada. Entre em contato com o suporte.
          </p>
          <button onClick={() => navigate("/")} className="px-6 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (appStatus === "approved") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Você é um Criador!</h1>
          <p className="text-sm text-muted-foreground mb-6">Sua conta foi aprovada. Redirecionando...</p>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground mb-1">Seja um Criador</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados para verificação</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step === s ? "bg-foreground text-background" : step > s ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-500/40" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">Dados Pessoais</h2>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Número de contato</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Profile Photos */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">Fotos do Perfil</h2>
              </div>

              <FileUploadArea
                label="Foto de Perfil"
                preview={avatarPreview}
                onSelect={(f) => handleFileSelect(f, setAvatarFile, setAvatarPreview)}
                round
              />
              <FileUploadArea
                label="Foto de Capa"
                preview={coverPreview}
                onSelect={(f) => handleFileSelect(f, setCoverFile, setCoverPreview)}
                aspect="wide"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">Verificação de Identidade</h2>
              </div>

              <FileUploadArea
                label="Documento (Frente)"
                preview={docFrontPreview}
                onSelect={(f) => handleFileSelect(f, setDocFrontFile, setDocFrontPreview)}
              />
              <FileUploadArea
                label="Documento (Verso)"
                preview={docBackPreview}
                onSelect={(f) => handleFileSelect(f, setDocBackFile, setDocBackPreview)}
              />
              <FileUploadArea
                label="Selfie segurando o documento"
                preview={selfiePreview}
                onSelect={(f) => handleFileSelect(f, setSelfieFile, setSelfiePreview)}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="flex-1 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {loading ? "Enviando..." : "Enviar para análise"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// File Upload Component
const FileUploadArea = ({
  label, preview, onSelect, round, aspect,
}: {
  label: string;
  preview: string | null;
  onSelect: (file: File) => void;
  round?: boolean;
  aspect?: "wide";
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type="file"
        ref={ref}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`w-full border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-muted-foreground/50 transition-colors ${
          aspect === "wide" ? "h-28" : round ? "h-28 w-28 mx-auto rounded-full" : "h-32"
        } flex items-center justify-center bg-secondary/50`}
      >
        {preview ? (
          <img src={preview} alt="" className={`w-full h-full object-cover ${round ? "rounded-full" : ""}`} />
        ) : (
          <div className="text-center">
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <span className="text-xs text-muted-foreground">Clique para enviar</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default BecomeCreator;
