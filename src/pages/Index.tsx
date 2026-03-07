import PostCard from "@/components/PostCard";
import CreatorCard from "@/components/CreatorCard";
import { useState } from "react";

const allPosts = [
  { id: 1, creator: { name: "Luna Dark", username: "lunadark", verified: true }, content: "Novo ensaio exclusivo saindo hoje à noite 🔥 Fiquem ligados!", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=400&fit=crop", likes: 342, comments: 28, locked: false, type: "free" as const, timeAgo: "2h" },
  { id: 2, creator: { name: "Marcus Vibe", username: "marcusvibe", verified: true }, content: "Bastidores do meu novo clipe. Somente para assinantes 🎵", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop", likes: 891, comments: 65, locked: true, type: "subscribers" as const, timeAgo: "4h" },
  { id: 3, creator: { name: "Aria Rose", username: "ariarose", verified: true }, content: "Tutorial exclusivo: Técnicas avançadas de fotografia reveladas 📸", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop", likes: 156, comments: 12, locked: true, type: "ppv" as const, price: 29.90, timeAgo: "6h" },
  { id: 4, creator: { name: "Jake Steel", username: "jakesteel", verified: true }, content: "Dia de treino 💪 Confira meu novo programa de treino para assinantes!", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop", likes: 567, comments: 43, locked: true, type: "ppv-subscribers" as const, price: 49.90, timeAgo: "8h" },
];

// Mock: creators the user follows/subscribes to
const followingUsernames = ["lunadark", "ariarose"];

const mockCreators = [
  { name: "Luna Dark", username: "lunadark", avatar: "", category: "Fotografia", followers: 45200, price: 39.90, verified: true },
  { name: "Marcus Vibe", username: "marcusvibe", avatar: "", category: "Música", followers: 32100, price: 29.90, verified: true },
  { name: "Aria Rose", username: "ariarose", avatar: "", category: "Arte & Design", followers: 28700, price: 24.90, verified: true },
  { name: "Jake Steel", username: "jakesteel", avatar: "", category: "Fitness", followers: 61400, price: 49.90, verified: true },
];

const tabs = ["Para Você", "Seguindo"];

const Index = () => {
  const [activeTab, setActiveTab] = useState("Para Você");

  const filteredPosts = activeTab === "Seguindo"
    ? allPosts.filter((p) => followingUsernames.includes(p.creator.username))
    : allPosts.filter((p) => p.creator.verified);

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Feed */}
          <div>
            {/* Tabs */}
            <div className="flex justify-center md:justify-start gap-1 mb-6 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-foreground text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  {activeTab === "Seguindo" ? "Você ainda não segue nenhum criador." : "Nenhuma publicação encontrada."}
                </p>
              ) : (
                filteredPosts.map((post) => (
                  <PostCard key={post.id} {...post} />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Criadores em destaque</h3>
            {mockCreators.map((creator, i) => (
              <CreatorCard key={creator.username} {...creator} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Index;
