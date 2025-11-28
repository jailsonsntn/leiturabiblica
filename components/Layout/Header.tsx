import React from 'react';
import { BookOpen } from 'lucide-react';
import { COLORS } from '../../constants';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-center gap-3">
        <div 
          className="p-2 rounded-lg bg-[#F7FAFB] dark:bg-slate-800 transition-colors"
        >
          <BookOpen size={24} className="text-[#2C6BA6] dark:text-blue-400" />
        </div>
        <h1 
          className="text-xl font-bold tracking-tight text-[#2C6BA6] dark:text-white"
        >
          Leitura Anual
        </h1>
      </div>
    </header>
  );
};