"use client";

import { useState } from "react";
import { doc, setDoc, deleteDoc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { PollData } from "@/types";

interface PollDisplayProps {
  postId: string;
  poll: PollData;
}

export function PollDisplay({ postId, poll }: PollDisplayProps) {
  const { user } = useAuth();
  const [voted, setVoted] = useState<number | null>(null);
  const [options, setOptions] = useState(poll.options);
  const [totalVotes, setTotalVotes] = useState(poll.total_votes);
  const [loading, setLoading] = useState(false);

  const endsAt = typeof poll.ends_at === "string"
    ? new Date(poll.ends_at)
    : poll.ends_at.toDate?.() ?? new Date();
  const isExpired = endsAt < new Date();
  const showResults = voted !== null || isExpired;

  const handleVote = async (optionIndex: number) => {
    if (!user || voted !== null || isExpired || loading) return;
    setLoading(true);

    const voteId = `${user.uid}_${postId}`;
    const voteRef = doc(db, "poll_votes", voteId);

    try {
      // Check if already voted
      const existingVote = await getDoc(voteRef);
      if (existingVote.exists()) {
        setVoted(existingVote.data().option_index);
        setLoading(false);
        return;
      }

      await setDoc(voteRef, {
        post_id: postId,
        user_id: user.uid,
        option_index: optionIndex,
        created_at: new Date(),
      });

      // Update local state
      const updatedOptions = [...options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        vote_count: updatedOptions[optionIndex].vote_count + 1,
      };
      setOptions(updatedOptions);
      setTotalVotes((t) => t + 1);
      setVoted(optionIndex);
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = () => {
    if (isExpired) return "Final results";
    const diff = endsAt.getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="mt-3 rounded-2xl border border-border-custom overflow-hidden">
      <div className="p-3 space-y-2">
        {options.map((option, index) => {
          const percentage = totalVotes > 0
            ? Math.round((option.vote_count / totalVotes) * 100)
            : 0;
          const isWinner = showResults && option.vote_count === Math.max(...options.map((o) => o.vote_count));

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={showResults || loading}
              className={cn(
                "relative w-full h-10 rounded-lg text-left overflow-hidden transition-colors",
                showResults
                  ? "cursor-default"
                  : "cursor-pointer hover:bg-brand/5 border border-brand/30"
              )}
            >
              {/* Progress bar */}
              {showResults && (
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg transition-all duration-500",
                    isWinner ? "bg-brand/15" : "bg-[#EFF3F4]"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between px-3 h-full">
                <span
                  className={cn(
                    "text-[15px]",
                    showResults && isWinner ? "font-bold text-text-primary" : "text-text-primary",
                    voted === index && "font-bold"
                  )}
                >
                  {option.text}
                  {voted === index && " ✓"}
                </span>
                {showResults && (
                  <span
                    className={cn(
                      "text-[13px] shrink-0 ml-2",
                      isWinner ? "font-bold text-text-primary" : "text-muted-text"
                    )}
                  >
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex items-center gap-2 text-[13px] text-muted-text">
        <span>{totalVotes.toLocaleString()} vote{totalVotes !== 1 ? "s" : ""}</span>
        <span>&middot;</span>
        <span>{getTimeRemaining()}</span>
      </div>
    </div>
  );
}
