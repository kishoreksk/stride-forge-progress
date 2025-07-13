import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface WeeklyPDFGeneratorProps {
  weekStartDate: Date;
}

export const WeeklyPDFGenerator = ({ weekStartDate }: WeeklyPDFGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generatePDF = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to generate reports",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-pdf', {
        body: {
          weekStartDate: format(weekStartDate, 'yyyy-MM-dd')
        }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-report-${format(weekStartDate, 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report generated!",
        description: "Your weekly fitness report PDF has been downloaded.",
      });

    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to generate PDF report",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generatePDF} 
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="h-8 px-2"
    >
      <FileDown className="h-4 w-4 mr-1" />
      {isGenerating ? "Generating..." : "PDF Report"}
    </Button>
  );
};