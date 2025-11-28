/**
 * HierarchyEditor Component
 * 
 * Interactive tree editor for category hierarchies.
 * Supports drag-drop, edit, delete, and reorganization.
 */

"use client";

import React, { useState } from 'react';
import { DiscoveredCategory } from '@/lib/categoryDiscovery';

interface HierarchyEditorProps {
  categories: DiscoveredCategory[];
  onChange: (categories: DiscoveredCategory[]) => void;
  onSelectCategory: (category: DiscoveredCategory | null) => void;
  selectedCategoryId: string | null;
  disabled?: boolean;
}

export function HierarchyEditor({
  categories,
  onChange,
  onSelectCategory,
  selectedCategoryId,
  disabled
}: HierarchyEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (cats: DiscoveredCategory[]) => {
      cats.forEach(c => {
        allIds.add(c.id);
        collectIds(c.children);
      });
    };
    collectIds(categories);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const startEdit = (category: DiscoveredCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const saveEdit = (category: DiscoveredCategory) => {
    if (editName.trim()) {
      const updateCategory = (cats: DiscoveredCategory[]): DiscoveredCategory[] => {
        return cats.map(c => {
          if (c.id === category.id) {
            return {
              ...c,
              name: editName.trim(),
              slug: editName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
            };
          }
          return { ...c, children: updateCategory(c.children) };
        });
      };
      onChange(updateCategory(categories));
    }
    setEditingId(null);
  };

  const deleteCategory = (categoryId: string) => {
    const removeCategory = (cats: DiscoveredCategory[]): DiscoveredCategory[] => {
      return cats
        .filter(c => c.id !== categoryId)
        .map(c => ({ ...c, children: removeCategory(c.children) }));
    };
    onChange(removeCategory(categories));
    if (selectedCategoryId === categoryId) {
      onSelectCategory(null);
    }
  };

  const addSubcategory = (parentId: string) => {
    const newCategory: DiscoveredCategory = {
      id: `new_${Date.now()}`,
      name: 'New Category',
      slug: 'new-category',
      description: '',
      keywords: [],
      parentId,
      estimatedCount: 0,
      level: 0,
      children: []
    };

    const addToParent = (cats: DiscoveredCategory[]): DiscoveredCategory[] => {
      return cats.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            children: [...c.children, { ...newCategory, level: c.level + 1, parentName: c.name }]
          };
        }
        return { ...c, children: addToParent(c.children) };
      });
    };
    
    onChange(addToParent(categories));
    setExpandedIds(new Set([...expandedIds, parentId]));
    startEdit(newCategory);
  };

  const addRootCategory = () => {
    const newCategory: DiscoveredCategory = {
      id: `new_${Date.now()}`,
      name: 'New Category',
      slug: 'new-category',
      description: '',
      keywords: [],
      estimatedCount: 0,
      level: 0,
      children: []
    };
    onChange([...categories, newCategory]);
    startEdit(newCategory);
  };

  const getTotalCount = (): number => {
    let total = 0;
    const count = (cats: DiscoveredCategory[]) => {
      cats.forEach(c => {
        total++;
        count(c.children);
      });
    };
    count(categories);
    return total;
  };

  const renderCategory = (category: DiscoveredCategory, depth: number = 0) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const isEditing = editingId === category.id;
    const canAddChild = depth < 3; // Max 4 levels (0-3)

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
            isSelected 
              ? 'bg-primary/20 border border-primary' 
              : 'hover:bg-base-200'
          } ${disabled ? 'opacity-50' : ''}`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            className={`btn btn-xs btn-ghost btn-square ${!hasChildren ? 'invisible' : ''}`}
            onClick={() => toggleExpand(category.id)}
            disabled={disabled}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Folder Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-base-content/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>

          {/* Category Name */}
          {isEditing ? (
            <input
              type="text"
              className="input input-sm input-bordered flex-1"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => saveEdit(category)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(category);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              disabled={disabled}
            />
          ) : (
            <span 
              className="flex-1 cursor-pointer truncate"
              onClick={() => !disabled && onSelectCategory(isSelected ? null : category)}
              onDoubleClick={() => !disabled && startEdit(category)}
            >
              {category.name}
            </span>
          )}

          {/* Bookmark Count Badge */}
          <span className="badge badge-sm badge-ghost">
            {category.estimatedCount}
          </span>

          {/* Action Buttons */}
          {!disabled && !isEditing && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
              <button
                className="btn btn-xs btn-ghost btn-square"
                onClick={() => startEdit(category)}
                title="Edit name"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              {canAddChild && (
                <button
                  className="btn btn-xs btn-ghost btn-square"
                  onClick={() => addSubcategory(category.id)}
                  title="Add subcategory"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                className="btn btn-xs btn-ghost btn-square text-error"
                onClick={() => deleteCategory(category.id)}
                title="Delete category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Category Hierarchy
            <span className="badge badge-primary">{getTotalCount()}</span>
          </h3>
          <div className="flex gap-2">
            <button 
              className="btn btn-xs btn-ghost"
              onClick={expandAll}
              disabled={disabled}
            >
              Expand All
            </button>
            <button 
              className="btn btn-xs btn-ghost"
              onClick={collapseAll}
              disabled={disabled}
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree */}
        <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
          {categories.length === 0 ? (
            <div className="text-center text-base-content/50 py-8">
              No categories discovered yet
            </div>
          ) : (
            categories.map(category => renderCategory(category, 0))
          )}
        </div>

        {/* Add Root Category Button */}
        {!disabled && (
          <div className="mt-4 pt-4 border-t border-base-300">
            <button 
              className="btn btn-sm btn-outline btn-primary w-full"
              onClick={addRootCategory}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Root Category
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-2 text-xs text-base-content/50">
          <p>• Double-click to edit name • Click to select • Max 4 levels deep</p>
        </div>
      </div>
    </div>
  );
}
