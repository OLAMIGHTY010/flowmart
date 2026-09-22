import React from 'react';

interface LogoLoaderProps {
  message?: string;
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="relative flex flex-col items-center">
        <img 
          src="/flowmart.png" 
          alt="Loading FlowMart" 
          className="w-24 h-24 object-contain animate-pulse mb-4" 
        />
        {message !== '' && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
            {message || 'Loading...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default LogoLoader;
