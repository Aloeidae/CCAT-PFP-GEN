/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Star, AlertCircle, RefreshCw, Globe, Send, Twitter, TrendingUp, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const t = {
  EN: {
    title: "Communist Cat",
    subtitle: "Recruitment Center",
    description: "Join the glorious ranks! Upload a comrade's portrait to receive an official state-issued Ushanka. Our glorious AI will ensure perfect Soviet compliance and perspective alignment.",
    upload_zone: "Provide Identification Photo",
    upload_hint: "Click or Drag & Drop to submit documents",
    original_label: "Unverified Citizen",
    resubmit: "[ Resubmit ]",
    start_over: "Process New Comrade",
    result_label: "Official Comrade",
    processing: "Manufacturing Ushanka...",
    ready: "Subject ready for uniform distribution.",
    button: "Issue Uniform",
    error_type: "Please select a valid state-approved image file.",
    comms_title: "Party Communications",
    comms_hint: "Approved channels of the glorious collective",
    ca_label: "State Contract Address",
    copy: "Copy",
    copied: "Copied, Comrade!",
    footer_motto: "For the glory of the collective",
  },
  RU: {
    title: "Коммунистический Кот",
    subtitle: "Призывной Пункт",
    description: "Вступай в славные ряды! Загрузите портрет товарища, чтобы получить ушанку. Наш великий ИИ обеспечит идеальное соответствие советским стандартам.",
    upload_zone: "Предоставьте Фотографию",
    upload_hint: "Нажмите или перетащите для подачи документов",
    original_label: "Неопознанный Гражданин",
    resubmit: "[ Пересдать ]",
    start_over: "Оформить Нового Товарища",
    result_label: "Официальный Товарищ",
    processing: "Производство Ушанки...",
    ready: "Субъект готов к выдаче униформы.",
    button: "Выдать Униформу",
    error_type: "Пожалуйста, предоставьте утвержденный файл изображения.",
    comms_title: "Партийная Связь",
    comms_hint: "Утверждённые каналы славного коллектива",
    ca_label: "Адрес Государственного Контракта",
    copy: "Копировать",
    copied: "Скопировано, Товарищ!",
    footer_motto: "Во славу коллектива",
  }
};

type Lang = 'EN' | 'RU';

const LINKS = {
  x: "https://x.com/communistcatcto",
  telegram: "https://t.me/communistcaton",
  dexscreener: "https://dexscreener.com/ton/EQAfFMatcv3y7XGCenhc7lpWDYSfEo1wO8FPEMf4A5POpUYQ",
  website: "https://communistcat.fun/",
};
const CONTRACT = "EQBpfD5q4aFgHU17KvNPN_P0QOy41MOIj2TwGX0bbAz44DNs";

