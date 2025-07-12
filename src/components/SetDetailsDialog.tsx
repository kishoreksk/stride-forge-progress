import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Set {
  id?: string;
  set_number: number;
  reps: number;
  weight_kg?: number;
}

interface SetDetailsDialogProps {
  exerciseId: string;
  exerciseName: string;
  exerciseType: string;
  onSetsUpdated: () => void;
  children: React.ReactNode;
}

export const SetDetailsDialog = ({ 
  exerciseId, 
  exerciseName, 
  exerciseType,
  onSetsUpdated, 
  children 
}: SetDetailsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSets();
    }
  }, [open, exerciseId]);

  const fetchSets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercise_sets')
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('set_number');

      if (error) throw error;

      if (data && data.length > 0) {
        setSets(data.map(set => ({
          id: set.id,
          set_number: set.set_number,
          reps: set.reps,
          weight_kg: set.weight_kg
        })));
      } else {
        // Initialize with one empty set
        setSets([{ set_number: 1, reps: 0, weight_kg: exerciseType === 'strength' ? 0 : undefined }]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading sets",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSet = () => {
    const newSetNumber = sets.length > 0 ? Math.max(...sets.map(s => s.set_number)) + 1 : 1;
    setSets([...sets, { 
      set_number: newSetNumber, 
      reps: 0, 
      weight_kg: exerciseType === 'strength' ? 0 : undefined 
    }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index: number, field: keyof Set, value: any) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  };

  const saveSets = async () => {
    setIsSaving(true);
    try {
      // Delete existing sets
      await supabase
        .from('exercise_sets')
        .delete()
        .eq('exercise_id', exerciseId);

      // Insert new sets
      if (sets.length > 0) {
        const setsData = sets.map((set, index) => ({
          exercise_id: exerciseId,
          set_number: index + 1,
          reps: set.reps,
          weight_kg: exerciseType === 'strength' ? set.weight_kg : null
        }));

        const { error } = await supabase
          .from('exercise_sets')
          .insert(setsData);

        if (error) throw error;
      }

      toast({
        title: "Sets updated successfully!",
        description: `${sets.length} sets saved for ${exerciseName}.`,
      });

      setOpen(false);
      onSetsUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving sets",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Details - {exerciseName}</DialogTitle>
          <DialogDescription>
            Track weight and reps for each individual set
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Loading sets...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Sets</h3>
              <Button onClick={addSet} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
            </div>

            {sets.map((set, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Set {index + 1}</CardTitle>
                    {sets.length > 1 && (
                      <Button
                        onClick={() => removeSet(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`grid gap-4 ${exerciseType === 'strength' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div>
                      <Label>Reps</Label>
                      <Input
                        type="number"
                        placeholder="12"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(index, 'reps', e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </div>
                    {exerciseType === 'strength' && (
                      <div>
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="20"
                          value={set.weight_kg || ''}
                          onChange={(e) => updateSet(index, 'weight_kg', e.target.value ? parseFloat(e.target.value) : 0)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {sets.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground mb-4">No sets added yet</p>
                <Button onClick={addSet} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Set
                </Button>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveSets} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Sets"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};