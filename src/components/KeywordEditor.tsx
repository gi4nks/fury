/**
 * KeywordEditor Component
 * 
 * Edit keywords for a selected category.
 */

"use client";

import React, { useState } from 'react';
import { DiscoveredCategory } from '@/lib/categoryDiscovery';

interface KeywordEditorProps {
  category: DiscoveredCategory | null;
  onUpdateKeywords: (categoryId: string, keywords: string[]) => void;
  disabled?: boolean;
}

export function KeywordEditor({ category, onUpdateKeywords, disabled }: KeywordEditorProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!category) {
    return (
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Keywords
          </h3>
          <div className="text-center text-base-content/50 py-8">
            Select a category to edit its keywords
          </div>
        </div>
      </div>
    );
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !category.keywords.includes(newKeyword.trim().toLowerCase())) {
      onUpdateKeywords(category.id, [...category.keywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onUpdateKeywords(category.id, category.keywords.filter(k => k !== keyword));
  };

  const generateSuggestions = async () => {
    setIsGenerating(true);
    // This would call an API to generate keyword suggestions
    // For now, we'll simulate it with common related words
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const suggestions = generateLocalSuggestions(category.name);
    const newKeywords = [...new Set([...category.keywords, ...suggestions])];
    onUpdateKeywords(category.id, newKeywords);
    setIsGenerating(false);
  };

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Keywords for &quot;{category.name}&quot;
          </h3>
          <span className="badge badge-primary">{category.keywords.length}</span>
        </div>

        {/* Current Keywords */}
        <div className="flex flex-wrap gap-2 mt-4 min-h-16">
          {category.keywords.length === 0 ? (
            <span className="text-base-content/50 text-sm">No keywords defined</span>
          ) : (
            category.keywords.map((keyword, index) => (
              <span 
                key={index} 
                className="badge badge-lg gap-2 cursor-pointer hover:badge-error transition-colors"
                onClick={() => !disabled && removeKeyword(keyword)}
                title="Click to remove"
              >
                {keyword}
                {!disabled && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
            ))
          )}
        </div>

        {/* Add Keyword Input */}
        {!disabled && (
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Add a keyword..."
              className="input input-bordered flex-1"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            />
            <button 
              className="btn btn-primary"
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
            >
              Add
            </button>
          </div>
        )}

        {/* Generate Suggestions Button */}
        {!disabled && (
          <button
            className={`btn btn-outline btn-secondary mt-4 ${isGenerating ? 'loading' : ''}`}
            onClick={generateSuggestions}
            disabled={isGenerating}
          >
            {isGenerating ? (
              'Generating...'
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Suggestions
              </>
            )}
          </button>
        )}

        {/* Help Text */}
        <div className="mt-4 text-xs text-base-content/50">
          <p>Keywords help match bookmarks to this category. Click a keyword to remove it.</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate local keyword suggestions
function generateLocalSuggestions(categoryName: string): string[] {
  const name = categoryName.toLowerCase();
  const suggestions: string[] = [];

  // Add the category name itself as keywords
  const words = name.split(/[\s-]+/).filter(w => w.length > 2);
  suggestions.push(...words);

  // Add common related terms based on category patterns
  const relatedTerms: Record<string, string[]> = {
    'development': ['code', 'programming', 'software', 'developer', 'engineering', 'coding'],
    'design': ['ui', 'ux', 'creative', 'visual', 'graphic', 'interface'],
    'business': ['company', 'enterprise', 'corporate', 'startup', 'management'],
    'learning': ['tutorial', 'course', 'education', 'training', 'guide'],
    'news': ['article', 'blog', 'update', 'announcement', 'press'],
    'video': ['youtube', 'streaming', 'watch', 'media', 'content'],
    'music': ['spotify', 'audio', 'song', 'playlist', 'artist'],
    'social': ['community', 'network', 'forum', 'discussion', 'chat'],
    'shopping': ['buy', 'store', 'product', 'ecommerce', 'deal'],
    'productivity': ['tool', 'app', 'workflow', 'efficiency', 'organize'],
    'cloud': ['aws', 'azure', 'hosting', 'server', 'infrastructure'],
    'research': ['paper', 'study', 'academic', 'science', 'journal'],
    'finance': ['money', 'investment', 'banking', 'trading', 'budget'],
    'health': ['medical', 'wellness', 'fitness', 'healthcare', 'doctor'],
    'travel': ['trip', 'vacation', 'booking', 'hotel', 'flight'],
    'food': ['recipe', 'cooking', 'restaurant', 'meal', 'cuisine'],
    'gaming': ['game', 'play', 'esports', 'console', 'steam'],
    'reference': ['wiki', 'documentation', 'docs', 'manual', 'guide']
  };

  // Find matching categories and add their terms
  for (const [key, terms] of Object.entries(relatedTerms)) {
    if (name.includes(key) || key.includes(name.split(' ')[0])) {
      suggestions.push(...terms);
    }
  }

  // Deduplicate and limit
  return [...new Set(suggestions)].slice(0, 10);
}
