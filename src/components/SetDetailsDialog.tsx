import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Copy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [quickAddSets, setQuickAddSets] = useState('');
  const [quickAddReps, setQuickAddReps] = useState('');
  const [quickAddWeight, setQuickAddWeight] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { 
      set_number: newSetNumber, 
      reps: lastSet?.reps || 0, 
      weight_kg: exerciseType === 'strength' ? (lastSet?.weight_kg || 0) : undefined 
    }]);
    
    // Focus the new set's reps input
    setTimeout(() => {
      const newIndex = sets.length;
      inputRefs.current[newIndex * 2]?.focus();
    }, 100);
  };

  const addMultipleSets = () => {
    const numSets = parseInt(quickAddSets) || 1;
    const reps = parseInt(quickAddReps) || 0;
    const weight = exerciseType === 'strength' ? (parseFloat(quickAddWeight) || 0) : undefined;
    
    const newSets = Array.from({ length: numSets }, (_, i) => ({
      set_number: sets.length + i + 1,
      reps,
      weight_kg: weight
    }));
    
    setSets([...sets, ...newSets]);
    setQuickAddSets('');
    setQuickAddReps('');
    setQuickAddWeight('');
  };

  const copyPreviousSet = (index: number) => {
    if (index > 0) {
      const previousSet = sets[index - 1];
      updateSet(index, 'reps', previousSet.reps);
      if (exerciseType === 'strength') {
        updateSet(index, 'weight_kg', previousSet.weight_kg);
      }
    }
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index: number, field: keyof Set, value: any) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: keyof Set) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'reps') {
        // Move to weight input or next set's reps
        const nextInputIndex = exerciseType === 'strength' ? index * 2 + 1 : (index + 1) * 2;
        if (inputRefs.current[nextInputIndex]) {
          inputRefs.current[nextInputIndex]?.focus();
        } else {
          addSet();
        }
      } else if (field === 'weight_kg') {
        // Move to next set's reps or add new set
        const nextInputIndex = (index + 1) * 2;
        if (inputRefs.current[nextInputIndex]) {
          inputRefs.current[nextInputIndex]?.focus();
        } else {
          addSet();
        }
      }
    }
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
            {/* Quick Add Section */}
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Quick Add Multiple Sets</h4>
              <div className="grid gap-3 grid-cols-4">
                <div>
                  <Label className="text-xs">Sets</Label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={quickAddSets}
                    onChange={(e) => setQuickAddSets(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Reps</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={quickAddReps}
                    onChange={(e) => setQuickAddReps(e.target.value)}
                    className="h-8"
                  />
                </div>
                {exerciseType === 'strength' && (
                  <div>
                    <Label className="text-xs">Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="20"
                      value={quickAddWeight}
                      onChange={(e) => setQuickAddWeight(e.target.value)}
                      className="h-8"
                    />
                  </div>
                )}
                <div className="flex items-end">
                  <Button onClick={addMultipleSets} size="sm" className="h-8 w-full">
                    Add All
                  </Button>
                </div>
              </div>
            </div>

            {/* Sets Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Sets</h3>
                <Button onClick={addSet} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Set
                </Button>
              </div>

              {sets.length > 0 && (
                <div className="space-y-2">
                  {/* Header */}
                  <div className={`grid gap-2 items-center p-2 text-sm font-medium text-muted-foreground ${
                    exerciseType === 'strength' ? 'grid-cols-[40px_1fr_1fr_auto]' : 'grid-cols-[40px_1fr_auto]'
                  }`}>
                    <div>Set</div>
                    <div>Reps</div>
                    {exerciseType === 'strength' && <div>Weight (kg)</div>}
                    <div className="w-20">Actions</div>
                  </div>

                  {/* Sets */}
                  {sets.map((set, index) => (
                    <div
                      key={index}
                      className={`grid gap-2 items-center p-2 border rounded-md hover:bg-muted/20 ${
                        exerciseType === 'strength' ? 'grid-cols-[40px_1fr_1fr_auto]' : 'grid-cols-[40px_1fr_auto]'
                      }`}
                    >
                      <div className="text-sm font-medium text-center">{index + 1}</div>
                      <Input
                        ref={(el) => inputRefs.current[index * 2] = el}
                        type="number"
                        placeholder="10"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(index, 'reps', e.target.value ? parseInt(e.target.value) : 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'reps')}
                        className="h-8"
                      />
                      {exerciseType === 'strength' && (
                        <Input
                          ref={(el) => inputRefs.current[index * 2 + 1] = el}
                          type="number"
                          step="0.5"
                          placeholder="20"
                          value={set.weight_kg || ''}
                          onChange={(e) => updateSet(index, 'weight_kg', e.target.value ? parseFloat(e.target.value) : 0)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'weight_kg')}
                          className="h-8"
                        />
                      )}
                      <div className="flex gap-1">
                        {index > 0 && (
                          <Button
                            onClick={() => copyPreviousSet(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Copy previous set"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                        {sets.length > 1 && (
                          <Button
                            onClick={() => removeSet(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            title="Remove set"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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