"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { postsService } from "@/lib/services/posts.service";
import { toast } from "sonner";

interface PollVotingProps {
  postId: string;
  pollQuestion: string;
  pollOptions: string[];
  pollVotes: Record<string, number>;
  userVote?: number | null;
}

export function PollVoting({ postId, pollQuestion, pollOptions, pollVotes, userVote }: PollVotingProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(userVote ?? null);
  const [voting, setVoting] = useState(false);

  const totalVotes = Object.values(pollVotes).reduce((sum, count) => sum + Number(count), 0);

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
    const votes = Number(pollVotes[optionIndex.toString()] || pollVotes[optionIndex] || 0);
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="bg-gradient-to-br from-muted/30 to-muted/60 border border-border rounded-xl p-5 mt-3 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 bg-primary rounded-full"></div>
        <h3 className="font-semibold text-card-foreground text-base">{pollQuestion}</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        {pollOptions.map((option, index) => {
          const votes = Number(pollVotes[index.toString()] || pollVotes[index] || 0);
          const percentage = getVotePercentage(index);
          const isSelected = selectedOption === index;
          const hasVoted = userVote !== null && userVote !== undefined;

          return (
            <div key={index} className="group">
              <div className="flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 hover:bg-muted/50">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="poll-option"
                  value={index}
                  checked={isSelected}
                  onChange={() => setSelectedOption(index)}
                  disabled={hasVoted}
                  className="h-4 w-4 text-primary focus:ring-primary focus:ring-2"
                />
                <label 
                  htmlFor={`option-${index}`}
                  className={`flex-1 text-sm font-medium cursor-pointer transition-colors ${
                    hasVoted 
                      ? isSelected 
                        ? 'text-primary' 
                        : 'text-muted-foreground' 
                      : 'text-card-foreground hover:text-primary'
                  }`}
                >
                  {option}
                </label>
                {hasVoted && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {percentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({votes})
                    </span>
                  </div>
                )}
              </div>
              
              {hasVoted && (
                <div className="ml-7 mt-2">
                  <div className="w-full bg-muted/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        isSelected 
                          ? 'bg-gradient-to-r from-primary to-primary/80' 
                          : 'bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/60'
                      }`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {userVote === null && (
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full"></div>
            <span className="text-sm text-muted-foreground">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
            </span>
          </div>
          <Button
            onClick={handleVote}
            disabled={selectedOption === null || voting}
            size="sm"
            className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {voting ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                Voting...
              </div>
            ) : (
              'Vote'
            )}
          </Button>
        </div>
      )}

      {userVote !== null && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <div className="h-1.5 w-1.5 bg-primary/60 rounded-full"></div>
          <span className="text-sm text-muted-foreground">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
          </span>
          <div className="ml-auto text-xs text-primary font-medium">
            You voted
          </div>
        </div>
      )}
    </div>
  );
}
