"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postsService } from "@/lib/services/posts.service";
import { toast } from "sonner";

interface PollVotingProps {
  postId: string;
  pollQuestion: string;
  pollOptions: string[];
  pollVotes: Record<string, number>;
  userVote?: number;
}

export function PollVoting({ postId, pollQuestion, pollOptions, pollVotes, userVote }: PollVotingProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(userVote || null);
  const [voting, setVoting] = useState(false);

  const totalVotes = Object.values(pollVotes).reduce((sum, count) => sum + count, 0);

  const handleVote = async () => {
    if (selectedOption === null) {
      toast.error("Please select an option");
      return;
    }

    setVoting(true);
    try {
      const response = await postsService.voteOnPoll({
        post_id: parseInt(postId),
        option_index: selectedOption,
      });

      if (response.success) {
        toast.success("Vote submitted!");
        // The parent component should refresh the poll data
      } else {
        toast.error(response.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      toast.error('Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const getVotePercentage = (optionIndex: number) => {
    if (totalVotes === 0) return 0;
    const votes = pollVotes[optionIndex] || 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mt-3">
      <h3 className="font-medium text-card-foreground mb-3">{pollQuestion}</h3>
      
      <div className="space-y-2 mb-4">
        {pollOptions.map((option, index) => {
          const votes = pollVotes[index] || 0;
          const percentage = getVotePercentage(index);
          const isSelected = selectedOption === index;
          const hasVoted = userVote !== undefined;

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="poll-option"
                  value={index}
                  checked={isSelected}
                  onChange={() => setSelectedOption(index)}
                  disabled={hasVoted}
                  className="h-4 w-4"
                />
                <label 
                  htmlFor={`option-${index}`}
                  className={`text-sm ${hasVoted ? 'text-muted-foreground' : 'text-card-foreground'}`}
                >
                  {option}
                </label>
              </div>
              
              {hasVoted && (
                <div className="ml-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{votes} vote{votes !== 1 ? 's' : ''}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!userVoted && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
          </span>
          <Button
            onClick={handleVote}
            disabled={selectedOption === null || voting}
            size="sm"
            className="h-8 px-4"
          >
            {voting ? 'Voting...' : 'Vote'}
          </Button>
        </div>
      )}

      {userVoted && (
        <div className="text-sm text-muted-foreground">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
        </div>
      )}
    </div>
  );
}
