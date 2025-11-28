/**
 * DiscoveryProgress Component
 * 
 * Shows progress during category discovery analysis.
 */

"use client";

import React from 'react';

interface DiscoveryProgressProps {
  stage: 'parsing' | 'analyzing' | 'building' | 'complete';
  progress?: number;
  message?: string;
}

export function DiscoveryProgress({ stage, progress, message }: DiscoveryProgressProps) {
  const stages = [
    { id: 'parsing', label: 'Parsing Bookmarks', icon: '📄' },
    { id: 'analyzing', label: 'Analyzing Content', icon: '🔍' },
    { id: 'building', label: 'Building Hierarchy', icon: '🏗️' },
    { id: 'complete', label: 'Complete', icon: '✅' }
  ];

  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h3 className="card-title text-lg">
          <span className="loading loading-spinner loading-sm"></span>
          Discovering Categories...
        </h3>

        {/* Progress Steps */}
        <ul className="steps steps-vertical mt-4">
          {stages.map((s, index) => (
            <li 
              key={s.id}
              className={`step ${index <= currentIndex ? 'step-primary' : ''}`}
              data-content={index < currentIndex ? '✓' : s.icon}
            >
              <div className="text-left">
                <div className={`font-medium ${s.id === stage ? 'text-primary' : ''}`}>
                  {s.label}
                </div>
                {s.id === stage && message && (
                  <div className="text-sm text-base-content/70">{message}</div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <progress 
              className="progress progress-primary w-full" 
              value={progress} 
              max="100"
            ></progress>
            <div className="text-sm text-center mt-1 text-base-content/70">
              {progress}% complete
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-base-content/50 text-center">
          Using {process.env.NEXT_PUBLIC_GEMINI_ENABLED ? 'Gemini AI' : 'smart clustering'} for analysis
        </div>
      </div>
    </div>
  );
}
