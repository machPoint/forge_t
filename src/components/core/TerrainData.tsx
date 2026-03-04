import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Flame, 
  Target, 
  Brain, 
  Trophy, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import opal from '@/lib/simple-opal-client';

interface TerrainSnapshot {
  id: number;
  exported_at: string;
  imported_at: string;
  snapshot: any;
}

const TerrainData: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<TerrainSnapshot | null>(null);

  useEffect(() => {
    loadTerrainData();
  }, []);

  const loadTerrainData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await opal.callTool('get_latest_terrain_snapshot', {});
      
      if (result.success && result.snapshot) {
        setLatestSnapshot(result.snapshot);
      } else {
        setLatestSnapshot(null);
      }
    } catch (err: any) {
      console.error('[TerrainData] Error loading data:', err);
      setError(err.message || 'Failed to load TERRAIN data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-app-text-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!latestSnapshot) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No TERRAIN data imported yet. Go to Settings → Connection to import your behavioral health data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = latestSnapshot.snapshot;
  const exportDate = new Date(data.exported_at).toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-app-text-primary">TERRAIN Behavioral Data</h2>
          <p className="text-sm text-app-text-secondary">
            Exported: {exportDate}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Activity className="h-3 w-3 mr-1" />
          Synced
        </Badge>
      </div>

      {/* Fasting Protocol */}
      {data.fasting && (
        <Card className="bg-app-bg-tertiary border-app-border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Fasting Protocol
            </CardTitle>
            <CardDescription>Week {data.fasting.active_week} of 4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-app-text-secondary">Total Logged</p>
                <p className="text-2xl font-bold">{data.fasting.summary.total_logged}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-app-text-secondary">Completed (30d)</p>
                <p className="text-2xl font-bold text-green-500">{data.fasting.summary.completed_last_30_days}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-app-text-secondary">Modified (7d)</p>
                <p className="text-2xl font-bold text-yellow-500">{data.fasting.summary.modified_last_7_days}</p>
              </div>
            </div>
            
            {data.fasting.last_30_days && data.fasting.last_30_days.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Activity</p>
                  <div className="space-y-2">
                    {data.fasting.last_30_days.slice(-5).reverse().map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-app-bg-elevated p-2 rounded">
                        <span className="text-app-text-secondary">{entry.date_key}</span>
                        <span className="font-medium">{entry.fasting_window}</span>
                        <Badge variant={entry.adhered ? 'default' : 'secondary'}>
                          {entry.adhered ? 'Completed' : 'Modified'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Protocols */}
      {(data.protocols?.today || data.protocols?.active_chain) && (
        <Card className="bg-app-bg-tertiary border-app-border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Active Protocols
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.protocols.today && (
              <div className="bg-app-bg-elevated p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-app-text-primary">{data.protocols.today.title}</p>
                    <p className="text-sm text-app-text-secondary mt-1">Today's Protocol</p>
                  </div>
                  <Badge variant={data.protocols.today.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {data.protocols.today.status}
                  </Badge>
                </div>
                {data.protocols.today.xp_awarded && (
                  <p className="text-xs text-app-text-secondary mt-2">
                    +{data.protocols.today.xp_awarded} XP
                  </p>
                )}
              </div>
            )}
            
            {data.protocols.active_chain && (
              <div className="bg-app-bg-elevated p-4 rounded-lg">
                <p className="font-medium text-app-text-primary">{data.protocols.active_chain.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-app-bg-tertiary rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(data.protocols.active_chain.steps_completed / data.protocols.active_chain.total_steps) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-app-text-secondary">
                    {data.protocols.active_chain.steps_completed}/{data.protocols.active_chain.total_steps}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Behavioral Reps */}
      {data.reps?.last_7_days && data.reps.last_7_days.length > 0 && (
        <Card className="bg-app-bg-tertiary border-app-border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Behavioral Reps
            </CardTitle>
            <CardDescription>{data.reps.last_7_days.length} completed in last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.reps.last_7_days.slice(0, 5).map((rep: any, idx: number) => (
              <div key={idx} className="bg-app-bg-elevated p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{rep.lane}</Badge>
                  {rep.completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
                <p className="text-sm font-medium">{rep.finish_line}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-app-text-secondary">Predicted:</p>
                    <p className="text-app-text-primary italic">{rep.prediction}</p>
                  </div>
                  <div>
                    <p className="text-app-text-secondary">Reality:</p>
                    <p className="text-app-text-primary italic">{rep.reality}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sentry Triggers */}
      {data.sentry?.last_14_days && data.sentry.last_14_days.length > 0 && (
        <Card className="bg-app-bg-tertiary border-app-border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Sentry Triggers
            </CardTitle>
            <CardDescription>{data.sentry.last_14_days.length} logged in last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.sentry.last_14_days
              .sort((a: any, b: any) => b.intensity - a.intensity)
              .slice(0, 5)
              .map((trigger: any, idx: number) => (
                <div key={idx} className="bg-app-bg-elevated p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{trigger.map_character}</Badge>
                    <span className="text-xs text-app-text-secondary">
                      Intensity: {trigger.intensity}/10
                    </span>
                  </div>
                  <p className="text-sm italic text-app-text-primary">"{trigger.one_liner}"</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-app-text-secondary">{trigger.trigger_type}</span>
                    <Badge variant="outline" className="text-xs">{trigger.response}</Badge>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Accomplishments */}
      {data.accomplishments?.last_30_days && data.accomplishments.last_30_days.length > 0 && (
        <Card className="bg-app-bg-tertiary border-app-border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recent Accomplishments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.accomplishments.last_30_days.slice(0, 5).map((acc: any, idx: number) => (
              <div key={idx} className="bg-app-bg-elevated p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-app-text-primary">{acc.title}</p>
                  <span className="text-xs text-app-text-secondary">{acc.date}</span>
                </div>
                {acc.description && (
                  <p className="text-sm text-app-text-secondary">{acc.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Core Notes */}
      {data.notes && data.notes.length > 0 && (
        <Card className="bg-app-bg-tertiary border-app-border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              Core Frameworks
            </CardTitle>
            <CardDescription>Your psychological insights and patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.notes.map((note: any, idx: number) => (
              <div key={idx} className="bg-app-bg-elevated p-4 rounded-lg">
                <Badge variant="outline" className="mb-2">{note.type}</Badge>
                <p className="text-sm text-app-text-primary italic">"{note.content}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TerrainData;
