import React, { ReactNode, useState } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
  environment?: string;
}

/**
 * Common layout component with navigation bar and footer
 */
export default function Layout({ children, environment = 'Unknown' }: LayoutProps) {
  const [showDebug, setShowDebug] = useState<boolean>(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="text-center py-6 text-gray-600">
        <p>COS72 - Community OS &copy; {new Date().getFullYear()}</p>
        <p className="text-sm">Version v0.3.3</p>
        
        {/* Debug toggle button */}
        <button 
          onClick={() => setShowDebug(prev => !prev)}
          className="text-xs px-2 py-1 mt-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        
        {/* Debug information */}
        {showDebug && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 mb-4 mt-2 mx-auto max-w-2xl">
            <p className="font-semibold">Debug Information:</p>
            <ul className="text-xs mt-1">
              <li>Environment: {environment}</li>
              <li>window.__TAURI__: {typeof window !== 'undefined' ? (window.__TAURI__ ? 'exists' : 'not found') : 'undefined'}</li>
              <li>window.__TAURI_IPC__: {typeof window !== 'undefined' ? (typeof window.__TAURI_IPC__ === 'undefined' ? 'undefined' : 'defined') : 'unknown'}</li>
              <li>window.__IS_TAURI_APP__: {typeof window !== 'undefined' ? String(!!window.__IS_TAURI_APP__) : 'unknown'}</li>
              <li>Tauri in UserAgent: {typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Tauri') ? 'present' : 'not found') : 'unknown'}</li>
            </ul>
          </div>
        )}
      </footer>
    </div>
  );
} 