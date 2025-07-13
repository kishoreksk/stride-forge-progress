import { useState, useEffect } from 'react';
import { MessageCircle, User, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Comment {
  id: string;
  commenter_name: string;
  comment_text: string;
  created_at: string;
}

interface ViewReportCommentsProps {
  weekStartDate: Date;
}

export const ViewReportComments = ({ weekStartDate }: ViewReportCommentsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sharedReportExists, setSharedReportExists] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchComments = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to view comments",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First check if there's a shared report for this week by this user
      const { data: sharedReports, error: reportsError } = await supabase
        .from('shared_reports')
        .select('id, share_token, title')
        .eq('week_start_date', format(weekStartDate, 'yyyy-MM-dd'))
        .eq('user_id', user.id)
        .eq('is_active', true);

      console.log('Searching for shared reports for date:', format(weekStartDate, 'yyyy-MM-dd'), 'user:', user.id);

      if (reportsError) throw reportsError;

      console.log('Found shared reports:', sharedReports);

      if (sharedReports && sharedReports.length > 0) {
        setSharedReportExists(true);
        
        // Get all comments for all shared reports for this week
        const allComments: Comment[] = [];
        
        for (const sharedReport of sharedReports) {
          console.log('Fetching comments for shared report:', sharedReport.id);
          
          const { data: commentsData, error: commentsError } = await supabase
            .from('report_comments')
            .select('*')
            .eq('shared_report_id', sharedReport.id)
            .order('created_at', { ascending: false });

          if (commentsError) {
            console.error('Error fetching comments for report:', sharedReport.id, commentsError);
            continue;
          }

          console.log('Comments found for report', sharedReport.id, ':', commentsData);
          
          if (commentsData) {
            allComments.push(...commentsData);
          }
        }
        
        // Sort all comments by created_at descending
        allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        console.log('Total comments found:', allComments);
        setComments(allComments);
      } else {
        console.log('No shared reports found for this week');
        setSharedReportExists(false);
        setComments([]);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast({
        variant: "destructive",
        title: "Error loading comments",
        description: error.message || "Failed to load comments",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, weekStartDate]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setComments([]);
      setSharedReportExists(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <MessageCircle className="h-4 w-4 mr-1" />
          Comments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comments & Feedback</DialogTitle>
          <DialogDescription>
            Comments received for week of {format(weekStartDate, 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !sharedReportExists ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Shared Report</h3>
              <p className="text-muted-foreground mb-4">
                You haven't shared a report for this week yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Share your weekly progress to start receiving comments from your coach and friends.
              </p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Comments Yet</h3>
              <p className="text-muted-foreground">
                No one has left feedback on your shared report yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{comment.commenter_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{comment.comment_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};