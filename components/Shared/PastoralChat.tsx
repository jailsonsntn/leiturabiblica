import React, { useState } from 'react';
import { MessageCircle, Send, Sparkles, Loader2 } from 'lucide-react';
import { COLORS } from '../../constants';
import { generatePastoralReflection } from '../../services/geminiService';
import { ChatMessage } from '../../types';

interface PastoralChatProps {
  verseText: string;
  verseReference: string;
}

export const PastoralChat: React.FC<PastoralChatProps> = ({ verseText, verseReference }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput('');

    const response = await generatePastoralReflection(verseText, verseReference, userMsg.text);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all hover:bg-opacity-50 dark:hover:bg-opacity-10"
        style={{ borderColor: COLORS.primary, color: COLORS.primary, backgroundColor: '#F0F9FF' }} // Inline styles override dark classes, need to be careful or use classes
      >
        <Sparkles size={18} />
        <span className="font-medium text-sm">Refletir com Assistente Pastoral (IA)</span>
      </button>
    );
  }

  return (
    <div className="mt-4 bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-blue-50 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-blue-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#2C6BA6] dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Assistente Pastoral</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          Fechar
        </button>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-slate-950 min-h-[150px] max-h-[300px] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-slate-500 text-center italic mt-4">
            Pergunte sobre como aplicar este versículo hoje...
          </p>
        )}
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-tl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-slate-700 shadow-sm">
                <Loader2 size={16} className="animate-spin text-blue-500" />
             </div>
          </div>
        )}
      </div>

      <div className="p-2 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escreva sua dúvida..."
          className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 placeholder-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};