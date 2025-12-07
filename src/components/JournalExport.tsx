import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useJournal } from "@/hooks/useJournal";
import { format } from "date-fns";
import Spinner from './ui/spinner';

interface JournalEntry {
  id: string;
  title?: string;
  content?: string;
  createdAt: string;
  persona_id?: string;
  feedback?: string;
}

interface JournalExportProps {
  className?: string;
}

export default function JournalExport({ className }: JournalExportProps) {
  const { entries } = useJournal();
  const [exportFormat, setExportFormat] = useState<'markdown' | 'text'>('markdown');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);

  const formatEntryAsMarkdown = (entry: JournalEntry) => {
    const date = format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm:ss');
    const title = entry.title || 'Untitled Entry';
    
    return `# ${title}

**Date:** ${date}
**ID:** ${entry.id}
${entry.persona_id ? `**Persona:** ${entry.persona_id}` : ''}

---

${entry.content || 'No content'}

${entry.feedback ? `

## AI Feedback

${entry.feedback}
` : ''}

---

`;
  };

  const formatEntryAsText = (entry: JournalEntry) => {
    const date = format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm:ss');
    const title = entry.title || 'Untitled Entry';
    
    return `${title}
${'='.repeat(title.length)}

Date: ${date}
ID: ${entry.id}
${entry.persona_id ? `Persona: ${entry.persona_id}` : ''}

${'-'.repeat(50)}

${entry.content || 'No content'}

${entry.feedback ? `

AI Feedback:
${'-'.repeat(20)}
${entry.feedback}
` : ''}

${'='.repeat(80)}

`;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!entries || entries.length === 0) {
      setExportStatus('error');
      setExportError('No journal entries found to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('idle');
    setExportError(null);

    try {
      // Sort entries by date (oldest first)
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      let exportContent = '';
      let fileExtension = '';
      let mimeType = '';

      if (exportFormat === 'markdown') {
        exportContent = `# OPAL Forge Journal Export

**Export Date:** ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
**Total Entries:** ${sortedEntries.length}

---

`;
        sortedEntries.forEach(entry => {
          exportContent += formatEntryAsMarkdown(entry);
        });
        fileExtension = 'md';
        mimeType = 'text/markdown';
      } else {
        exportContent = `OPAL Forge Journal Export
${'='.repeat(50)}

Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
Total Entries: ${sortedEntries.length}

${'='.repeat(80)}

`;
        sortedEntries.forEach(entry => {
          exportContent += formatEntryAsText(entry);
        });
        fileExtension = 'txt';
        mimeType = 'text/plain';
      }

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `opal-forge-journal-export_${timestamp}.${fileExtension}`;

      // Download the file
      downloadFile(exportContent, filename, mimeType);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setExportError(error instanceof Error ? error.message : 'Failed to export journal entries');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingle = async () => {
    if (!entries || entries.length === 0) {
      setExportStatus('error');
      setExportError('No journal entries found to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('idle');
    setExportError(null);

    try {
      // Sort entries by date (oldest first)
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const fileExtension = exportFormat === 'markdown' ? 'md' : 'txt';
      const mimeType = exportFormat === 'markdown' ? 'text/markdown' : 'text/plain';

      // Export each entry as a separate file
      sortedEntries.forEach((entry, index) => {
        const entryDate = format(new Date(entry.createdAt), 'yyyy-MM-dd_HH-mm-ss');
        const entryTitle = (entry.title || 'Untitled').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const filename = `${index + 1}_${entryDate}_${entryTitle}.${fileExtension}`;
        
        const content = exportFormat === 'markdown' 
          ? formatEntryAsMarkdown(entry)
          : formatEntryAsText(entry);
        
        // Small delay to prevent browser blocking multiple downloads
        setTimeout(() => {
          downloadFile(content, filename, mimeType);
        }, index * 100);
      });

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setExportError(error instanceof Error ? error.message : 'Failed to export journal entries');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Journal Export
        </CardTitle>
        <CardDescription>
          Export all your journal entries for backup and safekeeping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entry Count */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Total Entries:</span>
          <Badge variant="outline">
            {entries ? entries.length : 0} entries
          </Badge>
        </div>

        {/* Export Format Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Export Format</label>
          <Select value={exportFormat} onValueChange={(value: 'markdown' | 'text') => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Markdown (.md) - Formatted with headers
                </div>
              </SelectItem>
              <SelectItem value="text">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Plain Text (.txt) - Simple format
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Messages */}
        {exportStatus === 'success' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Journal entries exported successfully! Check your downloads folder.
            </AlertDescription>
          </Alert>
        )}

        {exportStatus === 'error' && exportError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}

        {/* Export Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !entries || entries.length === 0}
            className="flex-1"
          >
            {isExporting ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export All (Single File)'}
          </Button>

          <Button 
            onClick={handleExportSingle} 
            disabled={isExporting || !entries || entries.length === 0}
            variant="outline"
            className="flex-1"
          >
            {isExporting ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export Separate Files'}
          </Button>
        </div>

        {(!entries || entries.length === 0) && (
          <div className="text-sm text-gray-500 text-center">
            No journal entries available to export. Create some entries first!
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <strong>Export Options:</strong>
          <br />
          • <strong>Single File:</strong> All entries in one file with timestamps
          <br />
          • <strong>Separate Files:</strong> Each entry as individual file (good for large journals)
          <br />
          • Includes entry content, dates, AI feedback, and metadata
        </div>
      </CardContent>
    </Card>
  );
}
