import React from 'react';
import { Database, MessageSquareCode, ShieldCheck, Server, ArrowRight, Sparkles } from 'lucide-react';

export const AuthGraphic: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/40 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-200/80">
      {/* Background ambient glow circles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-lg text-slate-900 tracking-tight">NL2SQL</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">AI</span>
          </div>
          <p className="text-xs text-slate-500 font-medium -mt-0.5">AI Database Assistant</p>
        </div>
      </div>

      {/* Center Value Proposition */}
      <div className="relative z-10 my-auto py-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold mb-4 border border-blue-200/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Enterprise SQL Intelligence</span>
        </div>

        <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Turn Your Data into Answers with AI
        </h1>
        
        <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-lg">
          Ask questions about your database in natural language. No SQL knowledge required.
        </p>

        {/* Feature List */}
        <div className="mt-8 space-y-4">
          {/* Feature 1 */}
          <div className="flex items-start space-x-3.5 p-3 rounded-xl hover:bg-white/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 mt-0.5 shadow-sm">
              <MessageSquareCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Natural Language Queries</h3>
              <p className="text-xs text-slate-500 mt-0.5">Get answers without writing SQL</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start space-x-3.5 p-3 rounded-xl hover:bg-white/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 mt-0.5 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Secure & Controlled Access</h3>
              <p className="text-xs text-slate-500 mt-0.5">Role-based permissions & audit trails</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start space-x-3.5 p-3 rounded-xl hover:bg-white/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 mt-0.5 shadow-sm">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Works with Your Databases</h3>
              <p className="text-xs text-slate-500 mt-0.5">Connect your existing MySQL & MongoDB databases</p>
            </div>
          </div>
        </div>

        {/* Interactive Query Prompt Preview Banner (matches image bottom card) */}
        <div className="mt-8 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-blue-500/5 border border-blue-100/80 max-w-md">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 shadow-inner">
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Show me total employees in each department</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Graphic Representation: Database Cylinder + Data Chart */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between px-2">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-12 h-4 rounded-full bg-blue-500 shadow-sm border border-blue-400"></div>
                <div className="w-12 h-3 bg-blue-600 -mt-2 border-x border-blue-600"></div>
                <div className="w-12 h-4 rounded-full bg-blue-500 shadow-sm -mt-2 border border-blue-400"></div>
                <div className="w-12 h-3 bg-blue-700 -mt-2 border-x border-blue-700"></div>
                <div className="w-12 h-4 rounded-full bg-blue-600 shadow-md -mt-2 border border-blue-500"></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Company DB</p>
                <p className="text-[10px] text-emerald-600 font-medium flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                  Active Schema Indexed
                </p>
              </div>
            </div>

            {/* Mini Bar Chart Mock */}
            <div className="flex items-end space-x-1.5 h-9 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
              <div className="w-2 bg-blue-300 rounded-t h-4"></div>
              <div className="w-2 bg-blue-400 rounded-t h-6"></div>
              <div className="w-2 bg-blue-500 rounded-t h-8"></div>
              <div className="w-2 bg-blue-600 rounded-t h-5"></div>
              <div className="w-2 bg-indigo-600 rounded-t h-7"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200/60">
        <p>© 2026 NL2SQL AI Assistant. All rights reserved.</p>
        <span className="inline-flex items-center text-slate-500 font-medium">
          Enterprise Ready • MongoDB & MySQL
        </span>
      </div>
    </div>
  );
};
