import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  MessageSquarePlus, 
  Search, 
  Trash2, 
  MoreHorizontal,
  Edit2,
  Check,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { UserProfile } from "./UserProfile";
import type { ChatSession } from "@shared/schema";

interface ChatSidebarProps {
  currentSessionId?: number;
  onSessionSelect: (sessionId: number) => void;
  onNewChat: () => void;
  isCollapsed?: boolean;
}

export function ChatSidebar({ 
  currentSessionId, 
  onSessionSelect, 
  onNewChat,
  isCollapsed = false 
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const queryClient = useQueryClient();

  // Fetch chat sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/sessions"],
    refetchInterval: 5000, // Refresh every 5 seconds to stay updated
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (title: string): Promise<ChatSession> => {
      return await apiRequest("/api/sessions", "POST", { title }) as ChatSession;
    },
    onSuccess: (newSession: ChatSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      onSessionSelect(newSession.id);
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return await apiRequest("DELETE", `/api/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  // Update session title mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: number; title: string }) => {
      return await apiRequest("PUT", `/api/sessions/${sessionId}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setEditingSessionId(null);
    },
  });

  const handleNewChat = () => {
    const title = `New Chat ${new Date().toLocaleDateString()}`;
    createSessionMutation.mutate(title);
  };

  const handleDeleteSession = (sessionId: number) => {
    deleteSessionMutation.mutate(sessionId);
  };

  const handleEditStart = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleEditSave = () => {
    if (editingSessionId && editTitle.trim()) {
      updateSessionMutation.mutate({
        sessionId: editingSessionId,
        title: editTitle.trim()
      });
    }
  };

  const handleEditCancel = () => {
    setEditingSessionId(null);
    setEditTitle("");
  };

  // Filter sessions based on search query
  const filteredSessions = (sessions as ChatSession[]).filter((session: ChatSession) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col items-center py-4">
        <Button
          onClick={handleNewChat}
          variant="ghost"
          size="icon"
          className="mb-4 hover:bg-accent"
          disabled={createSessionMutation.isPending}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={handleNewChat}
          variant="outline"
          className="w-full titillium-web-semibold"
          disabled={createSessionMutation.isPending}
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 titillium-web-regular"
          />
        </div>
      </div>

      {/* Chat Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading chats...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? "No chats match your search" : "No chats yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSessions.map((session: ChatSession) => (
                <div
                  key={session.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                    session.id === currentSessionId 
                      ? 'bg-accent border border-accent-foreground/20' 
                      : 'hover:bg-accent/30'
                  }`}
                  onClick={() => !editingSessionId && onSessionSelect(session.id)}
                >
                  {editingSessionId === session.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleEditSave}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleEditCancel}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm titillium-web-semibold truncate">
                            {session.title}
                          </h3>
                          {session.lastMessage && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {session.lastMessage}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {session.messageCount} messages
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStart(session)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <Separator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Profile at bottom */}
      <UserProfile />
    </div>
  );
}