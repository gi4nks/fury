/**
 * CategoryModeSelector Component
 * 
 * Allows users to choose between default and custom category discovery.
 */

"use client";

import React from 'react';

export type CategoryMode = 'default' | 'custom';

interface CategoryModeSelectorProps {
  mode: CategoryMode;
  onChange: (mode: CategoryMode) => void;
  disabled?: boolean;
}

export function CategoryModeSelector({ mode, onChange, disabled }: CategoryModeSelectorProps) {
  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h3 className="card-title text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Category Mode
        </h3>
        
        <div className="flex flex-col gap-4 mt-2">
          {/* Default Categories Option */}
          <label 
            className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              mode === 'default' 
                ? 'border-primary bg-primary/10' 
                : 'border-base-300 hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="categoryMode"
              className="radio radio-primary mt-1"
              checked={mode === 'default'}
              onChange={() => onChange('default')}
              disabled={disabled}
            />
            <div className="flex-1">
              <div className="font-semibold">Use Default Categories</div>
              <p className="text-sm text-base-content/70 mt-1">
                Use Fury&apos;s 23 predefined categories (Technology, Development, Design, etc.). 
                Fast and reliable categorization based on proven keyword matching.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge badge-outline badge-sm">Development</span>
                <span className="badge badge-outline badge-sm">Design</span>
                <span className="badge badge-outline badge-sm">Business</span>
                <span className="badge badge-outline badge-sm">+20 more</span>
              </div>
            </div>
          </label>

          {/* Custom Discovery Option */}
          <label 
            className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              mode === 'custom' 
                ? 'border-secondary bg-secondary/10' 
                : 'border-base-300 hover:border-secondary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="categoryMode"
              className="radio radio-secondary mt-1"
              checked={mode === 'custom'}
              onChange={() => onChange('custom')}
              disabled={disabled}
            />
            <div className="flex-1">
              <div className="font-semibold flex items-center gap-2">
                Discover Custom Categories
                <span className="badge badge-secondary badge-sm">AI-Powered</span>
              </div>
              <p className="text-sm text-base-content/70 mt-1">
                Let Fury analyze your bookmarks and suggest a personalized category hierarchy 
                based on your actual content. You can customize the suggestions before importing.
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Powered by Gemini AI (with fallback to smart clustering)
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
