import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Video, FileText, BarChart3, X, Image, Upload, Eye, Crown, DollarSign, ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppAvatar } from "./AppAvatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage, compressVideo, formatBytes } from "@/lib/mediaCompressor";

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
];

const CreatePostModal = ({ open, onClose }: CreatePostModalProps) => {
  const { user, profile } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState<"type" | "form">("type");
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [postType, setPostType] = useState<PostType>("free");
  const [ppvPrice, setPpvPrice] = useState("");
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
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
    setCompressing(false);
    setCompressProgress(0);
    setOriginalSize(null);
    setCompressedSize(null);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);
    setCompressedSize(null);

    try {
      let finalFile = file;

      if (contentType === "photo") {
        setCompressing(true);
        setCompressProgress(0);
        finalFile = await compressImage(file);
        setCompressedSize(finalFile.size);
        setCompressing(false);
        setCompressProgress(100);
      } else if (contentType === "video") {
        // Skip compression for small files (< 20 MB)
        if (file.size > 20 * 1024 * 1024) {
          setCompressing(true);
          setCompressProgress(0);
          try {
            finalFile = await compressVideo(file, (p) => setCompressProgress(p));
            setCompressedSize(finalFile.size);
          } catch (err) {
            // Compression failed — use original file
            console.warn("Video compression failed, using original:", err);
            finalFile = file;
            toast.warning("Compressão de vídeo falhou. Usando arquivo original.");
          }
          setCompressing(false);
          setCompressProgress(100);
        }
      }

      setMediaFile(finalFile);
      const url = URL.createObjectURL(finalFile);
      setMediaPreview(url);
    } catch (err) {
      setCompressing(false);
      console.error("File handling error:", err);
    }
  };

  const needsPostType = contentType === "photo" || contentType === "video";

  const handlePublish = async () => {
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

    setPublishing(true);
    try {
      let media_url = "";
      let media_type = "";

      // Upload media if present
      if (mediaFile && user) {
        const ext = mediaFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(path, mediaFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        media_url = urlData.publicUrl;
        media_type = contentType === "photo" ? "photo" : "video";
      }

      // Insert post
      const pollContent = contentType === "poll" 
        ? text.trim() || "Enquete"
        : text;
      
      const { data: postData, error } = await supabase.from("posts").insert({
        creator_id: user!.id,
        content: pollContent,
        media_url,
        media_type: contentType === "poll" ? "poll" : (media_type || ""),
        post_visibility: needsPostType ? postType : "free",
        ppv_price: (postType === "ppv" || postType === "ppv-subscribers") ? parseFloat(ppvPrice) || 0 : 0,
      }).select("id").single();

      if (error) throw error;

      // Create poll if needed
      if (contentType === "poll" && postData) {
        const validOptions = pollOptions.filter(o => o.trim());
        const { data: pollData, error: pollError } = await supabase
          .from("polls").insert({ post_id: postData.id }).select("id").single();
        if (pollError) throw pollError;

        const optionsToInsert = validOptions.map((text, i) => ({
          poll_id: pollData.id,
          text: text.trim(),
          position: i,
        }));
        const { error: optError } = await supabase.from("poll_options").insert(optionsToInsert);
        if (optError) throw optError;
      }

      toast.success("Publicação criada com sucesso!");
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao publicar");
    } finally {
      setPublishing(false);
    }
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
                    <AppAvatar src={profile?.avatar_url} name={profile?.name ?? "U"} className="w-9 h-9" sizePx={72} textClassName="text-sm" />
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

                      {/* Compression progress overlay */}
                      {compressing && (
                        <div className="w-full py-8 border-2 border-dashed border-primary/40 rounded-lg flex flex-col items-center gap-3 bg-secondary/40">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <p className="text-sm font-medium text-foreground">
                            {contentType === "video" ? "Comprimindo vídeo..." : "Comprimindo imagem..."}
                          </p>
                          <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${compressProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{compressProgress}%</p>
                        </div>
                      )}

                      {/* Media preview */}
                      {!compressing && mediaPreview && (
                        <div className="space-y-1.5">
                          <div className="relative rounded-lg overflow-hidden border border-border">
                            {contentType === "photo" ? (
                              <img src={mediaPreview} alt="" className="w-full max-h-64 object-cover" />
                            ) : (
                              <video src={mediaPreview} className="w-full max-h-64 object-cover" controls />
                            )}
                            <button
                              onClick={() => {
                                setMediaPreview(null);
                                setMediaFile(null);
                                setOriginalSize(null);
                                setCompressedSize(null);
                                setCompressProgress(0);
                              }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Compression stats */}
                          {originalSize && compressedSize && (
                            <p className="text-xs text-muted-foreground text-center">
                              {formatBytes(originalSize)} → {formatBytes(compressedSize)}{" "}
                              <span className="text-green-500 font-medium">
                                (-{Math.round((1 - compressedSize / originalSize) * 100)}%)
                              </span>
                            </p>
                          )}
                          {originalSize && !compressedSize && (
                            <p className="text-xs text-muted-foreground text-center">{formatBytes(originalSize)}</p>
                          )}
                        </div>
                      )}

                      {/* Upload trigger */}
                      {!compressing && !mediaPreview && (
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
                      {postType === "ppv" && (
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
                    disabled={publishing || compressing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                    ) : compressing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Comprimindo...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Publicar</>
                    )}
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
