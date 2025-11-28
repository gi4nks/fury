"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { CategoryModeSelector, CategoryMode } from "@/components/CategoryModeSelector";
import { HierarchyEditor } from "@/components/HierarchyEditor";
import { KeywordEditor } from "@/components/KeywordEditor";
import { DiscoveryProgress } from "@/components/DiscoveryProgress";
import { DiscoveredCategory } from "@/lib/categoryDiscovery";

type ImportProgress = {
  processed: number;
  total: number;
  percent: number;
  currentBookmark: string;
  newBookmarks: number;
  updatedBookmarks: number;
  skipped: number;
  failed: number;
};

type ImportInit = {
  totalInFile: number;
  uniqueBookmarks: number;
  duplicatesInFile: number;
};

type ImportResult = {
  totalInFile: number;
  uniqueBookmarks: number;
  duplicatesInFile: number;
  newBookmarks: number;
  updatedBookmarks: number;
  successfulBookmarks: number;
  failedBookmarks: number;
  skippedBookmarks: number;
};

type ImportPhase = 
  | "idle" 
  | "mode-select" 
  | "discovering" 
  | "editing" 
  | "confirming"
  | "importing" 
  | "complete" 
  | "error";

type DiscoveryStage = "parsing" | "analyzing" | "building" | "complete";

interface AnalyzeResponse {
  success: boolean;
  error?: string;
  result?: {
    discoveryResult: {
      categories: DiscoveredCategory[];
      method: "gemini" | "clustering";
      reasoning: string;
      totalBookmarks: number;
    };
    validation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    stats: {
      totalCategories: number;
      maxDepth: number;
      categoriesPerLevel: number[];
      totalKeywords: number;
      totalEstimatedBookmarks: number;
    };
    bookmarkCount: number;
  };
}

