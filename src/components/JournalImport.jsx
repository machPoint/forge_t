import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useJournal } from '@/hooks/useJournal';

/**
 * Parse a markdown export file from the old web-based Forge program
 * Format:
 * # Title
 * **Date:** YYYY-MM-DD HH:MM:SS
 * **ID:** number
 * ---
 * <content in HTML>
 * 
 * ## AI Feedback (optional)
 * <feedback content>
 * ---
 */
function parseMarkdownExport(content) {
  const entries = [];
  
  // Split by entry separator (--- followed by # Title)
  const entryBlocks = content.split(/\n---\n\n(?=# )/);
  
  for (const block of entryBlocks) {
    // Skip the header block (export metadata)
    if (block.startsWith('# OPAL Forge Journal Export')) {
      continue;
    }
    
    // Extract title (# Title)
    const titleMatch = block.match(/^# (.+)$/m);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    
    // Extract date (**Date:** YYYY-MM-DD HH:MM:SS)
    const dateMatch = block.match(/\*\*Date:\*\* (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    if (!dateMatch) continue;
    const dateStr = dateMatch[1];
    
    // Parse the date string to ISO format
    const [datePart, timePart] = dateStr.split(' ');
    const createdAt = new Date(`${datePart}T${timePart}`).toISOString();
    
    // Extract original ID (for reference, won't be used in new system)
    const idMatch = block.match(/\*\*ID:\*\* (\d+)/);
    const originalId = idMatch ? parseInt(idMatch[1]) : null;
    
    // Extract content - everything between the first --- and either ## AI Feedback or the end
    const contentStartMatch = block.match(/\*\*ID:\*\* \d+\n\n\n---\n\n/);
    if (!contentStartMatch) continue;
    
    const contentStartIndex = block.indexOf(contentStartMatch[0]) + contentStartMatch[0].length;
    
    // Find where content ends (either at ## AI Feedback or at the next ---)
    let contentEndIndex = block.length;
    const aiFeedbackIndex = block.indexOf('\n\n## AI Feedback');
    const nextSeparatorIndex = block.indexOf('\n\n\n---', contentStartIndex);
    
    if (aiFeedbackIndex !== -1 && aiFeedbackIndex > contentStartIndex) {
      contentEndIndex = aiFeedbackIndex;
    } else if (nextSeparatorIndex !== -1 && nextSeparatorIndex > contentStartIndex) {
      contentEndIndex = nextSeparatorIndex;
    }
    
    const content = block.substring(contentStartIndex, contentEndIndex).trim();
    
    // Skip empty entries
    if (!content) continue;
    
    // Extract AI Feedback if present
    let aiFeedback = null;
    if (aiFeedbackIndex !== -1) {
      const feedbackStartIndex = aiFeedbackIndex + '\n\n## AI Feedback\n\n'.length;
      const feedbackEndIndex = block.indexOf('\n\n\n---', feedbackStartIndex);
      if (feedbackEndIndex !== -1) {
        aiFeedback = block.substring(feedbackStartIndex, feedbackEndIndex).trim();
      } else {
        aiFeedback = block.substring(feedbackStartIndex).trim();
      }
    }
    
    entries.push({
      title,
      content,
      createdAt,
      originalId,
      aiFeedback,
      tags: [], // No tags in the export format
      moduleId: null,
      moduleStep: null
    });
  }
  
  return entries;
}

export default function JournalImport({ className }) {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  
  const { createEntry } = useJournal();

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setResults(null);
    setParsedEntries([]);
    
    try {
      const content = await file.text();
      const entries = parseMarkdownExport(content);
      
      if (entries.length === 0) {
        setError('No valid journal entries found in the file. Make sure it\'s an export from the web-based Forge program.');
        return;
      }
      
      setParsedEntries(entries);
      setPreviewMode(true);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Failed to parse the file: ' + err.message);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (parsedEntries.length === 0) return;
    
    setImporting(true);
    setProgress(0);
    setError(null);
    
    const results = {
      total: parsedEntries.length,
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < parsedEntries.length; i++) {
      const entry = parsedEntries[i];
      
      try {
        // Create the entry with the original date
        await createEntry({
          title: entry.title,
          content: entry.content,
          tags: entry.tags,
          moduleId: entry.moduleId,
          moduleStep: entry.moduleStep,
          // Pass the original created date - the backend should respect this
          createdAt: entry.createdAt
        });
        
        results.success++;
      } catch (err) {
        console.error(`Failed to import entry "${entry.title}":`, err);
        results.failed++;
        results.errors.push({
          title: entry.title,
          error: err.message
        });
      }
      
      setProgress(Math.round(((i + 1) / parsedEntries.length) * 100));
    }
    
    setResults(results);
    setImporting(false);
    setPreviewMode(false);
    setParsedEntries([]);
  };

  const handleCancel = () => {
    setPreviewMode(false);
    setParsedEntries([]);
    setError(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Journal Entries
        </CardTitle>
        <CardDescription>
          Import journal entries from the web-based Forge program (.md export files)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        {!previewMode && !importing && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Select Export File (.md)
            </Button>
            <p className="text-xs text-muted-foreground">
              Select a markdown export file from the old web-based Forge program. 
              The original dates will be preserved.
            </p>
          </div>
        )}

        {/* Preview Mode */}
        {previewMode && !importing && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Found <strong>{parsedEntries.length}</strong> journal entries to import.
              </AlertDescription>
            </Alert>
            
            {/* Preview list */}
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
              {parsedEntries.slice(0, 10).map((entry, index) => (
                <div key={index} className="text-sm border-b pb-2 last:border-b-0">
                  <div className="font-medium">{entry.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()} - 
                    {entry.content.length > 100 
                      ? ` ${entry.content.substring(0, 100).replace(/<[^>]*>/g, '')}...` 
                      : ` ${entry.content.replace(/<[^>]*>/g, '')}`}
                  </div>
                </div>
              ))}
              {parsedEntries.length > 10 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... and {parsedEntries.length - 10} more entries
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleImport} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Import {parsedEntries.length} Entries
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {importing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Importing entries...</span>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-2">
            {results.success > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported <strong>{results.success}</strong> of {results.total} entries.
                </AlertDescription>
              </Alert>
            )}
            
            {results.failed > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to import {results.failed} entries.
                  {results.errors.length > 0 && (
                    <ul className="mt-2 text-xs">
                      {results.errors.slice(0, 3).map((err, i) => (
                        <li key={i}>• {err.title}: {err.error}</li>
                      ))}
                      {results.errors.length > 3 && (
                        <li>... and {results.errors.length - 3} more errors</li>
                      )}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={() => setResults(null)} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Import More
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
