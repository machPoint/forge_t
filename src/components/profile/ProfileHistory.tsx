import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomPagination from "./CustomPagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IdentityProfile } from "@/pages/ProfilePage";
import { Loader2, ArrowLeftRight, RotateCcw, Eye } from "lucide-react";
import opal from "@/lib/simple-opal-client";

// Create a logger for the ProfileHistory component
const logger = {
  debug: (message: string, data?: unknown) => {
    console.debug(`[ProfileHistory] ${message}`, data || '');
  },
  info: (message: string, data?: unknown) => {
    console.info(`[ProfileHistory] ${message}`, data || '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[ProfileHistory] ${message}`, data || '');
  },
  error: (message: string, data?: unknown) => {
    console.error(`[ProfileHistory] ${message}`, data || '');
  }
};

interface ProfileHistoryEntry {
  id: number;
  section_changed: string;
  change_description: string | null;
  created_at: string;
}

interface ProfileHistoryProps {
  onRestoreVersion: (profile: IdentityProfile) => void;
}

const ProfileHistory: React.FC<ProfileHistoryProps> = ({ onRestoreVersion }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ProfileHistoryEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [versionDetails, setVersionDetails] = useState<IdentityProfile | null>(null);
  // Define simpler types for comparison changes
  interface ChangeItem {
    from: unknown;
    to: unknown;
  }

  interface NestedChanges {
    [key: string]: ChangeItem;
  }

  interface ChangeSection {
    [key: string]: ChangeItem | NestedChanges;
  }

  interface ComparisonResult {
    historyId1: number;
    historyId2: number;
    date1: string;
    date2: string;
    changes: {
      biographical: ChangeSection;
      personality_profile: ChangeSection;
      meta: ChangeSection;
    };
  };

  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Format section name for display
  const formatSectionName = (section: string) => {
    switch (section) {
      case "biographical":
        return "Biographical";
      case "personality_profile":
        return "Personality Profile";
      case "meta":
        return "Meta Information";
      case "all":
        return "Full Profile";
      default:
        return section;
    }
  };

  // Load history entries
  useEffect(() => {
    const fetchHistory = async () => {
      logger.info(`Fetching profile history for page ${page}, pageSize ${pageSize}`);
      try {
        setLoading(true);
        const offset = (page - 1) * pageSize;
        logger.debug(`Calling getProfileVersionHistory with params:`, { limit: pageSize, offset });
        
        logger.info(`Calling getProfileVersionHistory with params:`, { limit: pageSize, offset });
        const result = await opal.callTool("getProfileVersionHistory", {
          limit: pageSize,
          offset,
        });
        
        // Log the complete raw response
        logger.info(`Received history result type:`, typeof result);
        logger.info(`Received history result keys:`, result ? Object.keys(result).join(', ') : 'undefined');
        logger.debug(`Raw history result:`, result);

        // Add specific checks for common issues
        if (!result) {
          logger.error('Critical: History result is null or undefined');
          setError('Failed to load history data - empty response');
          setHistory([]);
          setTotalEntries(0);
          return;
        }
        
        // Check for error response
        if (result.error === true) {
          logger.error('Error from history API:', result.message || 'Unknown error');
          setError(result.message || 'Error loading history data');
          setHistory([]);
          setTotalEntries(0);
          return;
        }
        
        // Parse the history data from the content array if present
        let historyData;
        try {
          // Check if the result has the content array structure (typical OPAL response)
          if (result.content && Array.isArray(result.content) && result.content.length > 0 && result.content[0].text) {
            // Parse the JSON string from content[0].text
            logger.info('[ProfileHistory] Found content array with text, attempting to parse');
            historyData = JSON.parse(result.content[0].text);
            logger.info('[ProfileHistory] Successfully parsed history data from content:', historyData);
          } else {
            // If not in the content array, use the result as is
            logger.info('[ProfileHistory] No content array found, using result directly');
            historyData = result;
          }
        } catch (parseError) {
          logger.error('[ProfileHistory] Error parsing history data from content:', parseError);
          setError('Error parsing history data. Please try again.');
          setHistory([]);
          setTotalEntries(0);
          setLoading(false);
          return;
        }
        
        // More specific checks for history property after parsing
        if (!historyData.history) {
          logger.error('Critical: Parsed history data missing "history" property');
          logger.debug('Available keys in parsed data:', Object.keys(historyData).join(', '));
          setError('History data format error - missing history entries');
          setHistory([]);
          setTotalEntries(0);
          return;
        }

        // Check history array type
        if (!Array.isArray(historyData.history)) {
          logger.error('Critical: History is not an array - actual type:', typeof historyData.history);
          setError('History data format error - expected array');
          setHistory([]);
          setTotalEntries(0);
          return;
        }

        // Success path
        logger.info(`Successfully fetched ${historyData.history.length} history entries out of ${historyData.total || 'unknown'} total`);
        
        // Log first entry for debugging
        if (historyData.history.length > 0) {
          logger.debug('First history entry sample:', historyData.history[0]);
          logger.debug(`Sample history entry structure:`, {
            keys: Object.keys(historyData.history[0]),
            firstEntry: historyData.history[0]
          });
        } else {
          logger.info('History array is empty (zero entries)');
        }
        
        // Set state with the history data
        setHistory(historyData.history);
        setTotalEntries(historyData.total || 0);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        const errorStack = err instanceof Error ? err.stack : undefined;
        logger.error(`Error fetching profile history:`, err);
        logger.error(`Error details: ${errorMessage}`);
        if (errorStack) logger.error(`Stack trace: ${errorStack}`);
        setHistory([]);
        setError("Failed to load profile history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, pageSize]);

  // Handle viewing a specific version
  const handleViewVersion = async (historyId: number) => {
    logger.info(`Viewing profile version with historyId: ${historyId}`);
    try {
      setLoading(true);
      setSelectedVersion(historyId);
      
      logger.debug(`Calling getProfileVersion with params:`, { historyId });
      const result = await opal.callTool("getProfileVersion", { historyId });
      logger.debug(`Received profile version result:`, result);
      
      if (result && result.profile) {
        logger.info(`Successfully loaded profile version ${historyId}`);
        logger.debug(`Profile version structure:`, {
          keys: Object.keys(result.profile),
          biographical: result.profile.biographical ? Object.keys(result.profile.biographical) : 'missing',
          personality_profile: result.profile.personality_profile ? Object.keys(result.profile.personality_profile) : 'missing',
          meta: result.profile.meta ? Object.keys(result.profile.meta) : 'missing'
        });
        
        setVersionDetails(result.profile);
        setViewDialogOpen(true);
      } else {
        logger.warn(`Failed to load profile version details, result:`, result);
        setError("Failed to load profile version details.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorStack = err instanceof Error ? err.stack : undefined;
      logger.error(`Error fetching profile version:`, err);
      logger.error(`Error details: ${errorMessage}`);
      if (errorStack) logger.error(`Stack trace: ${errorStack}`);
      setError("Failed to load profile version. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle comparing two versions
  const handleCompareVersions = async () => {
    logger.info(`Comparing profile versions: ${selectedVersion} and ${compareVersion}`);
    
    if (!selectedVersion || !compareVersion) {
      logger.warn(`Cannot compare versions: missing selectedVersion or compareVersion`);
      setError("Please select two versions to compare.");
      return;
    }

    try {
      setLoading(true);
      const params = {
        historyId1: selectedVersion,
        historyId2: compareVersion,
      };
      logger.debug(`Calling compareProfileVersions with params:`, params);
      
      const result = await opal.callTool("compareProfileVersions", params);
      logger.debug(`Received comparison result:`, result);

      if (result && result.comparison) {
        logger.info(`Successfully compared versions ${selectedVersion} and ${compareVersion}`);
        logger.debug(`Comparison structure:`, {
          keys: Object.keys(result.comparison),
          changes: result.comparison.changes ? Object.keys(result.comparison.changes) : 'missing'
        });
        
        setComparisonResult(result.comparison);
        setCompareDialogOpen(true);
      } else {
        logger.warn(`Failed to compare profile versions, result:`, result);
        setError("Failed to compare profile versions.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorStack = err instanceof Error ? err.stack : undefined;
      logger.error(`Error comparing profile versions:`, err);
      logger.error(`Error details: ${errorMessage}`);
      if (errorStack) logger.error(`Stack trace: ${errorStack}`);
      setError("Failed to compare profile versions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle restoring a version
  const handleRestoreVersion = async () => {
    logger.info(`Restoring profile version: ${selectedVersion}`);
    
    if (!selectedVersion || !versionDetails) {
      logger.warn(`Cannot restore version: missing selectedVersion or versionDetails`);
      setError("No version selected to restore.");
      return;
    }

    try {
      setRestoring(true);
      logger.debug(`Restoring profile with structure:`, {
        keys: Object.keys(versionDetails),
        biographical: versionDetails.biographical ? Object.keys(versionDetails.biographical) : 'missing',
        personality_profile: versionDetails.personality_profile ? Object.keys(versionDetails.personality_profile) : 'missing',
        meta: versionDetails.meta ? Object.keys(versionDetails.meta) : 'missing'
      });
      
      // Pass the profile data to the parent component for restoration
      onRestoreVersion(versionDetails);
      logger.info(`Profile data passed to parent component for restoration`);
      
      setRestoreDialogOpen(false);
      
      // Refresh history after restoration
      const offset = (page - 1) * pageSize;
      logger.debug(`Refreshing history after restoration with params:`, { limit: pageSize, offset });
      
      const result = await opal.callTool("getProfileVersionHistory", {
        limit: pageSize,
        offset,
      });
      
      logger.debug(`Received refreshed history result:`, result);
      
      if (result && result.history) {
        logger.info(`Successfully refreshed history, found ${result.history.length} entries`);
        setHistory(result.history);
        setTotalEntries(result.total || 0);
      } else {
        logger.warn(`Failed to refresh history after restoration, result:`, result);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorStack = err instanceof Error ? err.stack : undefined;
      logger.error(`Error restoring profile version:`, err);
      logger.error(`Error details: ${errorMessage}`);
      if (errorStack) logger.error(`Stack trace: ${errorStack}`);
      setError("Failed to restore profile version. Please try again later.");
    } finally {
      setRestoring(false);
    }
  };

  // Render section changes in comparison
  const renderChanges = (section: string, changes: ChangeSection) => {
    // Add defensive check for changes
    if (!changes || Object.keys(changes).length === 0) {
      return (
        <Alert>
          <AlertDescription>No changes detected in this section.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(changes).map(([key, value]) => {
          // Handle nested objects
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            // Check if it's a direct change item with from/to properties
            if ('from' in value && 'to' in value) {
              return (
                <div key={key} className="border-b pb-2 mb-2">
                  <div className="font-medium">{key}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Before:</div>
                      <div className="text-sm">
                        {value.from === null ? (
                          <span className="text-muted-foreground">Not set</span>
                        ) : (
                          JSON.stringify(value.from)
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">After:</div>
                      <div className="text-sm">
                        {value.to === null ? (
                          <span className="text-muted-foreground">Not set</span>
                        ) : (
                          JSON.stringify(value.to)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Nested object with its own changes
              return (
                <div key={key} className="border-b pb-2 mb-2">
                  <div className="font-medium mb-2">{key}</div>
                  {renderChanges(`${section}.${key}`, value)}
                </div>
              );
            }
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile History</CardTitle>
        <CardDescription>
          View and restore previous versions of your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (!history || history.length === 0) ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Select
                  value={selectedVersion?.toString() || undefined}
                  onValueChange={(value) => value && setSelectedVersion(parseInt(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {history && history.length > 0 ? history.map((entry) => (
                      <SelectItem 
                        key={entry.id} 
                        value={entry.id.toString() || `history-${entry.id}`}
                      >
                        {entry.created_at ? 
                          format(new Date(entry.created_at), "MMM d, yyyy h:mm a") : 
                          "Unknown date"}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-history" disabled>No history available</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewVersion(selectedVersion!)}
                  disabled={!selectedVersion}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestoreDialogOpen(true)}
                  disabled={!selectedVersion}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={compareVersion?.toString() || ""}
                  onValueChange={(value) => {
                    logger.debug(`Compare version selected: ${value}`);
                    setCompareVersion(Number(value));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select version to compare with" />
                  </SelectTrigger>
                  <SelectContent>
                    {history
                      .filter((entry) => entry.id !== selectedVersion)
                      .map((entry) => {
                        logger.debug(`Rendering SelectItem for history entry:`, entry);
                        return (
                          <SelectItem key={entry.id} value={entry.id.toString()}>
                            {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompareVersions}
                  disabled={!selectedVersion || !compareVersion || selectedVersion === compareVersion}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Compare
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Section Changed</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history && history.length > 0 ? history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.created_at ? format(new Date(entry.created_at), "MMM d, yyyy h:mm a") : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatSectionName(entry.section_changed)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.change_description || (
                        <span className="text-muted-foreground">No description</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVersion(entry.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No history entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalEntries > pageSize && (
              <div className="flex justify-center mt-4">
                <CustomPagination
                  currentPage={page}
                  totalPages={Math.ceil(totalEntries / pageSize)}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* View Version Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Version</DialogTitle>
            <DialogDescription>
              {selectedVersion &&
                history.find((h) => h.id === selectedVersion)?.created_at &&
                `Created on ${format(
                  new Date(history.find((h) => h.id === selectedVersion)!.created_at),
                  "MMMM d, yyyy h:mm a"
                )}`}
            </DialogDescription>
          </DialogHeader>

          {versionDetails && (
            <Tabs defaultValue="biographical">
              <TabsList>
                <TabsTrigger value="biographical">Biographical</TabsTrigger>
                <TabsTrigger value="personality">Personality</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
              </TabsList>

              <TabsContent value="biographical" className="space-y-4">
                {versionDetails && versionDetails.biographical && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(versionDetails.biographical).map(([key, value]) => (
                      <div key={key} className="border-b pb-2">
                        <div className="text-sm text-muted-foreground">{key}</div>
                        <div className="font-medium">
                          {Array.isArray(value)
                            ? value.join(", ")
                            : value === null || value === undefined
                            ? "Not set"
                            : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="personality" className="space-y-4">
                {Object.entries(versionDetails.personality_profile).map(([key, value]) => (
                  <div key={key} className="border-b pb-4 mb-2">
                    <h4 className="font-semibold mb-2">{formatSectionName(key)}</h4>
                    {typeof value === "object" && value !== null ? (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(value).map(([subKey, subValue]) => (
                          <div key={subKey} className="border-b pb-2">
                            <div className="text-sm text-muted-foreground">{subKey}</div>
                            <div className="font-medium">
                              {Array.isArray(subValue)
                                ? subValue.join(", ")
                                : subValue === null || subValue === undefined
                                ? "Not set"
                                : String(subValue)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="font-medium">
                        {value === null || value === undefined ? "Not set" : String(value)}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="meta" className="space-y-4">
                {versionDetails && versionDetails.meta && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(versionDetails.meta).map(([key, value]) => (
                      <div key={key} className="border-b pb-2">
                        <div className="text-sm text-muted-foreground">{key}</div>
                        <div className="font-medium">
                          {typeof value === "object" && value !== null
                            ? JSON.stringify(value)
                            : value === null || value === undefined
                            ? "Not set"
                            : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              setRestoreDialogOpen(true);
            }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Versions Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Profile Versions</DialogTitle>
            <DialogDescription>
              {comparisonResult && (
                <>
                  Comparing version from{" "}
                  {format(new Date(comparisonResult.date1), "MMMM d, yyyy h:mm a")} with{" "}
                  {format(new Date(comparisonResult.date2), "MMMM d, yyyy h:mm a")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {comparisonResult && (
            <Tabs defaultValue="biographical">
              <TabsList>
                <TabsTrigger value="biographical">Biographical</TabsTrigger>
                <TabsTrigger value="personality">Personality</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
              </TabsList>

              <TabsContent value="biographical" className="space-y-4">
                {comparisonResult?.changes?.biographical && 
                  renderChanges("biographical", comparisonResult.changes.biographical)}
              </TabsContent>

              <TabsContent value="personality" className="space-y-4">
                {comparisonResult?.changes?.personality_profile && 
                  renderChanges("personality_profile", comparisonResult.changes.personality_profile)}
              </TabsContent>

              <TabsContent value="meta" className="space-y-4">
                {comparisonResult?.changes?.meta && 
                  renderChanges("meta", comparisonResult.changes.meta)}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Version Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Profile Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this version of your profile? This will overwrite your current profile data.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRestoreVersion}
              disabled={restoring}
            >
              {restoring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProfileHistory;
