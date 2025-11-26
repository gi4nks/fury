"use client";

import { FormEvent, useState } from "react";

type ImportResult = {
  totalBookmarks: number;
  successfulBookmarks: number;
  failedBookmarks: number;
};

export default function ImportPageClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setError("Please select a valid HTML file.");
      setLoading(false);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".html")) {
      setError("Only Chrome HTML bookmark exports are supported.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const body = await response.json();

      if (!response.ok) {
        setError(body?.message ?? "Import failed.");
      } else {
        setResult({
          totalBookmarks: body.totalBookmarks,
          successfulBookmarks: body.successfulBookmarks,
          failedBookmarks: body.failedBookmarks,
        });
      }
    } catch (fetchError) {
      console.error("Import failed", fetchError);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <h1 className="text-2xl font-bold">Import bookmarks</h1>
          <p className="text-base-content/70">
            Upload a Chrome-exported HTML file to populate Fury. The server will
            parse links, categorize them, and keep track of the import.
          </p>

          <form
            onSubmit={handleImport}
            className="flex flex-col gap-4"
            encType="multipart/form-data"
          >
            <input
              type="file"
              name="file"
              accept=".html"
              className="file-input file-input-bordered w-full"
            />
            <button
              type="submit"
              className={`btn btn-primary ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Importing..." : "Upload file"}
            </button>
          </form>
        </div>
      </div>

      {result && (
        <div className="alert alert-success shadow-lg">
          <div className="flex-1">
            <h3 className="font-semibold">Import summary</h3>
            <p>
              {result.successfulBookmarks} of {result.totalBookmarks} bookmarks
              registered
              {result.failedBookmarks
                ? `, ${result.failedBookmarks} failed`
                : ""}.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error shadow-lg">
          <div className="flex-1">
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
