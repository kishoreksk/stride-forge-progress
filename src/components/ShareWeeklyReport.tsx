import { useState } from 'react';
import { Share2, Link, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ViewReportComments } from './ViewReportComments';

interface ShareWeeklyReportProps {
  weekStartDate: Date;
}

export const ShareWeeklyReport = ({ weekStartDate }: ShareWeeklyReportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [title, setTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateShareLink = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to share reports",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('shared-report?action=create', {
        body: {
          weekStartDate: format(weekStartDate, 'yyyy-MM-dd'),
          title: title || `Weekly Progress - ${format(weekStartDate, 'MMM d, yyyy')}`
        }
      });

      if (error) throw error;

      if (data.success) {
        const fullShareUrl = `${window.location.origin}/share/${data.shareToken}`;
        setShareUrl(fullShareUrl);
        
        toast({
          title: "Share link created!",
          description: "Your weekly progress report is ready to share.",
        });
      } else {
        throw new Error('Failed to create share link');
      }

    } catch (error: any) {
      console.error('Share generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to create share link",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShareUrl('');
      setTitle('');
      setCopied(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Weekly Progress</DialogTitle>
          <DialogDescription>
            Create a shareable link for week of {format(weekStartDate, 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!shareUrl ? (
            <>
              <div>
                <Label htmlFor="title">Report Title (optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Weekly Progress - ${format(weekStartDate, 'MMM d, yyyy')}`}
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={generateShareLink} 
                disabled={isGenerating}
                className="w-full"
              >
                <Link className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Create Share Link"}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Shareable Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">What's included:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete workout details with sets/reps</li>
                  <li>• Progress photos</li>
                  <li>• Weekly statistics</li>
                  <li>• Comment section for feedback</li>
                </ul>
              </div>

              <Button 
                onClick={() => window.open(shareUrl, '_blank')}
                variant="outline"
                className="w-full"
              >
                Preview Shared Report
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};