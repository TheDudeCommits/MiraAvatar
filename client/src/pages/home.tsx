import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { csrfFetch, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProcessSteps from "@/components/process-steps";
import UploadSection from "@/components/upload-section";
import AvatarSection from "@/components/avatar-section";
import FeedbackSection from "@/components/feedback-section";
import { Button } from "@/components/ui/button";
import { HelpCircle, User, Github, Twitter, Linkedin, MessageCircle, Mic } from "lucide-react";
import { Link } from "wouter";
import type { CvAnalysis } from "@shared/schema";

export default function Home() {
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const { toast } = useToast();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('cv', file);
      
      const response = await csrfFetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisId(data.id);
      // Clear any existing cache for this analysis
      queryClient.removeQueries({ queryKey: ['/api/cv/analysis', data.id] });
      toast({
        title: "Upload successful",
        description: "Your CV is being analyzed. Please wait...",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Analysis query - More robust polling with error handling
  const { data: analysis, error: analysisError, isLoading } = useQuery<CvAnalysis>({
    queryKey: ['/api/cv/analysis', analysisId],
    enabled: !!analysisId,
    refetchInterval: (queryData) => {
      const data = queryData?.state?.data;
      console.log('Polling analysis:', analysisId, 'Status:', data?.status, 'Full Data:', data);
      console.log('Query state:', queryData?.state);
      // Continue polling if still processing or if we don't have data yet
      if (!data || data.status === 'processing') {
        return 1000; // Poll every 1 second for faster updates
      }
      console.log('Stopping polling - analysis completed with status:', data.status);
      return false; // Stop polling when completed
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Override default to always fetch fresh data
    gcTime: 0, // Disable garbage collection to prevent data loss
    retry: (failureCount, error) => {
      console.log('Query retry attempt:', failureCount, error);
      return failureCount < 3;
    }
  });

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleAnalyzeAnother = () => {
    setAnalysisId(null);
    queryClient.clear();
  };

  // Force refresh the current analysis
  const forceRefresh = () => {
    if (analysisId) {
      console.log('Force refreshing analysis:', analysisId);
      queryClient.removeQueries({ queryKey: ['/api/cv/analysis', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['/api/cv/analysis', analysisId] });
      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/cv/analysis', analysisId] });
      }, 100);
    }
  };

  // Debug function to manually load the completed analysis
  const loadCompletedAnalysis = () => {
    setAnalysisId(1); // Load the analysis we know exists
  };

  const currentStep = analysisId 
    ? analysis?.status === 'completed' 
      ? 'feedback' 
      : 'processing'
    : 'upload';

  // Debug logging
  console.log('Analysis data:', analysis);
  console.log('Current step:', currentStep);
  console.log('Analysis ID:', analysisId);
  console.log('Analysis status from data:', analysis?.status);
  console.log('Is loading:', isLoading);

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-background/60 border-b border-border/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 hyperdash-gradient rounded-2xl flex items-center justify-center shadow-xl">
                  <User className="text-black w-6 h-6" />
                </div>
                <div className="absolute -inset-1 hyperdash-gradient rounded-2xl blur opacity-30"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground hyperdash-gradient-text">CV Analyzer Pro</h1>
                <p className="text-sm text-muted-foreground/80">AI-Powered Career Intelligence Platform</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  AI Chat
                </Button>
              </Link>
              <Link href="/live-voice">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Mic className="w-4 h-4 mr-2" />
                  Live Voice
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </Button>
              <Button size="sm" className="hyperdash-button text-white font-medium">
                <User className="w-4 h-4 mr-2" />
                My Account
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-black hyperdash-gradient-text leading-tight">
                Career Intelligence
              </h2>
              <div className="max-w-3xl mx-auto">
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  Transform your career with cutting-edge AI analysis, personalized insights, and interactive voice feedback
                </p>
              </div>
            </div>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-primary font-medium">Real-time AI Analysis</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-400 font-medium">Voice Feedback</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span className="text-cyan-400 font-medium">Actionable Insights</span>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="mb-16">
          <ProcessSteps currentStep={currentStep} />
        </section>

        {/* Main Content Grid */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
          {/* Upload Section - Takes 2 columns on XL screens */}
          <div className="xl:col-span-2">
            <UploadSection 
              onFileUpload={handleFileUpload}
              isUploading={uploadMutation.isPending}
            />
          </div>
          
          {/* Avatar Section - Takes 1 column on XL screens */}
          <div className="xl:col-span-1">
            <AvatarSection 
              analysis={analysis || null}
              isProcessing={currentStep === 'processing'}
            />
          </div>
        </section>

        {/* Debug Controls */}
        {!analysisId && (
          <div className="flex justify-center mb-8">
            <Button 
              onClick={loadCompletedAnalysis}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              🔗 Load Demo Analysis
            </Button>
          </div>
        )}

        {/* Feedback Section */}
        <section>
          <FeedbackSection 
            analysis={analysis || null}
            onAnalyzeAnother={handleAnalyzeAnother}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card/30 border-t border-border/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 grok-gradient rounded-lg flex items-center justify-center">
                  <User className="text-white w-4 h-4" />
                </div>
                <span className="text-lg font-semibold text-foreground">AI Avatar CV Analyzer</span>
              </div>
              <p className="text-muted-foreground mb-4">Revolutionizing career development with AI-powered CV analysis and personalized feedback.</p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="grok-hover">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="grok-hover">
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="grok-hover">
                  <Github className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Features</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Pricing</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">API</Button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Help Center</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Contact Us</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Privacy Policy</Button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AI Avatar CV Analyzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
