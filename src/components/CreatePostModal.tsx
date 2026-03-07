import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Video, FileText, BarChart3, X, Image, Upload, Eye, Crown, DollarSign, Lock, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PostType = "free" | "subscribers" | "ppv" | "ppv-subscribers";
type ContentType = "photo" | "video" | "text" | "poll";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

const postTypeOptions: { value: PostType; label: string; icon: any; description: string }[] = [
  { value: "free", label: "Público", icon: Eye, description: "Visível para todos" },
  { value: "subscribers", label: "Assinantes", icon: Crown, description: "Somente para assinantes" },
  { value: "ppv", label: "Pague para ver", icon: DollarSign, description: "Defina um valor para desbloquear" },
  { value: "ppv-subscribers", label: "Assinantes + Pago", icon: Lock, description: "Assinantes pagam para ver" },
];

const CreatePostModal = ({ open, onClose }: CreatePostModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"type" | "form">("type");
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [postType, setPostType] = useState<PostType>("free");
  const [ppvPrice, setPpvPrice] = useState("");
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("type");
    setContentType(null);
    setPostType("free");
    setPpvPrice("");
    setText("");
    setMediaPreview(null);
    setMediaFile(null);
    setPollOptions(["", ""]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectContentType = (type: ContentType) => {
    setContentType(type);
    setStep("form");
    if (type === "photo" || type === "video") {
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const needsPostType = contentType === "photo" || contentType === "video";

  const handlePublish = () => {
    if (!text.trim() && !mediaFile && contentType !== "poll") {
      toast.error("Adicione conteúdo à sua publicação");
      return;
    }
    if (contentType === "poll") {
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast.error("Adicione pelo menos 2 opções na enquete");
        return;
      }
    }
    if ((postType === "ppv" || postType === "ppv-subscribers") && (!ppvPrice || parseFloat(ppvPrice) <= 0)) {
      toast.error("Defina um valor válido para o conteúdo pago");
      return;
    }

    toast.success("Publicação criada com sucesso!");
    handleClose();
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, ""]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end md:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 mb-20 md:mb-0 bg-card border border-border rounded-xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              {step === "form" ? (
                <button onClick={() => { setStep("type"); setMediaPreview(null); setMediaFile(null); }} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-5" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {step === "type" ? "Criar publicação" : contentType === "photo" ? "Nova foto" : contentType === "video" ? "Novo vídeo" : contentType === "text" ? "Novo texto" : "Nova enquete"}
              </span>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === "type" ? (
              /* Step 1: Choose content type */
              <div className="p-5">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "photo" as ContentType, icon: Camera, label: "Foto" },
                    { type: "video" as ContentType, icon: Video, label: "Vídeo" },
                    { type: "text" as ContentType, icon: FileText, label: "Texto" },
                    { type: "poll" as ContentType, icon: BarChart3, label: "Enquete" },
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => selectContentType(opt.type)}
                      className="flex items-center gap-3 p-4 rounded-lg hover:bg-secondary transition-colors text-left border border-border"
                    >
                      <opt.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Step 2: Create form */
              <div className="overflow-y-auto flex-1">
                <div className="p-4 space-y-4">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground text-sm font-semibold overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        profile?.name?.[0] || "U"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile?.name}</p>
                      <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                    </div>
                  </div>

                  {/* Text input */}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={contentType === "text" ? "O que você quer compartilhar?" : "Escreva uma legenda..."}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground min-h-[80px]"
                    rows={3}
                  />

                  {/* Media preview / upload */}
                  {(contentType === "photo" || contentType === "video") && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={contentType === "photo" ? "image/*" : "video/*"}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {mediaPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-border">
                          {contentType === "photo" ? (
                            <img src={mediaPreview} alt="" className="w-full max-h-64 object-cover" />
                          ) : (
                            <video src={mediaPreview} className="w-full max-h-64 object-cover" controls />
                          )}
                          <button
                            onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-10 border-2 border-dashed border-border rounded-lg flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                        >
                          <Upload className="w-6 h-6" />
                          <span className="text-sm">Selecionar {contentType === "photo" ? "foto" : "vídeo"}</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Poll options */}
                  {contentType === "poll" && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Opções da enquete</p>
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={opt}
                            onChange={(e) => {
                              const updated = [...pollOptions];
                              updated[i] = e.target.value;
                              setPollOptions(updated);
                            }}
                            placeholder={`Opção ${i + 1}`}
                            className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                          />
                          {pollOptions.length > 2 && (
                            <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 6 && (
                        <button onClick={addPollOption} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          + Adicionar opção
                        </button>
                      )}
                    </div>
                  )}

                  {/* Post type selector (only for photo/video) */}
                  {needsPostType && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Tipo de publicação</p>
                      <div className="space-y-1.5">
                        {postTypeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPostType(opt.value)}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors border ${
                              postType === opt.value
                                ? "border-foreground/30 bg-secondary"
                                : "border-border hover:bg-secondary/50"
                            }`}
                          >
                            <opt.icon className={`w-4 h-4 ${postType === opt.value ? "text-foreground" : "text-muted-foreground"}`} />
                            <div>
                              <p className={`text-sm ${postType === opt.value ? "font-medium text-foreground" : "text-muted-foreground"}`}>{opt.label}</p>
                              <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* PPV price input */}
                      {(postType === "ppv" || postType === "ppv-subscribers") && (
                        <div className="mt-3">
                          <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
                          <input
                            type="number"
                            value={ppvPrice}
                            onChange={(e) => setPpvPrice(e.target.value)}
                            placeholder="Ex: 29.90"
                            min="1"
                            step="0.01"
                            className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Publish button */}
                <div className="p-4 border-t border-border">
                  <button
                    onClick={handlePublish}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Publicar
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
