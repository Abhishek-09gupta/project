import React from 'react';
import { Terminal, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05080f]/70 py-6 text-gray-500 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        {/* Left: Branding */}
        <div className="flex items-center space-x-2 text-xs">
          <Terminal className="w-4 h-4 text-indigo-500" />
          <span>© {new Date().getFullYear()} CodeArena. All Rights Reserved.</span>
        </div>

        {/* Center: System Status */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute"></div>
          <span className="text-gray-400">Sandbox Judge Environment Online</span>
        </div>

        {/* Right: Credits */}
        <div className="flex items-center space-x-4 text-xs">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <span className="flex items-center text-[10px]">
            Designed with <Heart className="w-3 h-3 text-indigo-500 fill-indigo-500 mx-1" /> for builders
          </span>
        </div>
      </div>
    </footer>
  );
}
