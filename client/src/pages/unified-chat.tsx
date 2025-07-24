import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MiraAvatar } from '@/components/MiraAvatar';
import { MiraPhoneMode, type MiraPhoneModeRef } from '@/components/MiraPhoneMode';
import { ChatSidebar } from '@/components/ChatSidebar';
import { Mic, MicOff, Send, Upload, Bot, User, Loader2, Radio, FileText, MessageSquare, Volume2, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { SessionMessage } from '@shared/schema';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: Date;
  isProcessing?: boolean;
}

type InteractionMode = 'text' | 'click-to-talk' | 'mira' | 'continuous';

export default function UnifiedChat() {
  // Chat session state
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const queryClient = useQueryClient();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('text');

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);

  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const miraRef = useRef<MiraPhoneModeRef>(null);

  // Mira Avatar state
  const [isMiraActive, setIsMiraActive] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // iframe state
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { toast } = useToast();

  // Session messages query
  const { data: sessionMessages = [] } = useQuery({
    queryKey: ["/api/sessions", currentSessionId, "messages"],
    enabled: !!currentSessionId,
  });

  // Create session message mutation
  const createMessageMutation = useMutation({
    mutationFn: async ({ content, type, messageType, audioUrl }: { 
      content: string; 
      type: 'user' | 'assistant'; 
      messageType?: string;
      audioUrl?: string; 
    }) => {
      if (!currentSessionId) {
        // Create new session first
        const response = await apiRequest("POST", "/api/sessions", { 
          title: content.substring(0, 50) 
        });
        const newSession = await response.json();
        setCurrentSessionId(newSession.id);
        const messageResponse = await apiRequest("POST", `/api/sessions/${newSession.id}/messages`, {
          content,
          type,
          messageType: messageType || 'text',
          audioUrl
        });
        return await messageResponse.json();
      }
      const response = await apiRequest("POST", `/api/sessions/${currentSessionId}/messages`, {
        content,
        type,
        messageType: messageType || 'text',
        audioUrl
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", currentSessionId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  // Load messages from session
  useEffect(() => {
    if (sessionMessages.length > 0) {
      const formattedMessages: Message[] = (sessionMessages as SessionMessage[]).map(msg => ({
        id: msg.id.toString(),
        type: msg.type as 'user' | 'assistant',
        content: msg.content,
        audioUrl: msg.audioUrl || undefined,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(formattedMessages);
    } else if (currentSessionId) {
      setMessages([]);
    }
  }, [sessionMessages, currentSessionId]);

  // Auto-scroll to bottom with proper handling for long messages
  useEffect(() => {
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 200);
    return () => clearTimeout(timer);
  }, [messages]);

  // Initialize WebSocket connection when voice modes are used
  useEffect(() => {
    if (interactionMode !== 'text' && interactionMode !== 'continuous' && !isConnected) {
      initializeVoiceChat();
    }

    // Reset iframe state when switching modes
    if (interactionMode !== 'continuous') {
      setIframeLoaded(false);
    }

    // Cleanup resources when switching away from voice modes
    return () => {
      if (interactionMode === 'text') {
        cleanupVoiceResources();
      }
    };
  }, [interactionMode]);

  // Separate effect for reconnecting voice modes after using Mira or Neural Link
  useEffect(() => {
    if ((interactionMode === 'click-to-talk' || interactionMode === 'continuous') && !isConnected) {
      // Small delay to ensure cleanup is complete
      const timer = setTimeout(() => {
        initializeVoiceChat();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [interactionMode, isConnected]);

  // Initialize voice chat connection
  const initializeVoiceChat = async () => {
    try {
      console.log('Initializing voice chat...');

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setSessionId(null);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice chat. Please try again.",
          variant: "destructive"
        });
      };

      // Initialize microphone
      await initializeMediaRecorder();
    } catch (error) {
      console.error('Failed to initialize voice chat:', error);
      toast({
        title: "Voice Chat Error",
        description: "Failed to initialize voice chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Cleanup voice resources
  const cleanupVoiceResources = () => {
    setIsContinuousMode(false);
    setIsRecording(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
  };

  // Initialize media recorder
  const initializeMediaRecorder = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      console.log('Microphone access granted, setting up MediaRecorder...');

      // Check for supported MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }
      console.log('Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', audioChunksRef.current.length);
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          console.log('Created audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
          sendAudioToServer(audioBlob);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Recording Error",
          description: "Failed to record audio. Please try again.",
          variant: "destructive"
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      console.log('MediaRecorder initialized successfully');
    } catch (error) {
      console.error('Failed to initialize media recorder:', error);
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone. Please grant permission and try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    console.log('Handling WebSocket message:', data.type);

    switch (data.type) {
      case 'session_started':
        console.log('Session started:', data.sessionId);
        setSessionId(data.sessionId);
        setIsConnected(true);
        break;

      case 'transcription_complete':
        console.log('Transcription received:', data.transcription);
        // Store transcription for MIRA mode
        setCurrentTranscription(data.transcription);
        // Add user message with transcription
        const userMsg: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: data.transcription.trim(),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        break;

      case 'voice_response':
        console.log('Voice response received');
        setIsProcessing(false);
        
        // Store response text for MIRA mode captions
        setCurrentTranscription(data.response || data.text || 'Voice response received');
        
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response || data.text || 'Voice response received',
          audioUrl: data.audioUrl,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);

        if (data.audioUrl) {
          console.log('Playing audio from WebSocket response:', data.audioUrl);
          
          // Handle MIRA mode with synchronized video-audio playback
          if (interactionMode === 'mira' && miraRef.current) {
            setIsMiraActive(true);
            miraRef.current.handleVoiceResponse(data.audioUrl, data.response || data.text || '', () => {
              // Callback when audio ends to fade out
              console.log('Audio ended, fading out MIRA');
              setTimeout(() => {
                setIsMiraActive(false);
                setCurrentTranscription('');
              }, 100);
            });
          } else {
            // Regular audio playback for other modes
            playAudio(data.audioUrl);
          }

          // Auto-restart continuous mode
          if (isContinuousMode) {
            setTimeout(() => {
              if (isContinuousMode) restartContinuousListening();
            }, 1000);
          }
        } else {
          console.warn('No audio URL provided in voice response');
        }

        break;

      case 'processing_step':
        console.log('Processing step:', data.step, '-', data.message);
        break;

      case 'processing':
        console.log('Processing started:', data.message);
        break;

      case 'error':
        console.error('WebSocket error:', data.message);
        setIsProcessing(false);
        toast({
          title: "Voice Processing Error",
          description: data.message || "An error occurred during voice processing",
          variant: "destructive"
        });
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Format CV analysis for display with improved styling
  const formatCVAnalysis = (analysis: any) => {
    const score = analysis.score || 0;
    const scoreColor = score < 50 ? 'text-red-400' : score < 80 ? 'text-yellow-400' : 'text-green-400';
    const scoreBgColor = score < 50 ? 'bg-red-500/20 border-red-400/30' : score < 80 ? 'bg-yellow-500/20 border-yellow-400/30' : 'bg-green-500/20 border-green-400/30';
    
    return `<div class="cv-analysis-container space-y-6">
      <!-- Header with Score -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-white mb-4">CV Analysis Results</h1>
        <div class="${scoreBgColor} rounded-xl p-4 border-2 inline-block">
          <div class="text-sm text-gray-300 mb-1">Overall Score</div>
          <div class="${scoreColor} text-3xl font-bold">${score}/100</div>
        </div>
      </div>

      <!-- Strengths and Improvements Side by Side -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Strengths Box -->
        <div class="bg-green-500/20 border-2 border-green-400/30 rounded-xl p-4">
          <h2 class="text-lg font-semibold text-green-400 mb-3 flex items-center">
            <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            Key Strengths
          </h2>
          <ul class="space-y-2">
            ${analysis.strengths?.map((s: string) => `<li class="text-sm text-gray-200 flex items-start"><span class="text-green-400 mr-2">•</span><span>${s}</span></li>`).join('') || '<li class="text-sm text-gray-300">Strong technical background identified</li>'}
          </ul>
        </div>

        <!-- Improvements Box -->
        <div class="bg-red-500/20 border-2 border-red-400/30 rounded-xl p-4">
          <h2 class="text-lg font-semibold text-red-400 mb-3 flex items-center">
            <span class="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
            Areas for Improvement
          </h2>
          <ul class="space-y-2">
            ${analysis.improvements?.map((i: string) => `<li class="text-sm text-gray-200 flex items-start"><span class="text-red-400 mr-2">•</span><span>${i}</span></li>`).join('') || '<li class="text-sm text-gray-300">Enhancement opportunities identified</li>'}
          </ul>
        </div>
      </div>

      <!-- Professional Feedback -->
      <div class="bg-blue-500/20 border-2 border-blue-400/30 rounded-xl p-4">
        <h2 class="text-lg font-semibold text-blue-400 mb-3 flex items-center">
          <span class="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
          Professional Feedback
        </h2>
        <p class="text-sm text-gray-200 leading-relaxed">${analysis.feedback || 'Comprehensive analysis completed with actionable insights.'}</p>
      </div>
    </div>`;
  };

  // Play audio response
  const playAudio = (audioUrl: string) => {
    console.log('Starting audio playback for:', audioUrl);
    
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsMiraActive(false);
    }

    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    
    // Force audio to load and play immediately
    audio.preload = 'auto';
    audio.autoplay = false;
    audio.load(); // Force load

    // Activate Mira when audio starts playing
    audio.addEventListener('play', () => {
      setIsMiraActive(true);
      setIsAudioPlaying(true);
      console.log('Audio started playing - MiraAvatar should appear in Voice mode');
    });

    // Deactivate Mira when audio ends
    audio.addEventListener('ended', () => {
      setIsMiraActive(false);
      setIsAudioPlaying(false);
      currentAudioRef.current = null;
      console.log('Audio ended - MiraAvatar should disappear');
    });

    // Handle audio errors
    audio.addEventListener('error', () => {
      setIsMiraActive(false);
      setIsAudioPlaying(false);
      currentAudioRef.current = null;
      console.log('Audio error - MiraAvatar should disappear');
    });

    // Force audio playback with retry mechanism
    const playWithRetry = async () => {
      try {
        await audio.play();
        console.log('Audio started playing successfully');
      } catch (error) {
        console.error('Audio playback failed:', error);
        // Try to enable audio with user interaction
        setIsMiraActive(false);
        currentAudioRef.current = null;
        
        // Create a fallback play button
        const playButton = document.createElement('button');
        playButton.textContent = '🔊 Click to play audio response';
        playButton.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 10px; background: #0ea5e9; color: white; border: none; border-radius: 5px; cursor: pointer;';
        playButton.onclick = async () => {
          try {
            await audio.play();
            playButton.remove();
          } catch (e) {
            console.error('Manual audio play failed:', e);
          }
        };
        document.body.appendChild(playButton);
        setTimeout(() => playButton.remove(), 10000); // Remove after 10 seconds
      }
    };
    
    playWithRetry();
  };

  // Send text message
  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    const userContent = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      // Save user message
      await createMessageMutation.mutateAsync({
        content: userContent,
        type: 'user',
        messageType: 'text'
      });

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userContent,
          includeVoice: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Save assistant message
      await createMessageMutation.mutateAsync({
        content: data.response,
        type: 'assistant',
        messageType: 'text'
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    if (!mediaRecorderRef.current || isRecording) return;

    try {
      console.log('Starting recording...');
      audioChunksRef.current = [];
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    try {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  };

  const toggleRecording = async () => {
    if (isProcessing) {
      console.log('Cannot toggle recording while processing');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const toggleContinuousMode = async () => {
    if (isContinuousMode) {
      setIsContinuousMode(false);
      if (isRecording) stopRecording();
    } else {
      setIsContinuousMode(true);
      await startContinuousRecording();
    }
  };

  const startContinuousRecording = async () => {
    if (!mediaRecorderRef.current) return;

    audioChunksRef.current = [];
    mediaRecorderRef.current.start(250);
    setIsRecording(true);
    setupSilenceDetection();
  };

  const restartContinuousListening = async () => {
    if (!isContinuousMode) return;

    try {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        await initializeMediaRecorder();
      }

      audioChunksRef.current = [];
      mediaRecorderRef.current.start(250);
      setIsRecording(true);
      setupSilenceDetection();
    } catch (error) {
      console.error('Error restarting continuous listening:', error);
    }
  };

  const setupSilenceDetection = () => {
    if (!streamRef.current || !isContinuousMode) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let silenceCount = 0;
    let isCurrentlySpeaking = false;
    const silenceThreshold = 35;
    const silenceLimit = 25;
    const speechThreshold = 50;

    const checkAudioLevel = () => {
      if (!isContinuousMode || isProcessing) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      if (average > speechThreshold) {
        isCurrentlySpeaking = true;
        silenceCount = 0;
      } else if (average < silenceThreshold) {
        silenceCount++;

        if (isCurrentlySpeaking && silenceCount >= silenceLimit && audioChunksRef.current.length > 0) {
          processContinuousAudio();
          silenceCount = 0;
          isCurrentlySpeaking = false;
        }
      } else {
        if (silenceCount > 0) silenceCount--;
      }

      if (isContinuousMode && !isProcessing) {
        requestAnimationFrame(checkAudioLevel);
      }
    };

    checkAudioLevel();
  };

  const processContinuousAudio = () => {
    if (!mediaRecorderRef.current || audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });

    if (audioBlob.size > 5000) {
      setIsRecording(false);
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      sendAudioToServer(audioBlob);
    }

    audioChunksRef.current = [];
  };

  const sendAudioToServer = (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, state:', wsRef.current?.readyState);
      toast({
        title: "Connection Error",
        description: "Voice chat is not connected. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (audioBlob.size < 1000) {
      console.warn('Audio blob too small:', audioBlob.size, 'bytes');
      toast({
        title: "Recording Too Short",
        description: "Please record for at least 1 second.",
        variant: "destructive"
      });
      return;
    }

    console.log('Converting audio blob to base64...');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        const base64Audio = result.split(',')[1];
        console.log('Sending audio data:', base64Audio.length, 'characters');

        wsRef.current?.send(JSON.stringify({
          type: 'voice_data',
          sessionId: sessionId || 'default',
          audioData: base64Audio
        }));
      } catch (error) {
        console.error('Failed to send audio data:', error);
        setIsProcessing(false);
        toast({
          title: "Send Error", 
          description: "Failed to send voice message. Please try again.",
          variant: "destructive"
        });
      }
    };

    reader.onerror = () => {
      console.error('FileReader error');
      setIsProcessing(false);
      toast({
        title: "Processing Error", 
        description: "Failed to process audio. Please try again.",
        variant: "destructive"
      });
    };

    reader.readAsDataURL(audioBlob);
  };

  // CV Upload
  const handleCVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `📄 Uploaded CV: ${file.name}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    uploadCVFile(file);
  };

  const uploadCVFile = async (file: File) => {
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      // Show processing message
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `CV uploaded successfully. Analysis ID: ${data.id}. Processing your CV analysis...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, processingMessage]);

      // Poll for analysis results
      pollForAnalysis(data.id);

      toast({
        title: "CV Uploaded",
        description: "Analysis in progress. Please wait...",
      });
    } catch (error) {
      console.error('CV upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload CV. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const pollForAnalysis = async (analysisId: number) => {
    const maxAttempts = 25; // Reduced timeout for faster UX
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const response = await fetch(`/api/cv/analysis/${analysisId}`);
        if (!response.ok) throw new Error('Failed to get analysis');

        const data = await response.json();

        if (data.status === 'completed' && data.analysis) {
          // Analysis complete - show results
          const analysisMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'assistant',
            content: formatCVAnalysis(data.analysis),
            audioUrl: data.audioUrl,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, analysisMessage]);

          if (data.audioUrl) {
            playAudio(data.audioUrl);
          }

          toast({
            title: "Analysis Complete",
            description: "CV analyzed successfully",
          });
          setIsProcessing(false);
        } else if (data.status === 'failed') {
          throw new Error('Analysis failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Analysis timeout');
        } else {
          // Still processing, continue polling with shorter interval
          setTimeout(poll, 800); // Faster polling
        }
      } catch (error) {
        console.error('Analysis polling error:', error);
        toast({
          title: "Analysis Failed",
          description: "Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    };

    poll();
  };

  // Handle MIRA mode transcription clearing
  useEffect(() => {
    if (!isMiraActive && interactionMode !== 'mira') {
      setCurrentTranscription('');
    }
  }, [isMiraActive, interactionMode]);

  // MIRA mode - full screen phone interface
  if (interactionMode === 'mira') {
    return (
      <MiraPhoneMode
        ref={miraRef}
        isRecording={isRecording}
        isProcessing={isProcessing}
        isConnected={isConnected}
        isMiraActive={isMiraActive}
        currentTranscription={currentTranscription}
        onToggleRecording={toggleRecording}
        onBack={() => setInteractionMode('text')}
      />
    );
  }

  // Session management handlers
  const handleSessionSelect = (sessionId: number) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex">
      {/* Subtle background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl" />
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar
        currentSessionId={currentSessionId || undefined}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isCollapsed={isSidebarCollapsed}
      />

      <div className="relative z-10 flex-1 px-6 py-8 h-screen flex flex-col min-h-0 cyber-grid">
        {/* Sidebar Toggle Button */}
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="titillium-web-semibold hover:bg-accent"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>
        {/* Header with interaction modes */}
        <div className="mb-6">
          <h1 className="text-4xl titillium-web-bold text-center mb-6 text-emerald-300 font-black tracking-wider relative">
            <span className="relative z-10 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
              AskMira
            </span>
            <div className="absolute inset-0 text-emerald-400 blur-sm opacity-60 animate-pulse">
              AskMira
            </div>
            <div className="absolute inset-0 text-emerald-300 blur-md opacity-40">
              AskMira
            </div>
          </h1>
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => setInteractionMode('text')}
              variant="ghost"
              size="sm"
              className={`titillium-web-semibold rounded-full px-6 py-2 ${
                interactionMode === 'text' 
                  ? 'sleek-button-selected' 
                  : 'sleek-button'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              TEXT
            </Button>
            <Button
              onClick={() => setInteractionMode('click-to-talk')}
              variant="ghost"
              size="sm"
              className={`titillium-web-semibold rounded-full px-6 py-2 ${
                interactionMode === 'click-to-talk' 
                  ? 'sleek-button-selected' 
                  : 'sleek-button'
              }`}
            >
              <Mic className="w-4 h-4 mr-2" />
              VOICE
            </Button>
            <Button
              onClick={() => setInteractionMode('mira')}
              variant="ghost"
              size="sm"
              className={`titillium-web-semibold rounded-full px-6 py-2 ${
                interactionMode === 'mira' 
                  ? 'sleek-button-selected' 
                  : 'sleek-button'
              }`}
            >
              <Bot className="w-4 h-4 mr-2" />
              MIRA
            </Button>
            <Button
              onClick={() => setInteractionMode('continuous')}
              variant="ghost"
              size="sm"
              className={`titillium-web-semibold rounded-full px-6 py-2 ${
                interactionMode === 'continuous' 
                  ? 'sleek-button-selected' 
                  : 'sleek-button'
              }`}
            >
              <Radio className="w-4 h-4 mr-2" />
              NEURAL LINK
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 glass-enhanced cyberpunk-border mb-6 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            <ScrollArea className="flex-1 p-6 scroll-container scrollbar-thin max-h-[70vh] overflow-y-auto">
              {interactionMode === 'continuous' ? (
                <div className="h-full w-full relative">
                  {/* Pure Neural Link Interface - no text overlay */}
                  <iframe 
                    ref={iframeRef}
                    src="https://bey.chat/3090f07a-5a09-4093-9114-d8c1332d7a74" 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    allowFullScreen
                    allow="camera; microphone; fullscreen"
                    onLoad={() => setIframeLoaded(true)}
                    style={{ 
                      border: 'none', 
                      maxWidth: '100%', 
                      borderRadius: '12px',
                      minHeight: '500px'
                    }}
                    className="cyberpunk-border w-full h-full"
                  />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="titillium-web-light">Initialize Neural Connection or Upload Data Package</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative group transition-all duration-300 ${
                        message.type === 'user' 
                          ? 'shadow-lg' 
                          : 'bg-gradient-to-br from-gray-700 to-gray-800 border border-primary/30 shadow-lg hover:shadow-xl hover:scale-105'
                      }`}
                      style={message.type === 'user' ? {
                        background: 'linear-gradient(135deg, #2e8b57 0%, #40e0d0 100%)'
                      } : undefined}>
                        {message.type === 'user' ? 
                          <User className="w-6 h-6 text-white" /> : 
                          <>
                            <Bot className={`w-6 h-6 text-primary transition-all duration-300 ${message.audioUrl ? 'group-hover:opacity-0 group-hover:scale-75' : ''}`} />
                            {message.audioUrl && (
                              <Button
                                onClick={() => playAudio(message.audioUrl!)}
                                variant="ghost"
                                size="sm"
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 rounded-full bg-primary/20 hover:bg-primary/30 border-0 p-0 flex items-center justify-center"
                              >
                                <Volume2 className="w-4 h-4 text-primary" />
                              </Button>
                            )}
                          </>
                        }
                      </div>

                      {/* Message bubble */}
                      <div className={`flex-1 max-w-[75%] min-w-0 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                        <div
                          className={`message-bubble group relative titillium-web-regular inline-block p-3 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 hover:shadow-2xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-green-600/70 to-emerald-600/70 text-white border-green-400/20 rounded-br-md'
                              : 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-gray-600/20 text-white rounded-bl-md'
                          }`}
                        >
                          <div className="prose prose-sm prose-invert max-w-none break-words overflow-hidden text-left">
                            {message.content.includes('<div class="cv-analysis-container') ? (
                              <div dangerouslySetInnerHTML={{ __html: message.content }} />
                            ) : message.content.includes('#') ? (
                              <div dangerouslySetInnerHTML={{ 
                                __html: message.content
                                  .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mb-3 text-white text-left">$1</h1>')
                                  .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mb-2 text-blue-300 text-left">$1</h2>')
                                  .replace(/^\*\*(.+?)\*\*/gm, '<strong class="text-blue-300">$1</strong>')
                                  .replace(/^• (.+)$/gm, '<div class="ml-2 mb-1 text-sm text-left">• $1</div>')
                                  .replace(/^(\d+)\. (.+)$/gm, '<div class="mb-1 text-sm text-left"><span class="text-blue-300 font-semibold">$1.</span> $2</div>')
                              }} />
                            ) : (
                              <p 
                                className="m-0 text-sm leading-relaxed whitespace-pre-wrap text-left"
                                dangerouslySetInnerHTML={{
                                  __html: message.content
                                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-blue-300">$1</strong>')
                                    .replace(/\n/g, '<br>')
                                }}
                              />
                            )}
                          </div>



                          {/* Timestamp - hidden by default, shown on hover */}
                          <div className="absolute -bottom-6 left-0 text-xs opacity-0 group-hover:opacity-50 font-mono transition-opacity duration-200 pointer-events-none">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="glass-enhanced border border-border/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-5 h-5 text-primary" />
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-muted-foreground">Processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={chatEndRef} />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="space-y-4">
          {/* Voice Controls (for voice modes but not MIRA) */}
          {interactionMode !== 'text' && interactionMode !== 'mira' && (
            <div className="flex justify-center">
              <Button
                {...(interactionMode === 'click-to-talk'
                  ? { onClick: toggleRecording }
                  : { onClick: toggleContinuousMode }
                )}
                disabled={isProcessing || !isConnected}
                className={`titillium-web-bold w-16 h-16 rounded-full border-2 transition-all duration-300 shadow-2xl ${
                  isProcessing
                    ? 'bg-yellow-500/80 border-yellow-300 animate-pulse shadow-yellow-500/50'
                    : isContinuousMode
                    ? 'bg-emerald-500/80 border-emerald-300 scale-110 shadow-emerald-500/50 animate-pulse'
                    : isRecording 
                    ? 'bg-red-500/80 border-red-300 scale-110 shadow-red-500/50' 
                    : 'bg-emerald-500/20 border-emerald-300 hover:bg-emerald-500/40 hover:scale-105 shadow-emerald-500/30'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : isContinuousMode ? (
                  <Radio className="w-6 h-6 text-white animate-pulse" />
                ) : isRecording ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-emerald-300" />
                )}
              </Button>
            </div>
          )}

          {/* Text Input (for text mode) */}
          {interactionMode === 'text' && (
            <div className="flex space-x-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendTextMessage();
                  }
                }}
                placeholder="Enter neural data transmission..."
                className="titillium-web-regular flex-1 glass-enhanced border-gray-600/30 text-gray-100 placeholder:text-gray-400/70"
                disabled={isProcessing}
              />
              <Button
                onClick={sendTextMessage}
                disabled={!inputText.trim() || isProcessing}
                variant="ghost"
                className="titillium-web-semibold sleek-button px-4"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* CV Upload Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              className="titillium-web-bold sleek-button p-3"
              disabled={isProcessing}
            >
              <span className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-bold rounded flex items-center justify-center">CV</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleCVUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Mira Phone Mode - full screen mode with video and synchronized audio */}
      {interactionMode === 'mira' && (
        <MiraPhoneMode
          ref={miraRef}
          isRecording={isRecording}
          isProcessing={isProcessing}
          isConnected={isConnected}
          isMiraActive={isMiraActive}
          currentTranscription={currentTranscription}
          onToggleRecording={toggleRecording}
          onBack={() => setInteractionMode('text')}
        />
      )}
      
      {/* MiraAvatar popup for Voice mode only */}
      {interactionMode === 'click-to-talk' && (
        <MiraAvatar 
          isPlaying={isAudioPlaying} 
          audioElement={currentAudioRef.current}
        />
      )}
    </div>
  );
}