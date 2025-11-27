'use client';

import { useState } from 'react';

type ExportFormat = 'chrome' | 'firefox' | 'safari';

interface ExportButtonProps {
  categoryId?: string;
}

export default function ExportButton({ categoryId }: ExportButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setIsDropdownOpen(false);

    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (categoryId && categoryId !== 'all') {
        params.set('categoryId', categoryId);
      }

      const response = await fetch(`/api/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'bookmarks_export';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      id: 'chrome' as ExportFormat,
      name: 'Chrome',
      description: 'JSON format',
      icon: '🌐'
    },
    {
      id: 'firefox' as ExportFormat,
      name: 'Firefox',
      description: 'HTML format',
      icon: '🦊'
    },
    {
      id: 'safari' as ExportFormat,
      name: 'Safari',
      description: 'HTML format',
      icon: '🧭'
    }
  ];

  return (
    <div className="dropdown dropdown-end">
      <button
        className={`btn btn-primary ${isExporting ? 'loading' : ''}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isExporting}
      >
        {!isExporting && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        )}
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isDropdownOpen && (
        <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
          <li className="menu-title">
            <span>Export Format</span>
          </li>
          {formatOptions.map((format) => (
            <li key={format.id}>
              <button
                onClick={() => handleExport(format.id)}
                className="flex items-center gap-2"
              >
                <span className="text-lg">{format.icon}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{format.name}</span>
                  <span className="text-xs opacity-70">{format.description}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}