export default function App() {
  const [lang, setLang] = useState<Lang>('EN');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const l = t[lang];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError(l.error_type);
        return;
      }
      setSelectedFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
       if (!file.type.startsWith("image/")) {
        setError(l.error_type);
        return;
      }
      setSelectedFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOriginalPreview(null);
    setResultImage(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        body: formData,
      });

      // The API always replies with JSON. If we get HTML instead (an SPA
      // fallback when no backend is present, or a proxy/cold-start error page)
      // show a themed message rather than a raw "unexpected token '<'" error.
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          "The recruitment bureau could not be reached, comrade. The processing service may be offline or waking from its slumber — try again shortly."
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setResultImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-neutral-200 font-sans p-6 md:p-12 overflow-x-hidden selection:bg-red-600 selection:text-white relative">
      {/* Heavy Constructivist Geometry */}
      <div className="fixed top-0 left-0 w-full h-4 bg-red-700 z-50"></div>
      <div className="fixed top-4 left-0 w-full h-1 bg-red-900 z-50"></div>
      <div className="fixed top-0 left-[-20%] w-[140%] h-[30vh] bg-red-900/10 -rotate-6 transform origin-top-left pointer-events-none -z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-red-700/[0.03] rotate-45 pointer-events-none -z-0"></div>
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#111]/80 to-[#0a0a0a] pointer-events-none z-0"></div>

      {/* Language Toggle */}
      <div className="fixed top-8 right-8 z-50 flex items-center shadow-[4px_4px_0_0_#991b1b]">
        <button 
          onClick={() => setLang('EN')} 
          className={`px-4 py-2 font-display uppercase tracking-widest text-sm border-2 border-red-800 transition-colors ${lang === 'EN' ? 'bg-red-700 text-white' : 'bg-[#222] text-neutral-500 hover:text-white'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('RU')} 
          className={`px-4 py-2 font-display uppercase tracking-widest text-sm border-2 border-l-0 border-red-800 transition-colors ${lang === 'RU' ? 'bg-red-700 text-white' : 'bg-[#222] text-neutral-500 hover:text-white'}`}
        >
          RU
        </button>
      </div>
      
      <div className="max-w-5xl mx-auto space-y-12 relative z-10 pt-8">
        
        <header className="text-center space-y-6 max-w-4xl mx-auto pb-6 relative z-10 w-full">
          <div className="flex justify-center mb-6 relative">
            <Star className="w-16 h-16 text-[#ffcc00] fill-[#ffcc00] drop-shadow-[0_0_15px_rgba(255,204,0,0.4)] relative z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-700/20 rotate-45"></div>
          </div>
          
          <div className="px-4 w-full">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display tracking-wider text-red-600 uppercase drop-shadow-xl max-w-full break-words text-center leading-tight">
              {l.title}
            </h1>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-display tracking-[0.2em] text-[#ffcc00] uppercase mt-2 px-4 text-center pb-6 border-b-2 border-red-900/50">
            {l.subtitle}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto font-mono mt-6 text-center px-4">
            {l.description}
          </p>
        </header>

        {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950 border border-red-500 text-red-200 px-6 py-4 rounded-none flex items-center gap-3 text-sm font-medium w-full max-w-2xl mx-auto shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]"
            >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="uppercase tracking-wide">{error}</span>
            </motion.div>
        )}

        {!selectedFile ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               onDragOver={(e) => e.preventDefault()}
               onDrop={handleDrop}
               onClick={() => fileInputRef.current?.click()}
               className="border-4 border-dashed border-red-800 hover:border-red-500 bg-[#222] hover:bg-[#2a2a2a] transition-all cursor-pointer rounded-none p-16 flex flex-col items-center justify-center gap-6 text-neutral-400 group max-w-2xl mx-auto aspect-video relative shadow-[8px_8px_0px_0px_rgba(153,27,27,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(220,38,38,0.8)]"
            >
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                />
                <div className="w-20 h-20 bg-red-950 border-2 border-red-800 group-hover:border-red-500 rounded-none flex items-center justify-center transition-colors">
                    <Upload className="w-10 h-10 text-red-500" />
                </div>
                <div className="text-center space-y-3">
                    <p className="text-red-500 font-display text-2xl uppercase tracking-[0.15em] bg-red-950/30 px-4 py-1">{l.upload_zone}</p>
                    <p className="text-sm font-mono text-neutral-500 uppercase tracking-widest">{l.upload_hint}</p>
                </div>
            </motion.div>
        ) : (
            <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start">
                    
                    {/* Original Area */}
                    <div className="space-y-6 relative">
                        <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-red-800"></div>
                        <div className="flex items-center justify-between border-b-4 border-neutral-800 pb-3">
                            <h3 className="font-display text-red-500 flex items-center gap-3 text-xl uppercase tracking-widest">
                                <ImageIcon className="w-6 h-6" /> {l.original_label}
                            </h3>
                            {!isLoading && !resultImage && (
                                <button onClick={handleReset} className="font-mono text-sm text-neutral-500 hover:text-red-400 transition-colors uppercase tracking-wider bg-neutral-900 px-3 py-1 border border-neutral-700">
                                    {l.resubmit}
                                </button>
                            )}
                        </div>
                        <div className="bg-[#1a1a1a] p-3 border-4 border-neutral-800 relative group shadow-[12px_12px_0_0_rgba(153,27,27,0.2)]">
                            <img src={originalPreview!} alt="Original upload" className="w-full h-auto object-cover aspect-[4/5] md:aspect-auto grayscale-[30%] contrast-125 sepia-[20%]" />
                            {resultImage && (
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
                                    <button onClick={handleReset} className="bg-red-700 text-white font-display text-lg px-8 py-4 uppercase tracking-widest hover:bg-red-600 transition-colors border-2 border-red-400 shadow-[6px_6px_0_0_#ffcc00] flex items-center gap-3 active:translate-y-1 active:translate-x-1 active:shadow-none">
                                        <RefreshCw className="w-6 h-6" /> {l.start_over}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result Area */}
                    <div className="space-y-6 relative">
                        <div className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-[#ffcc00] opacity-50"></div>
                        <div className="border-b-4 border-neutral-800 pb-3">
                            <h3 className="font-display text-[#ffcc00] flex items-center gap-3 text-xl uppercase tracking-widest">
                                <Star className="w-6 h-6" /> {l.result_label}
                            </h3>
                        </div>
                        
                        <AnimatePresence mode="popLayout">
                            {!resultImage ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-[#1a1a1a] border-4 border-dashed border-neutral-700 flex flex-col items-center justify-center aspect-[4/5] shadow-inner p-8 text-center relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                                    {isLoading ? (
                                        <div className="flex flex-col items-center gap-8 text-red-500 z-10">
                                            <div className="w-16 h-16 border-8 border-red-950 border-t-red-600 rounded-none animate-spin"></div>
                                            <p className="font-display text-2xl uppercase tracking-[0.2em] animate-pulse text-[#ffcc00] bg-black/50 px-4 py-2 border border-red-900/50">{l.processing}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-10 z-10">
                                            <div className="w-24 h-24 bg-red-950 border-4 border-red-800 rotate-45 flex items-center justify-center shadow-[8px_8px_0_0_rgba(220,38,38,0.3)] hover:rotate-[135deg] transition-all duration-700">
                                                <Star className="w-12 h-12 text-red-500 fill-red-500 lg:animate-pulse -rotate-45" />
                                            </div>
                                            <div className="space-y-8 max-w-sm text-center">
                                                <p className="text-neutral-400 font-mono text-base uppercase tracking-widest bg-black/40 p-3 border-l-2 border-[#ffcc00] text-left">{l.ready}</p>
                                                <button 
                                                    onClick={handleSubmit} 
                                                    className="w-full bg-red-700 hover:bg-red-600 text-white font-display text-2xl uppercase tracking-[0.2em] py-6 px-8 shadow-[8px_8px_0_0_#ffcc00] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#ffcc00] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none border-2 border-red-500 relative overflow-hidden group"
                                                >
                                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                                    {l.button}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#1a1a1a] p-3 shadow-[12px_12px_0_0_#ffcc00] border-4 border-red-700 overflow-hidden relative"
                                >
                                    <div className="absolute top-4 left-4 w-12 h-12 border-2 border-red-500/50 rounded-full flex items-center justify-center z-10 pointer-events-none mix-blend-overlay">
                                        <div className="w-1 h-4 bg-red-500/50"></div>
                                        <div className="w-4 h-1 bg-red-500/50 absolute"></div>
                                    </div>
                                    <div className="absolute bottom-4 right-4 text-[#ffcc00] font-mono text-xs opacity-50 z-10 pointer-events-none mix-blend-overlay uppercase">
                                        [ APPROVED ]
                                    </div>
                                    <img src={resultImage} alt="Composited result" className="w-full h-auto object-cover aspect-[4/5] md:aspect-auto contrast-110 saturate-[1.1] sepia-[10%]" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        )}

        {/* Party Communications / Official Channels */}
        <footer className="pt-10 mt-8 border-t-4 border-red-900/50 space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="h-[3px] w-12 bg-red-700"></div>
              <Star className="w-5 h-5 text-[#ffcc00] fill-[#ffcc00]" />
              <h3 className="font-display text-[#ffcc00] uppercase tracking-[0.2em] text-xl sm:text-2xl">{l.comms_title}</h3>
              <Star className="w-5 h-5 text-[#ffcc00] fill-[#ffcc00]" />
              <div className="h-[3px] w-12 bg-red-700"></div>
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">{l.comms_hint}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { href: LINKS.x, label: "X", Icon: Twitter },
              { href: LINKS.telegram, label: "Telegram", Icon: Send },
              { href: LINKS.dexscreener, label: "Dexscreener", Icon: TrendingUp },
              { href: LINKS.website, label: "Website", Icon: Globe },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 bg-[#1a1a1a] border-2 border-red-800 hover:border-[#ffcc00] px-4 py-4 transition-all shadow-[4px_4px_0_0_rgba(153,27,27,0.5)] hover:shadow-[6px_6px_0_0_#ffcc00] hover:-translate-x-[2px] hover:-translate-y-[2px]"
              >
                <Icon className="w-5 h-5 text-red-500 group-hover:text-[#ffcc00] transition-colors" />
                <span className="font-display uppercase tracking-widest text-sm text-neutral-300 group-hover:text-white">{label}</span>
              </a>
            ))}
          </div>

          <div className="max-w-3xl mx-auto bg-red-950/30 border-2 border-red-900 p-4 shadow-[6px_6px_0_0_rgba(153,27,27,0.3)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-red-700 rotate-45 flex items-center justify-center">
                <Star className="w-3 h-3 text-[#ffcc00] fill-[#ffcc00] -rotate-45" />
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#ffcc00]">{l.ca_label}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <code className="font-mono text-xs sm:text-sm text-neutral-300 break-all flex-1 min-w-0">{CONTRACT}</code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-display uppercase tracking-widest text-xs px-4 py-2 border-2 border-red-500 shadow-[3px_3px_0_0_#ffcc00] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? l.copied : l.copy}
              </button>
            </div>
          </div>

          <p className="text-center font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-neutral-600 pt-2">
            ☭ {l.title} // {l.footer_motto} ☭
          </p>
        </footer>

      </div>
    </div>
  );
}
