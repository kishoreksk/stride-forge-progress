import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteExerciseDialogProps {
  exerciseId: string;
  exerciseName: string;
  onExerciseDeleted: () => void;
}

export const DeleteExerciseDialog = ({ exerciseId, exerciseName, onExerciseDeleted }: DeleteExerciseDialogProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // First delete all exercise sets
      const { error: setsError } = await supabase
        .from('exercise_sets')
        .delete()
        .eq('exercise_id', exerciseId);

      if (setsError) throw setsError;

      // Then delete the exercise
      const { error: exerciseError } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

      if (exerciseError) throw exerciseError;

      toast({
        title: "Exercise deleted",
        description: `${exerciseName} has been removed from your workout.`,
      });

      onExerciseDeleted();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting exercise",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs text-destructive hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{exerciseName}"? This action cannot be undone and will remove all sets associated with this exercise.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Exercise"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};