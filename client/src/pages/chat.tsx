import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { csrfFetch, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { Mic, MicOff, Send, Volume2, VolumeX, User, Bot, Loader2, Home, Radio } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface ChatResponse {
  id: number;
  message: string;
  response: string;
  audioUrl?: string;
  type: string;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [includeVoice, setIncludeVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Chat history query
  const { data: chatHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/chat/history'],
    staleTime: 30000, // Refresh every 30 seconds
  }) as { data: ChatMessage[] | undefined; isLoading: boolean };

  // Text chat mutation
  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; includeVoice: boolean }) => {
      const response = await csrfFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Chat failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "Message sent",
        description: "AI response received successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Chat failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Voice chat mutation
  const voiceChatMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.wav');
      
      const response = await csrfFetch('/api/voice/chat', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Voice chat failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "Voice message processed",
        description: "AI response generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Voice chat failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Initialize media recorder
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Try different MIME types for better compatibility
          let mimeType = 'audio/webm;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'audio/wav';
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = ''; // Use default
              }
            }
          }
          
          const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
          setMediaRecorder(recorder);
          
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setAudioChunks(prev => [...prev, event.data]);
            }
          };
          
          recorder.onstop = () => {
            console.log('Recording stopped, chunks:', audioChunks.length);
            if (audioChunks.length > 0) {
              const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/wav' });
              console.log('Created audio blob:', audioBlob.size, 'bytes');
              voiceChatMutation.mutate(audioBlob);
              setAudioChunks([]);
            } else {
              console.warn('No audio chunks collected');
              toast({
                title: "No audio recorded",
                description: "Please try speaking again",
                variant: "destructive"
              });
            }
          };
        })
        .catch(err => {
          console.error('Error accessing microphone:', err);
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access for voice chat",
            variant: "destructive"
          });
        });
    }
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    chatMutation.mutate({ message: message.trim(), includeVoice });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (!mediaRecorder) {
      toast({
        title: "Microphone not available",
        description: "Please check your microphone permissions",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      console.log('Stopping recording...');
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      console.log('Starting recording...');
      setAudioChunks([]);
      mediaRecorder.start(1000); // Record in 1-second chunks for better data collection
      setIsRecording(true);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      toast({
        title: "Audio playback failed",
        description: "Could not play the audio response",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/live-voice">
              <Button variant="ghost" size="sm">
                <Radio className="w-4 h-4 mr-2" />
                Live Voice Chat
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-black hyperdash-gradient-text mb-4">
            AI Chat Assistant
          </h1>
          <p className="text-xl text-muted-foreground">
            Direct conversation with your AI career coach
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="hyperdash-card shadow-2xl border-border/20 h-[600px] flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 pr-4 mb-6">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading chat history...</span>
                </div>
              ) : chatHistory && chatHistory.length > 0 ? (
                <div className="space-y-4">
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className="space-y-3">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="flex items-start space-x-3 max-w-[80%]">
                          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                            <p className="text-foreground">{msg.message}</p>
                            {msg.type === 'voice' && (
                              <div className="flex items-center mt-2 text-sm text-primary">
                                <Mic className="w-4 h-4 mr-1" />
                                Voice message
                              </div>
                            )}
                          </div>
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-background" />
                          </div>
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-[80%]">
                          <div className="w-8 h-8 hyperdash-gradient rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-black" />
                          </div>
                          <div className="glass-enhanced border border-border/30 rounded-2xl p-4">
                            <p className="text-foreground leading-relaxed">{msg.response}</p>
                            {msg.audioUrl && (
                              <Button
                                onClick={() => playAudio(msg.audioUrl!)}
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-green-400 hover:text-green-300"
                              >
                                <Volume2 className="w-4 h-4 mr-1" />
                                Play audio
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Start a conversation with your AI coach</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </ScrollArea>

            {/* Input Area */}
            <div className="space-y-4">
              {/* Voice Toggle */}
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setIncludeVoice(!includeVoice)}
                  variant="ghost"
                  size="sm"
                  className={includeVoice ? "text-green-400" : "text-muted-foreground"}
                >
                  {includeVoice ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                  Voice responses {includeVoice ? "ON" : "OFF"}
                </Button>

                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  disabled={voiceChatMutation.isPending}
                  className={isRecording ? "animate-pulse" : ""}
                >
                  {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isRecording ? "Stop Recording" : "Voice Input"}
                </Button>
              </div>

              {/* Text Input */}
              <div className="flex space-x-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your career..."
                  disabled={chatMutation.isPending}
                  className="flex-1 bg-background/50 border-border/30"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || chatMutation.isPending}
                  className="hyperdash-gradient text-black"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