export default function ImportPageClient() {
  // Core state
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("default");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  
  // Discovery state
  const [discoveryStage, setDiscoveryStage] = useState<DiscoveryStage>("parsing");
  const [discoveredCategories, setDiscoveredCategories] = useState<DiscoveredCategory[]>([]);
  const [discoveryMethod, setDiscoveryMethod] = useState<"gemini" | "clustering">("clustering");
  const [discoveryReasoning, setDiscoveryReasoning] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<DiscoveredCategory | null>(null);
  
  // Import state
  const [init, setInit] = useState<ImportInit | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [skippedUrls, setSkippedUrls] = useState<string[]>([]);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".html")) {
      setError("Only HTML bookmark exports are supported.");
      setPhase("error");
      return;
    }

    setSelectedFile(file);
    const content = await file.text();
    setFileContent(content);
    setPhase("mode-select");
    setError(null);
  };

  // Start discovery process
  const startDiscovery = async () => {
    if (!fileContent) return;
    
    setPhase("discovering");
    setDiscoveryStage("parsing");
    setStatusMessage("Parsing bookmarks...");

    try {
      setDiscoveryStage("analyzing");
      setStatusMessage("Analyzing content with AI...");

      const response = await fetch("/api/import/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarksHtml: fileContent })
      });

      const data: AnalyzeResponse = await response.json();

      if (!data.success || !data.result) {
        throw new Error(data.error || "Analysis failed");
      }

      setDiscoveryStage("building");
      setStatusMessage("Building category hierarchy...");

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setDiscoveredCategories(data.result.discoveryResult.categories);
      setDiscoveryMethod(data.result.discoveryResult.method);
      setDiscoveryReasoning(data.result.discoveryResult.reasoning);
      
      setDiscoveryStage("complete");
      setPhase("editing");
      setStatusMessage("");
    } catch (err) {
      console.error("Discovery failed:", err);
      setError((err as Error).message);
      setPhase("error");
    }
  };

  // Update keywords for a category
  const updateKeywords = useCallback((categoryId: string, keywords: string[]) => {
    const updateCat = (cats: DiscoveredCategory[]): DiscoveredCategory[] => {
      return cats.map(c => {
        if (c.id === categoryId) {
          const updated = { ...c, keywords };
          // Also update selected category if it's the same
          if (selectedCategory?.id === categoryId) {
            setSelectedCategory(updated);
          }
          return updated;
        }
        return { ...c, children: updateCat(c.children) };
      });
    };
    setDiscoveredCategories(updateCat(discoveredCategories));
  }, [discoveredCategories, selectedCategory]);

  // Proceed to import
  const proceedToImport = () => {
    if (categoryMode === "custom" && discoveredCategories.length === 0) {
      setError("No categories defined");
      return;
    }
    setPhase("confirming");
  };

  // Execute import
  const executeImport = async (useCustomCategories: boolean) => {
    if (!selectedFile) return;

    setPhase("importing");
    setStatusMessage("Starting import...");
    setInit(null);
    setProgress(null);
    setResult(null);
    setSkippedUrls([]);

    try {
      abortControllerRef.current = new AbortController();
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      if (useCustomCategories && discoveredCategories.length > 0) {
        formData.append("customCategories", JSON.stringify(discoveredCategories));
      }

      const response = await fetch("/api/import/stream", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to start import");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEvent(eventType, data);
            } catch {
              // Ignore parse errors
            }
            eventType = "";
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setError("Import cancelled.");
      } else {
        console.error("Import failed", err);
        setError((err as Error).message || "Import failed. Please try again.");
      }
      setPhase("error");
    }
  };

  function handleEvent(event: string, data: unknown) {
    switch (event) {
      case "status": {
        const statusData = data as { phase: string; message: string };
        setStatusMessage(statusData.message);
        break;
      }
      case "init": {
        const initData = data as ImportInit;
        setInit(initData);
        setStatusMessage(`Processing ${initData.uniqueBookmarks} bookmarks...`);
        break;
      }
      case "progress": {
        const progressData = data as ImportProgress;
        setProgress(progressData);
        break;
      }
      case "skipped": {
        const skippedData = data as { url: string; reason: string };
        setSkippedUrls(prev => [...prev.slice(-9), skippedData.url]);
        break;
      }
      case "complete": {
        const resultData = data as ImportResult;
        setResult(resultData);
        setPhase("complete");
        break;
      }
      case "error": {
        const errorData = data as { message: string };
        setError(errorData.message);
        setPhase("error");
        break;
      }
    }
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  function resetForm() {
    setPhase("idle");
    setCategoryMode("default");
    setSelectedFile(null);
    setFileContent("");
    setDiscoveredCategories([]);
    setSelectedCategory(null);
    setInit(null);
    setProgress(null);
    setResult(null);
    setError(null);
    setSkippedUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Calculate total categories count
  const getTotalCategoriesCount = (cats: DiscoveredCategory[]): number => {
    let count = 0;
    const countCats = (c: DiscoveredCategory[]) => {
      c.forEach(cat => {
        count++;
        countCats(cat.children);
      });
    };
    countCats(cats);
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <h1 className="text-2xl font-bold">Import Bookmarks</h1>
          <p className="text-base-content/70">
            Upload a Chrome, Firefox, or Safari exported HTML file to import your bookmarks.
            Choose between default categories or let AI discover a custom hierarchy tailored to your bookmarks.
          </p>

          {phase === "idle" && (
            <div className="flex flex-col gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html"
                className="file-input file-input-bordered w-full"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {(phase === "complete" || phase === "error") && (
            <button onClick={resetForm} className="btn btn-outline">
              Import Another File
            </button>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      {phase === "mode-select" && (
        <div className="space-y-6">
          <CategoryModeSelector
            mode={categoryMode}
            onChange={setCategoryMode}
          />

          <div className="flex gap-4">
            <button 
              className="btn btn-ghost"
              onClick={resetForm}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={() => {
                if (categoryMode === "custom") {
                  startDiscovery();
                } else {
                  // Use default categories - go straight to import
                  executeImport(false);
                }
              }}
            >
              {categoryMode === "custom" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyze &amp; Discover Categories
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import with Default Categories
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Discovery Progress */}
      {phase === "discovering" && (
        <DiscoveryProgress
          stage={discoveryStage}
          message={statusMessage}
        />
      )}

      {/* Category Editing */}
      {phase === "editing" && (
        <div className="space-y-6">
          {/* Discovery Info */}
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">
                Discovered {getTotalCategoriesCount(discoveredCategories)} categories using {discoveryMethod === "gemini" ? "Gemini AI" : "smart clustering"}
              </h3>
              <p className="text-sm">{discoveryReasoning}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hierarchy Editor */}
            <HierarchyEditor
              categories={discoveredCategories}
              onChange={setDiscoveredCategories}
              onSelectCategory={setSelectedCategory}
              selectedCategoryId={selectedCategory?.id || null}
            />

            {/* Keyword Editor */}
            <KeywordEditor
              category={selectedCategory}
              onUpdateKeywords={updateKeywords}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
              className="btn btn-ghost"
              onClick={() => setPhase("mode-select")}
            >
              Back
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={proceedToImport}
              disabled={discoveredCategories.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm Categories &amp; Import
            </button>
          </div>
        </div>
      )}

      {/* Confirmation */}
      {phase === "confirming" && (
        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-4">
            <h2 className="text-xl font-semibold">Confirm Import</h2>
            
            <div className="bg-base-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Import Summary</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>{getTotalCategoriesCount(discoveredCategories)}</strong> categories will be created</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>File: <strong>{selectedFile?.name}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Existing categories with same names will be merged</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button 
                className="btn btn-ghost"
                onClick={() => setPhase("editing")}
              >
                Back to Edit
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={() => executeImport(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress */}
      {phase === "importing" && (
        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Importing Bookmarks</h2>
              <button onClick={handleCancel} className="btn btn-ghost btn-sm text-error">
                Cancel
              </button>
            </div>

            <p className="text-base-content/70">{statusMessage}</p>

            {init && (
              <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                <div className="stat">
                  <div className="stat-title">Total in File</div>
                  <div className="stat-value text-primary">{init.totalInFile}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Unique URLs</div>
                  <div className="stat-value">{init.uniqueBookmarks}</div>
                </div>
                {init.duplicatesInFile > 0 && (
                  <div className="stat">
                    <div className="stat-title">Duplicates Removed</div>
                    <div className="stat-value text-warning">{init.duplicatesInFile}</div>
                  </div>
                )}
              </div>
            )}

            {progress && (
              <>
                <div className="w-full">
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Progress</span>
                    <span>{progress.processed} / {progress.total} ({progress.percent}%)</span>
                  </div>
                  <progress 
                    className="progress progress-primary w-full" 
                    value={progress.percent} 
                    max="100"
                  />
                </div>

                <div className="text-sm text-base-content/60 truncate">
                  Processing: {progress.currentBookmark}...
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-success">{progress.newBookmarks}</div>
                    <div className="text-xs text-base-content/70">New</div>
                  </div>
                  <div className="bg-info/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-info">{progress.updatedBookmarks}</div>
                    <div className="text-xs text-base-content/70">Updated</div>
                  </div>
                  <div className="bg-warning/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-warning">{progress.skipped}</div>
                    <div className="text-xs text-base-content/70">Skipped</div>
                  </div>
                  <div className="bg-error/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-error">{progress.failed}</div>
                    <div className="text-xs text-base-content/70">Failed</div>
                  </div>
                </div>

                {skippedUrls.length > 0 && (
                  <div className="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-sm font-medium">
                      Recently Skipped URLs ({skippedUrls.length})
                    </div>
                    <div className="collapse-content">
                      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {skippedUrls.map((url, i) => (
                          <li key={i} className="truncate text-base-content/60">{url}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}

            {!init && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Card */}
      {phase === "complete" && result && (
        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Import Complete!</h2>
            </div>

            <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
              <div className="stat">
                <div className="stat-figure text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="stat-title">New Bookmarks</div>
                <div className="stat-value text-success">{result.newBookmarks}</div>
                <div className="stat-desc">Added to collection</div>
              </div>
              
              <div className="stat">
                <div className="stat-figure text-info">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="stat-title">Updated</div>
                <div className="stat-value text-info">{result.updatedBookmarks}</div>
                <div className="stat-desc">Already existed</div>
              </div>
              
              <div className="stat">
                <div className="stat-figure text-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="stat-title">Skipped</div>
                <div className="stat-value text-warning">{result.skippedBookmarks}</div>
                <div className="stat-desc">Invalid URLs</div>
              </div>
            </div>

            <div className="bg-base-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Summary</h3>
              <ul className="text-sm space-y-1 text-base-content/70">
                <li>• Total bookmarks in file: <strong>{result.totalInFile}</strong></li>
                <li>• Unique URLs: <strong>{result.uniqueBookmarks}</strong></li>
                {result.duplicatesInFile > 0 && (
                  <li>• Duplicates in file: <strong>{result.duplicatesInFile}</strong></li>
                )}
                <li>• Successfully processed: <strong>{result.successfulBookmarks}</strong></li>
                {result.failedBookmarks > 0 && (
                  <li className="text-error">• Failed: <strong>{result.failedBookmarks}</strong></li>
                )}
                {categoryMode === "custom" && (
                  <li className="text-secondary">• Custom categories: <strong>{getTotalCategoriesCount(discoveredCategories)}</strong></li>
                )}
              </ul>
            </div>

            <div className="flex gap-2">
              <Link href="/bookmarks" className="btn btn-primary">
                View Bookmarks
              </Link>
              <Link href="/categories" className="btn btn-outline">
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {phase === "error" && error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={resetForm} className="btn btn-sm">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
