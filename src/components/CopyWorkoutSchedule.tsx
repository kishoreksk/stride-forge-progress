import { useState } from 'react';
import { format, startOfWeek } from 'date-fns';
import { Copy, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CopyWorkoutScheduleProps {
  weekStartDate: Date;
  onScheduleCopied: () => void;
}

export const CopyWorkoutSchedule = ({ weekStartDate, onScheduleCopied }: CopyWorkoutScheduleProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [weeks, setWeeks] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopySchedule = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('duplicate_workout_schedule', {
        p_user_id: user.id,
        p_source_week_start: format(weekStartDate, 'yyyy-MM-dd'),
        p_target_weeks: weeks
      });

      if (error) throw error;

      const copiedSessions = data as any[];
      
      toast({
        title: "Schedule copied successfully!",
        description: `Copied ${copiedSessions.length} workout sessions for the next ${weeks} weeks.`,
      });

      setOpen(false);
      onScheduleCopied();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error copying schedule",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Copy Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy Workout Schedule</DialogTitle>
          <DialogDescription>
            Copy this week's workout schedule to the next several weeks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Source week: {format(weekStartDate, 'MMM d')} - {format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="weeks">Number of weeks to copy to</Label>
            <Input
              id="weeks"
              type="number"
              min="1"
              max="12"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value) || 6)}
              placeholder="6"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopySchedule} disabled={isLoading}>
              {isLoading ? "Copying..." : `Copy to ${weeks} weeks`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};