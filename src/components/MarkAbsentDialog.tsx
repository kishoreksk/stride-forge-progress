import { useState } from 'react';
import { UserX, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MarkAbsentDialogProps {
  date: Date;
  dayName: string;
}

const motivationalQuotes = [
  "Tomorrow is a new opportunity to crush your goals! 💪",
  "Rest today, dominate tomorrow. Your body will thank you! 🔥",
  "Champions are made when nobody's watching. See you tomorrow! ⭐",
  "Every champion was once a beginner who refused to give up. Tomorrow's your comeback! 🚀",
  "Progress isn't always linear. Tomorrow you'll bounce back stronger! 💯",
  "Your future self will thank you for showing up tomorrow! 🏆",
  "Today's rest is tomorrow's strength. You've got this! ⚡",
  "Consistency beats perfection. Make tomorrow count! 🎯",
  "The strongest people have their off days too. Tomorrow is yours! 🦾",
  "Your journey doesn't end here. Tomorrow is chapter two! 📖"
];

export const MarkAbsentDialog = ({ date, dayName }: MarkAbsentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

  const handleMarkAbsent = () => {
    // This is just a UI component for motivation
    // The actual "absent" marking would be tracked by absence of workout data
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <UserX className="h-3 w-3 mr-1" />
          Mark Absent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            No Progress Today
          </DialogTitle>
          <DialogDescription>
            It's okay to have rest days. {dayName} will be marked as a rest day.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-red-500" />
              Motivational Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground italic text-lg leading-relaxed">
              "{quote}"
            </p>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Remember: Rest is part of progress. Listen to your body and come back stronger tomorrow!
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleMarkAbsent} className="bg-gradient-to-r from-primary to-primary/80">
            Mark as Rest Day
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};