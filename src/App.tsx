import React, { useState, useCallback, useRef } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Image as ImageIcon, 
  Wand2,
  History,
  Trash2,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast, Toaster } from 'sonner';
import { editImage } from '@/lib/gemini';
import { cn } from '@/lib/utils';

interface ImageState {
  url: string;
  base64: string;
  mimeType: string;
}

export default function App() {
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageState | null>(null);
  const [history, setHistory] = useState<ImageState[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop: DropzoneOptions['onDrop'] = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const newState = {
        url: reader.result as string,
        base64,
        mimeType: file.type
      };
      setOriginalImage(newState);
      setCurrentImage(newState);
      setHistory([newState]);
      toast.success('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: !!currentImage
  } as any);

  const handleEdit = async () => {
    if (!currentImage || !prompt.trim()) return;

    setIsProcessing(true);
    try {
      const resultUrl = await editImage(currentImage.base64, currentImage.mimeType, prompt);
      const base64 = resultUrl.split(',')[1];
      const newState = {
        url: resultUrl,
        base64,
        mimeType: currentImage.mimeType
      };
      setCurrentImage(newState);
      setHistory(prev => [...prev, newState]);
      setPrompt('');
      toast.success('Transformation complete!');
    } catch (error) {
      toast.error('Failed to edit image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);
    setCurrentImage(newHistory[newHistory.length - 1]);
    toast.info('Reverted to previous state');
  };

  const handleReset = () => {
    if (!originalImage) return;
    setCurrentImage(originalImage);
    setHistory([originalImage]);
    toast.info('Reset to original image');
  };

  const downloadImage = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `imagiworld-edit-${Date.now()}.png`;
    link.click();
  };

  const quickPrompts = [
    "Make it a cyberpunk world",
    "Add a magical forest background",
    "Change the lighting to sunset",
    "Add a cute robot in the corner",
    "Make it look like an oil painting",
    "Add floating islands in the sky"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30">
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">ImagiWorld <span className="text-orange-500">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-2">
          {currentImage && (
            <>
              <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length <= 1 || isProcessing} className="text-zinc-400 hover:text-white">
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} disabled={isProcessing} className="text-zinc-400 hover:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={downloadImage} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Save Result
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">AI Transformation</label>
              <div className="space-y-2">
                <textarea
                  placeholder="Describe the world you want to create... (e.g., 'Add a futuristic city in the background')"
                  className="w-full bg-zinc-900 border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all min-h-[120px] resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={!currentImage || isProcessing}
                />
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 h-12 rounded-xl font-semibold"
                  disabled={!currentImage || !prompt.trim() || isProcessing}
                  onClick={handleEdit}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transforming...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Apply Magic
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Quick Styles</label>
              <div className="grid grid-cols-1 gap-2">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    disabled={!currentImage || isProcessing}
                    className="text-left px-3 py-2 rounded-lg text-sm bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900 transition-all text-zinc-400 hover:text-zinc-100"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Preview */}
          <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <History className="w-3 h-3" />
                History
              </label>
              <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">
                {history.length} steps
              </Badge>
            </div>
            <ScrollArea className="h-32">
              <div className="flex gap-2 pb-2">
                {history.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(step)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all",
                      currentImage?.url === step.url ? "border-orange-500 scale-95" : "border-transparent opacity-50 hover:opacity-100"
                    )}
                  >
                    <img src={step.url} alt={`Step ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Canvas Area */}
        <section className="flex-1 bg-[#050505] relative overflow-hidden flex items-center justify-center p-8">
          <div 
            {...getRootProps()} 
            className={cn(
              "relative max-w-full max-h-full transition-all duration-300",
              !currentImage && "w-full h-full flex items-center justify-center"
            )}
          >
            <input {...getInputProps()} />
            
            <AnimatePresence mode="wait">
              {!currentImage ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "w-full max-w-xl aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-6 transition-colors",
                    isDragActive ? "border-orange-500 bg-orange-500/5" : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                  )}
                >
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
                    <Upload className={cn("w-8 h-8 transition-colors", isDragActive ? "text-orange-500" : "text-zinc-500")} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Upload your world</h3>
                    <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                      Drag and drop an image here, or click to browse your files
                    </p>
                  </div>
                  <Button className="bg-zinc-100 text-zinc-950 hover:bg-white px-8">
                    Select Image
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key={currentImage.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group shadow-2xl shadow-black/50 rounded-2xl overflow-hidden border border-zinc-800"
                >
                  <img 
                    src={currentImage.url} 
                    alt="Current Edit" 
                    className="max-w-full max-h-[calc(100vh-160px)] object-contain"
                    referrerPolicy="no-referrer"
                  />
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                          <Sparkles className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-white font-medium animate-pulse">Reimagining your world...</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge className="bg-black/60 backdrop-blur-md border-zinc-700 text-zinc-300">
                      {currentImage.mimeType.split('/')[1].toUpperCase()}
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          </div>
        </section>
      </main>
    </div>
  );
}
