import { useLang } from "@/i18n/useLang";
import { EmptyCommunity } from "@/components/EmptyState";
import React, { useState } from "react";
import { useCommunityPosts, useCreateCommunityPost, useLikePost } from "@/hooks/use-community";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Input } from "@/components/ui";
import { Heart, MessageSquare, Send, Zap, UserPlus, UserMinus, Loader2, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { apiRequest } from "@/lib/queryClient";
import type { ActivityFeedItem, UserProfile } from "@shared/schema";

type ActivityWithProfile = ActivityFeedItem & { userProfile?: UserProfile | null };

function useActivityFeed() {
  return useQuery<ActivityWithProfile[]>({
    queryKey: ["/api/activity/feed"],
    queryFn: async () => {
      const res = await fetch("/api/activity/feed", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
  });
}

function useFollowing() {
  return useQuery<string[]>({
    queryKey: ["/api/follows"],
    queryFn: async () => {
      const res = await fetch("/api/follows", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function ActivityFeedSection() {
  const { data: feed = [], isLoading } = useActivityFeed();
  const { data: following = [] } = useFollowing();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/follows/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/leaderboard"] });
    },
  });
  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/follows/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/follows"] }),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm text-center py-4">Se încarcă activitatea...</div>;
  if (feed.length === 0) return (
    <div className="text-center py-6 text-muted-foreground text-sm">
      <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
      {tx?.community?.noPost || "Nicio activitate recentă"}
    </div>
  );

  return (
    <div className="space-y-3">
      {feed.map((item) => {
        const isFollowed = following.includes(item.userId);
        const isPending = followMutation.isPending || unfollowMutation.isPending;
        const name = item.userProfile?.displayName || "FitForger";
        const avatar = item.userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=40`;

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            data-testid={`activity-item-${item.id}`}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji || "💪"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <img src={avatar} alt={name} className="w-6 h-6 rounded-full border border-border" />
                <span className="font-semibold text-sm">{name}</span>
                <span className="text-muted-foreground text-sm">{item.description}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.createdAt as string)}</p>
            </div>
            {item.userProfile && (
              <button
                onClick={() => isFollowed ? unfollowMutation.mutate(item.userId) : followMutation.mutate(item.userId)}
                disabled={isPending}
                data-testid={`activity-follow-${item.userId}`}
                className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  isFollowed
                    ? "text-muted-foreground hover:text-red-400"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : isFollowed ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

type Tab = "feed" | "activity";

export default function CommunityPage() {
  const { tx } = useLang();
  const { data: posts, isLoading } = useCommunityPosts();
  const createMutation = useCreateCommunityPost();
  const likeMutation = useLikePost();
  const { data: profile } = useProfile();
  const [newPost, setNewPost] = useState("");
  const [tab, setTab] = useState<Tab>("feed");

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    createMutation.mutate({ content: newPost }, { onSuccess: () => setNewPost("") });
  };

  const handleLike = (postId: number) => {
    likeMutation.mutate({ id: postId, isLiked: false });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">{tx.community.title}</h1>
        <p className="text-muted-foreground mt-1">Inspiră și fii inspirat.</p>
      </div>

      {/* Post composer */}
      <Card className="p-4 border-primary/30 neon-shadow-green bg-gradient-to-br from-card to-primary/5">
        <form onSubmit={handlePost} className="flex gap-3">
          <img
            src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.displayName || 'U'}`}
            alt="Tu"
            className="w-10 h-10 rounded-full border border-border flex-shrink-0"
          />
          <div className="flex-1 flex gap-2">
            <Input
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="{tx.community.placeholder}..."
              className="bg-background/50"
              data-testid="post-input"
            />
            <Button type="submit" disabled={!newPost.trim()} isLoading={createMutation.isPending} className="px-4" data-testid="post-submit">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
        <button
          onClick={() => setTab("feed")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === "feed" ? "bg-background shadow-sm border border-border/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="w-4 h-4" /> Postări
        </button>
        <button
          onClick={() => setTab("activity")}
          data-testid="tab-activity"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === "activity" ? "bg-background shadow-sm border border-border/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Zap className="w-4 h-4" /> Activitate Live
        </button>
      </div>

      {/* Activity Feed Tab */}
      {tab === "activity" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Ce se întâmplă în comunitate
          </h3>
          <ActivityFeedSection />
        </Card>
      )}

      {/* Posts Feed Tab */}
      {tab === "feed" && (
        <div className="space-y-6">
          {isLoading && <div className="text-center py-8 text-muted-foreground text-sm">Se încarcă...</div>}
          {!isLoading && (!posts || posts.length === 0) && (
            <Card className="p-10 text-center border-dashed">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="font-semibold">Nicio postare încă</p>
              <p className="text-sm text-muted-foreground mt-1">Fii primul care distribuie un milestone!</p>
            </Card>
          )}
          {posts?.map((post: any) => (
            <Card key={post.id} className="p-6" data-testid={`post-${post.id}`}>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={post.userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${post.userProfile?.displayName || 'U'}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-secondary"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold flex items-center gap-2">
                    {post.userProfile?.displayName || 'Anonim'}
                    {post.userProfile?.level && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/20 text-accent uppercase font-bold tracking-wider">
                        Lvl {post.userProfile.level}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                </div>
              </div>

              <p className="text-foreground text-base mb-6 leading-relaxed">{post.content}</p>

              <div className="flex items-center gap-6 pt-4 border-t border-border/50 text-muted-foreground">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 hover:text-primary transition-colors group"
                  data-testid={`like-btn-${post.id}`}
                >
                  <Heart className="w-5 h-5 group-hover:fill-primary/20" />
                  <span className="font-medium">{post.likesCount}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">{post.commentsCount}</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
