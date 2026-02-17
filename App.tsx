
import React, { useState } from 'react';
import FileUpload from './components/FileUpload.tsx';
import Dashboard from './components/Dashboard.tsx';
import ChatInterface from './components/ChatInterface.tsx';
import { parseCSV, parseExcel, parsePDF } from './services/fileParser.ts';
import { analyzeData, chatWithData } from './services/geminiService.ts';
import { DataAnalysisResult, ChatMessage, FileData } from './types.ts';

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [analysis, setAnalysis] = useState<DataAnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      let content = '';
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        const text = await file.text();
        content = parseCSV(text);
      } else if (extension === 'xlsx' || extension === 'xls') {
        content = await parseExcel(file);
      } else if (extension === 'pdf') {
        content = await parsePDF(file);
      } else {
        throw new Error('Unsupported file format. Please upload CSV, Excel, or PDF.');
      }

      setFileData({ name: file.name, content, type: extension || '' });
      
      const result = await analyzeData(file.name, content);
      setAnalysis(result);
      
      setChatMessages([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during file processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!fileData) return;

    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await chatWithData(
        text, 
        fileData.content, 
        chatMessages.map(m => ({ role: m.role, text: m.text }))
      );
      
      const aiMsg: ChatMessage = { role: 'model', text: response || 'Sorry, I could not process that.', timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = { role: 'model', text: 'Error: ' + err.message, timestamp: new Date() };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReset = () => {
    setFileData(null);
    setAnalysis(null);
    setChatMessages([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <span className="text-white font-bold">IS</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">InsightStream <span className="text-blue-600">AI</span></h1>
          </div>
          {fileData && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors px-3 py-1 hover:bg-slate-50 rounded-lg"
            >
              Reset / New Upload
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {!analysis && !isProcessing ? (
          <div className="py-12 flex flex-col items-center">
            <div className="text-center mb-12 max-w-2xl">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">Turn raw files into actionable insights.</h2>
              <p className="text-lg text-slate-600">Upload your CSV, Excel, or PDF and let our AI handle the heavy lifting. Get instant analytics, suggestions, and answers to your complex questions.</p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isLoading={isProcessing} />
            {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm flex items-center gap-3">
                <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800">Analyzing Your Data</h3>
              <p className="text-slate-500">Gemini is processing insights and generating your dashboard...</p>
            </div>
          </div>
        ) : analysis && fileData && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-8">
              <Dashboard analysis={analysis} fileName={fileData.name} />
            </div>
            
            <div className="xl:col-span-4 sticky top-24">
              <ChatInterface 
                messages={chatMessages} 
                onSendMessage={handleSendMessage} 
                isLoading={isChatLoading}
                fileName={fileData.name}
              />
              <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs text-slate-400">
                <p>AI can make mistakes. Check important info.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center">
        <p className="text-slate-400 text-sm font-medium">Powered by Gemini 3 Pro & Google Generative AI</p>
      </footer>
    </div>
  );
};

export default App;
