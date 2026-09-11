"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "./LanguageProvider";
import {
  X,
  Send,
  Sparkles,
  User,
  RotateCcw,
  Minimize2,
  Maximize2,
  Copy,
  Check,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

const SAMPLE_QUESTIONS: Record<string, string[]> = {
  en: [
    "What is the 10-stage RFCTLARR 2013 lifecycle?",
    "How to verify my land parcel using 14-digit ULPIN?",
    "What is the strict 12-month limit under Section 19?",
    "How is 100% Solatium & 12% Interest calculated in Award?",
    "How does RoR Mutation title transfer work in BhoomiSetu?",
  ],
  hi: [
    "आरएफसीटीएलएआरआर 2013 के 10 वैधानिक चरण क्या हैं?",
    "14-अंकीय यूलपिन (ULPIN) से जमीन की स्थिति कैसे जांचें?",
    "धारा 19 के तहत 12 महीने की समयसीमा का क्या नियम है?",
    "मुआवजे में 100% सोलेशियम और 12% ब्याज कैसे जुड़ता है?",
    "भूमि सेतु में दाखिल-खारिज (RoR Mutation) कैसे ट्रैक होता है?",
  ],
  bn: [
    "আরএফসিটিএলএআরআর ২০১৩ আইনের ১০টি বিধিবদ্ধ ধাপ কি?",
    "১৪-ডিজিট ইউএলপিআইএন দিয়ে জমির স্থিতি কিভাবে যাচাই করব?",
    "ধারা ১৯-এর অধীন ১২ মাসের সময়সীমার নিয়ম কি?",
    "ক্ষতিপূরণে ১০০% সোলেশিয়াম ও ১২% সুদ কিভাবে হিসাব করা হয়?",
    "ভূমি সেতুতে জমির নামজারি (Mutation) কিভাবে পর্যবেক্ষণ করা হয়?",
  ],
  kn: [
    "ಆರ್‌ಎಫ್‌ಸಿಟಿಎಲ್‌ಎಆರ್‌ಆರ್ 2013 ರ 10 ಶಾಸನಬದ್ಧ ಹಂತಗಳು ಯಾವುವು?",
    "14-ಅಂಕಿಯ ಯುಎಲ್‌ಪಿಐಎನ್ ಬಳಸಿ ಭೂಮಿಯ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸುವುದು ಹೇಗೆ?",
    "ಸೆಕ್ಷನ್ 19 ರ ಅಡಿಯಲ್ಲಿ 12 ತಿಂಗಳ ಗಡುವಿನ ನಿಯಮವೇನು?",
    "ಪರಿಹಾರದಲ್ಲಿ 100% ಸೊಲೇಷಿಯಂ ಮತ್ತು 12% ಬಡ್ಡಿಯನ್ನು ಹೇಗೆ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ?",
    "ಭೂಮಿ ಸೇತುವಿನಲ್ಲಿ ಖಾತಾ ಬದಲಾವಣೆ (ಮ್ಯುಟೇಶನ್) ಹೇಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗುತ್ತದೆ?",
  ],
};

const WELCOME_MESSAGES: Record<string, string> = {
  en: "Namaste! I am **BhoomiSetu AI Sahayak (भूमि सेतु सहायक)**, your official assistant for the National Land Acquisition Control & Compliance Portal (DoLR, Ministry of Rural Development).\n\nAsk me anything about **RFCTLARR Act 2013 statutory timelines**, **14-digit ULPIN parcel lookup**, **compensation awards**, or **platform modules (GIS Atlas, Workflow, OCR, Risk Engine)**.",
  hi: "नमस्ते! मैं **भूमि सेतु एआई सहायक** हूँ, राष्ट्रीय भूमि अधिग्रहण नियंत्रण एवं अनुपालन पोर्टल (ग्रामीण विकास मंत्रालय, भारत सरकार) का आधिकारिक सहायक।\n\nआप मुझसे **आरएफसीटीएलएआरआर अधिनियम 2013 की वैधानिक समयसीमा**, **14-अंकीय यूलपिन भूखंड जांच**, **मुआवजा अवार्ड गणना**, या **पोर्टल मॉड्यूल (जीआईएस एटलस, कार्यप्रवाह, ओसीआर)** के बारे में पूछ सकते हैं।",
  bn: "নমস্কার! আমি **ভূমি সেতু এআই সহায়ক**, জাতীয় ভূমি অধিগ্রহণ নিয়ন্ত্রণ ও বিধিবদ্ধ সম্মতি পোর্টালের (ভূমি সম্পদ বিভাগ, গ্রামীণ উন্নয়ন মন্ত্রক) আধিকারিক সহকারী।\n\nআপনি আমাকে **আরএফসিটিএলএআরআর ২০১৩ আইন**, **১৪-ডিজিটের ইউএলপিআইএন অনুসন্ধান**, **ক্ষতিপূরণ প্রদান**, বা **পোর্টাল মডিউল** সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।",
  kn: "ನಮಸ್ಕಾರ! ನಾನು **ಭೂಮಿ ಸೇತು ಎಐ ಸಹಾಯಕ**, ರಾಷ್ಟ್ರೀಯ ಭೂಸ್ವಾಧೀನ ನಿಯಂತ್ರಣ ಮತ್ತು ಶಾಸನಬದ್ಧ ಅನುಸರಣಾ ಪೋರ್ಟಲ್‌ನ ಅಧಿಕೃತ ಸಹಾಯಕ.\n\nನೀವು ನನ್ನನ್ನು **ಆರ್‌ಎಫ್‌ಸಿಟಿಎಲ್‌ಎಆರ್‌ಆರ್ ಕಾಯ್ದೆ 2013 ರ ಶಾಸನಬದ್ಧ ಗಡುವುಗಳು**, **14-ಅಂಕಿಯ ಯುಎಲ್‌ಪಿಐಎನ್ ಪರಿಶೀಲನೆ**, **ಪರಿಹಾರ ಪ್ರಶಸ್ತಿ ಲೆಕ್ಕಾಚಾರ**, ಅಥವಾ **ಪೋರ್ಟಲ್ ಮಾಡ್ಯೂಲ್‌ಗಳ** ಬಗ್ಗೆ ಕೇಳಬಹುದು.",
};

export default function BhoomiChatbot() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize welcome message based on active language
  useEffect(() => {
    const welcome = WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en;
    setMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content: welcome,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [language]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText || isLoading) return;

    const userMessage: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.id !== "welcome-1")
        .map((m) => ({ role: m.role, content: m.content }));

      if (apiMessages.length === 0) {
        apiMessages.push({ role: "user", content: userText });
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          language: language || "en",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      const botReply =
        data.reply ||
        "I apologize, but I could not retrieve information at this moment. Please try again.";

      const botMessage: Message = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: botReply,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content:
            language === "hi"
              ? "क्षमा करें, प्रतिक्रिया उत्पन्न करने में समस्या आई। कृपया पुनः प्रयास करें।"
              : language === "bn"
              ? "দুঃখিত, উত্তর তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
              : language === "kn"
              ? "ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
              : "I apologize, but I encountered an issue retrieving the response. Please try again.",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    const welcome = WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en;
    setMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content: welcome,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const sampleList = SAMPLE_QUESTIONS[language] || SAMPLE_QUESTIONS.en;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden select-none">
      {/* ── 1. Floating Chat Window ─────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden transition-all duration-300 animate-fade-in ${
            isMinimized
              ? "w-80 h-14"
              : "w-[94vw] sm:w-[410px] md:w-[450px] h-[580px] max-h-[84vh] mb-3"
          }`}
          style={{ boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.35)" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center font-black text-sm text-white shadow-sm border border-amber-400/40 flex-shrink-0">
                भ
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">BhoomiSetu AI Sahayak</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400">
                  DoLR · Ministry of Rural Development Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={resetChat}
                title="Reset Conversation"
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Maximize" : "Minimize"}
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/70 space-y-3.5 text-xs">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-emerald-700 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                          भ
                        </div>
                      )}

                      <div
                        className={`relative max-w-[88%] rounded-2xl p-3.5 shadow-xs select-text ${
                          isUser
                            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                        }`}
                      >
                        {/* Render with ReactMarkdown so all bold, lists, and tables render properly without stray stars */}
                        {isUser ? (
                          <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="prose prose-xs max-w-none text-slate-800 leading-relaxed text-xs space-y-2">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>,
                                li: ({ children }) => <li className="text-slate-700">{children}</li>,
                                h1: ({ children }) => <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1">{children}</h3>,
                                h2: ({ children }) => <h4 className="font-bold text-slate-900 text-xs mt-2 mb-1">{children}</h4>,
                                h3: ({ children }) => <h5 className="font-bold text-slate-900 text-xs mt-1.5 mb-0.5">{children}</h5>,
                                code: ({ children }) => (
                                  <code className="bg-slate-100 text-amber-800 px-1 py-0.5 rounded font-mono text-[11px]">
                                    {children}
                                  </code>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-2 rounded-lg border border-slate-200">
                                    <table className="w-full text-[11px] text-left border-collapse">{children}</table>
                                  </div>
                                ),
                                th: ({ children }) => (
                                  <th className="bg-slate-100 font-bold p-1.5 border-b border-slate-200 text-slate-900">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="p-1.5 border-b border-slate-100 text-slate-700">{children}</td>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Timestamp & copy */}
                        <div
                          className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t ${
                            isUser ? "border-amber-500/40 text-amber-200" : "border-slate-100 text-slate-400"
                          } text-[9px]`}
                        >
                          <span>{msg.timestamp}</span>
                          {!isUser && (
                            <button
                              onClick={() => copyToClipboard(msg.id, msg.content)}
                              className="hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 justify-start animate-fade-in">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-emerald-700 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 shadow-xs">
                      भ
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-150" />
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-300" />
                        <span className="ml-1 text-[11px] font-medium text-slate-400">
                          Consulting RFCTLARR &amp; DoLR registry...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Sample Quick Questions Bar */}
              <div className="p-2.5 bg-white border-t border-slate-100 flex-shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Suggested Platform Inquiries
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {sampleList.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-700 text-[11px] border border-slate-200/80 whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="relative flex-1">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        language === "hi"
                          ? "भूमि अधिग्रहण या पोर्टल के बारे में प्रश्न पूछें..."
                          : language === "bn"
                          ? "ভূমি অধিগ্রহণ বা পোর্টাল সম্পর্কে প্রশ্ন করুন..."
                          : language === "kn"
                          ? "ಭೂಸ್ವಾಧೀನ ಅಥವಾ ಪೋರ್ಟಲ್ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ..."
                          : "Ask about land acquisition, ULPIN, or RFCTLARR..."
                      }
                      rows={1}
                      className="w-full pl-3 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 resize-none max-h-24 min-h-[38px] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="text-[9px] text-center text-slate-400 mt-1.5">
                  Official AI assistant for RFCTLARR Act 2013 &amp; BhoomiSetu platform compliance.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 2. Floating Launcher Button ──────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl hover:scale-105 border-2 border-amber-400/80 transition-all duration-300 cursor-pointer"
          style={{ boxShadow: "0 10px 30px -5px rgba(245, 158, 11, 0.4)" }}
          aria-label="Open BhoomiSetu AI Sahayak"
        >
          {/* Saffron & Green Accent Pill */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-xs border border-amber-300">
            भ
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                AI Sahayak <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[9px] text-amber-300 font-medium">
              {language === "hi"
                ? "भूमि सेतु सहायक"
                : language === "bn"
                ? "সহায়ক"
                : language === "kn"
                ? "ಸಹಾಯಕ"
                : "Land Portal Assistant"}
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
