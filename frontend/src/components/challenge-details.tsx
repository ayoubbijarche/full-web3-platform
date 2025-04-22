"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Wallet, Users, MessageCircle, Share2, Trophy, User, Coins, Ticket, AlertTriangle, ThumbsUp, ThumbsDown, Heart, CheckCircle, ChevronDown, ChevronUp, UserPlus, Vote, LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import mountImage from '@/assets/mount.png'
import { SubmitVideoDialog } from "@/components/submit-video-dialog"
import { getChatMessages, sendMessage, useAuth, type MessageModel, joinChallenge, getVideoSubmissions, reportChallenge, likeVideoSubmission, dislikeVideoSubmission, voteForSubmission, type VideoSubmissionModel, type ChallengeModel } from "@/lib/pb"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAnchor } from '@/lib/anchor-context'
import { PublicKey } from '@solana/web3.js'
import { toast } from "sonner"; // Use Sonner toast instead
import { pb } from "@/lib/pb"
import { useMediaQuery } from "../hooks/use-media-query" // You'll need to create this hook

// Add this constant at the top of your component
const FIXED_SUBMISSION_FEE = 5; // Fixed submission fee of 5 CPT

// First, add this utility function to format dates and time remaining
const formatDeadline = (date: string | Date) => {
  const now = new Date();
  const deadline = new Date(date);
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    return { timeLeft: "Ended", hasEnded: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { timeLeft: `${days}d ${hours}h`, hasEnded: false };
  } else if (hours > 0) {
    return { timeLeft: `${hours}h ${minutes}m`, hasEnded: false };
  } else {
    return { timeLeft: `${minutes}m`, hasEnded: false };
  }
};

// Add this component to challenge-details.tsx
const DeadlineTimer = ({ label, date, icon: Icon }: { 
  label: string;
  date: string | Date;
  icon: LucideIcon;
}) => {
  const [timeInfo, setTimeInfo] = useState(() => formatDeadline(date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(formatDeadline(date));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [date]);

  return (
    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
      <Icon className={`h-5 w-5 ${timeInfo.hasEnded ? 'text-red-500' : 'text-[#B3731D]'}`} />
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-sm font-medium ${
          timeInfo.hasEnded ? 'text-red-500' : 'text-[#B3731D]'
        }`}>
          {timeInfo.timeLeft}
        </p>
      </div>
    </div>
  );
};

export interface ChallengeDetailsProps {
  challenge: ChallengeModel;
}

export function ChallengeDetails({ challenge }: ChallengeDetailsProps) {
  const [messages, setMessages] = useState<MessageModel[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const auth = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isReporting, setIsReporting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSuccess, setReportSuccess] = useState<string | null>(null)
  const [videoSubmissions, setVideoSubmissions] = useState<VideoSubmissionModel[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const keywords = Array.isArray(challenge.keywords) ? challenge.keywords : []
  const imageUrl = challenge.image 
    ? `https://api.coinpetitive.com/api/files/challenges/${challenge.id}/${challenge.image}`
    : "/placeholder-image.png"
  const router = useRouter()
  const [dataVersion, setDataVersion] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const isCreator = auth.user?.id === challenge.creator;
  const { participateInChallenge, voteForSubmissionOnChain, getTreasuryBalance, claimCreatorReward, getVotingTreasuryBalance, finalizeChallenge  , finalizeVotingTreasury } = useAnchor()
  const [onChainStatus, setOnChainStatus] = useState<string | null>(null)
  const [onChainError, setOnChainError] = useState<string | null>(null)
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [finalizeSuccess, setFinalizeSuccess] = useState<string | null>(null);
  const [isFinalizingVoting, setIsFinalizingVoting] = useState(false);
  const [finalizeVotingError, setFinalizeVotingError] = useState<string | null>(null);
  const [finalizeVotingSuccess, setFinalizeVotingSuccess] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
 // Update the state type definition
  const [treasuryBalance, setTreasuryBalance] = useState<{
    success: boolean;
    tokenBalance?: number;
    tokenDecimals?: number;
    tokenAmountRaw?: string;
    solBalance?: number;
    treasuryAddress?: string;
    treasuryTokenAccount?: string;
    error?: string;
  } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  // Add this with your other state declarations
  const [votingTreasuryBalance, setVotingTreasuryBalance] = useState<{
    success: boolean;
    tokenBalance?: number;
    tokenDecimals?: number;
    tokenAmountRaw?: string;
    solBalance?: number;
    votingTreasuryAddress?: string;
    votingTreasuryTokenAccount?: string;
    error?: string;
  } | null>(null);
  const [loadingVotingBalance, setLoadingVotingBalance] = useState(false);
  
  // Add these state variables to your component
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [challengeState, setChallengeState] = useState<string>("active");
  const [canFinalize, setCanFinalize] = useState(false);

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

    // At the start of your component
  const [isClient, setIsClient] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log('Challenge in component:', challenge);
    console.log('Challenge expand:', challenge.expand);
    console.log('Video submission in component:', challenge.expand?.video_submited);
  }, [challenge]);
  
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchMessages = async () => {
      try {
        const result = await getChatMessages(challenge.chat, controller.signal);
        
        // Check if component is still mounted
        if (!isMounted) return;

        if (result.success && Array.isArray(result.messages)) {
          const sortedMessages = result.messages.map(record => ({
            id: record.id,
            text: record.text || '',
            sender: record.sender || '',
            chat: record.chat || '',
            created: record.created || new Date().toISOString(),
            updated: record.updated || new Date().toISOString(),
            expand: record.expand
          })).sort((a, b) => 
            new Date(a.created).getTime() - new Date(b.created).getTime()
          );
          setMessages(sortedMessages);
        }
      } catch (error) {
        // Only log errors if component is still mounted and error isn't cancellation
        if (isMounted && error instanceof Error && !error.message.includes('autocancelled')) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    // Initial fetch
    fetchMessages();

    // Set up polling with cleanup
    const intervalId = setInterval(fetchMessages, 5000);

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [challenge.chat]);
  
  // Fetch video submissions
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchVideoSubmissions = async () => {
      if (!isMounted) return;
      
      setIsLoadingSubmissions(true);
      try {
        console.log('Fetching video submissions for challenge:', challenge.id);
        const result = await getVideoSubmissions(challenge.id, controller.signal);
        
        if (!isMounted) return;
        
        if (result.success && Array.isArray(result.submissions)) {
          console.log('Video submissions from API:', result.submissions);
          // Map the PocketBase records to VideoSubmissionModel objects
          const typedSubmissions = result.submissions.map(record => {
            // Ensure voters array is properly extracted and processed
            let voters = [];
            
            // Handle different possible formats of voters data from API
            if (Array.isArray(record.voters)) {
              voters = record.voters;
            } else if (typeof record.voters === 'string') {
              try {
                // Try to parse if it's a JSON string
                voters = JSON.parse(record.voters);
              } catch (e) {
                voters = [];
              }
            }
            
            return {
              id: record.id,
              description: record.description || '',
              video: record.video || '',
              challenge: record.challenge || '',
              participant: record.participant || '',
              sender: record.sender || record.participant || '',
              likes: record.likes || [],
              dislikes: record.dislikes || [],
              created: record.created || new Date().toISOString(),
              updated: record.updated || new Date().toISOString(),
              collectionId: record.collectionId || record.$collectionId || 'video_submitted',
              voters: voters,  // Ensure voters array is properly set
              vote_count: record.vote_count || voters.length || 0,
              expand: record.expand ? {
                participant: record.expand.participant,
                challenge: record.expand.challenge,
                sender: record.expand.sender || record.expand.participant
              } : undefined
            };
          }) as VideoSubmissionModel[];
          setVideoSubmissions(typedSubmissions);
        }
      } catch (error) {
        if (isMounted) console.error('Error fetching video submissions:', error);
      } finally {
        if (isMounted) setIsLoadingSubmissions(false);
      }
    };
    
    fetchVideoSubmissions();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [challenge.id, dataVersion]);
  
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !auth.user || !challenge.chat) return;
    
    try {
      const result = await sendMessage(challenge.chat, messageInput.trim());
      if (result.success) {
        setMessageInput("");
        // Fetch updated messages after sending
        const messagesResult = await getChatMessages(challenge.chat);
        if (messagesResult.success && Array.isArray(messagesResult.messages)) {
          const sortedMessages = messagesResult.messages.map(record => ({
            id: record.id,
            text: record.text || '',
            sender: record.sender || '',
            chat: record.chat || '',
            created: record.created || new Date().toISOString(),
            updated: record.updated || new Date().toISOString(),
            expand: record.expand
          })).sort((a, b) => 
            new Date(a.created).getTime() - new Date(b.created).getTime()
          );
          setMessages(sortedMessages);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  const handleJoinChallenge = async () => {
    if (!auth.user) {
      router.push('/signup')
      return
    }
    
    setIsJoining(true)
    setJoinError(null)
    
    try {
      // First check if the challenge is full in PocketBase
      const participantCount = challenge.participants ? challenge.participants.length : 0;
      const maxParticipants = challenge.maxparticipants || 0;
      
      console.log("PocketBase challenge limits:", {
        current: participantCount,
        max: maxParticipants
      });
      
      if (maxParticipants > 0 && participantCount >= maxParticipants) {
        setJoinError("This challenge is already at max capacity.");
        setIsJoining(false);
        return;
      }

      // Continue with on-chain join if available
      if (challenge.onchain_id) {
        // Your existing on-chain join code...
        console.log("Challenge on-chain ID:", challenge.onchain_id)
    
        try {
          const challengePublicKey = new PublicKey(challenge.onchain_id)
          console.log("Converting to PublicKey:", challengePublicKey.toString())
          
          // Call the on-chain function
          const onChainResult = await participateInChallenge(challenge.onchain_id)
          
          if (onChainResult.success) {
            console.log("On-chain join successful!")
            console.log("Transaction signature:", onChainResult.signature)
            setOnChainStatus(`Success! Tx: ${onChainResult.signature ? onChainResult.signature.slice(0, 8) : 'unknown'}...`)
            toast.success("Successfully joined on-chain")
          } else {
            console.error("On-chain join error:", onChainResult.error)
            setOnChainError(onChainResult.error || 'Unknown error')
            toast.error(`On-chain error: ${onChainResult.error}`)
            return // Stop if on-chain fails
          }
        } catch (error) {
          console.error("On-chain join error:", error)
          setOnChainError(error instanceof Error ? error.message : "Unknown error")
          toast.error(`On-chain error: ${error instanceof Error ? error.message : "Unknown error"}`)
          return // Stop if on-chain fails
        }
      } else {
        console.warn("No on-chain ID available for this challenge")
        setOnChainError("No on-chain ID available")
      }

      // 2. Then - Join off-chain in PocketBase
      const result = await joinChallenge(challenge.id, auth.user.id)
      if (!result.success) {
        setJoinError(result.error || 'Failed to join challenge')
      } else {
        // Refresh the page to show the updated challenge
        window.location.reload()
      }
    } catch (error) {
      setJoinError('Failed to join challenge')
      console.error("Join error:", error)
    } finally {
      setIsJoining(false)
    }
  }
  
  const handleReportChallenge = async () => {
    if (!auth.user) return;
    setIsReporting(true);
    setReportError(null);
    setReportSuccess(null);
    
    try {
      const result = await reportChallenge(challenge.id);
      if (!result.success) {
        setReportError(result.error || 'Failed to report challenge');
      } else {
        if (result.deleted) {
          setReportSuccess('Challenge has been removed due to multiple reports');
          // Redirect to home after a short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setReportSuccess(`Challenge reported successfully. Total reports: ${result.reportsCount}`);
        }
      }
    } catch (error) {
      setReportError('Failed to report challenge');
    } finally {
      setIsReporting(false);
    }
  };
  
  const handleLikeVideo = async (submissionId: string) => {
    if (!auth.user) return;
    
    try {
      const result = await likeVideoSubmission(submissionId);
      if (result.success && 'submission' in result && result.submission) {
        setVideoSubmissions(prevSubmissions => 
          prevSubmissions.map(sub => 
            sub.id === submissionId 
              ? { 
                  ...sub, 
                  likedBy: result.submission?.likedBy || [],
                  dislikedBy: result.submission?.dislikedBy || [],
                  likes: result.submission?.likedBy?.length || 0,
                  dislikes: result.submission?.dislikedBy?.length || 0
                } 
              : sub
          )
        );
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleDislikeVideo = async (submissionId: string) => {
    if (!auth.user) return;
    
    try {
      const result = await dislikeVideoSubmission(submissionId);
      if (result.success && 'submission' in result && result.submission) {
        setVideoSubmissions(prevSubmissions => 
          prevSubmissions.map(sub => 
            sub.id === submissionId 
              ? { 
                  ...sub, 
                  likedBy: result.submission?.likedBy || [],
                  dislikedBy: result.submission?.dislikedBy || [],
                  likes: result.submission?.likedBy?.length || 0,
                  dislikes: result.submission?.dislikedBy?.length || 0
                } 
              : sub
          )
        );
      }
    } catch (error) {
      console.error('Error disliking video:', error);
    }
  };
  const isRegistrationOpen = () => {
  const now = new Date();
  const registrationEnd = new Date(challenge.registration_ends);
  return now < registrationEnd;
};
  const isVotingOpen = () => {
    const now = new Date();
    const votingEnd = new Date(challenge.voting_end);
    return now < votingEnd;
  };
  
  const handleFinalizeChallenge = async () => {
    if (!auth.user || !challenge.onchain_id || isFinalizing) {
      return;
    }
    
    setIsFinalizing(true);
    setFinalizeError(null);
    setFinalizeSuccess(null);
    
    try {
      const result = await finalizeChallenge(challenge.onchain_id);
      
      if (result.success) {
        let successMsg = "Challenge finalized successfully!";
        if (result.winner && result.winningVotes) {
          successMsg += ` Winner: ${result.winner.substring(0, 8)}... with ${result.winningVotes} votes`;
        }
        
        setFinalizeSuccess(successMsg);
        toast.success("Challenge finalized successfully!");
        setDataVersion(v => v + 1);
      } else {
        setFinalizeError(result.error || "Failed to finalize challenge");
        toast.error(result.error || "Failed to finalize challenge");
      }
    } catch (error) {
      console.error("Error in finalizeChallenge:", error);
      setFinalizeError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!auth.user) {
      toast.error("Please sign in to vote");
      return;
    }
    
    console.log("🔍 Vote button clicked for submission:", submissionId);
    
    try {
      setIsVoting(true);
      setVoteError(null);
      
      const submission = videoSubmissions.find(sub => sub.id === submissionId);
      if (!submission) {
        setVoteError('Submission not found');
        toast.error('Submission not found');
        setIsVoting(false);
        return;
      }
  
      console.log("🔍 Submission found:", {
        id: submission.id,
        onchain_id: submission.onchain_id || "missing",
        description: submission.description?.substring(0, 20)
      });
      
      // Check if challenge has onchain_id
      if (!challenge.onchain_id) {
        toast.error("Challenge is not registered on-chain");
        setVoteError("On-chain voting not available for this challenge");
        setIsVoting(false);
        return;
      }
      
      // Use challenge onchain_id for the transaction and create a deterministic submission ID
      // Instead of generating a complex key, we'll use the submission ID hashed with the challenge ID
      const submissionReference = new PublicKey(challenge.onchain_id);
      
      console.log("🔍 Preparing to vote on-chain:", {
        challengeId: challenge.onchain_id,
        submissionId: submissionReference.toString(),
        fee: challenge.voting_fee
      });
      
      // Show a pre-transaction notification to the user
      toast.info(`Please approve the transaction in your wallet (fee: ${challenge.voting_fee} CPT)...`);
      
      // Call the voteForSubmissionOnChain function with challenge and submission IDs
      console.log("🔍 About to call voteForSubmissionOnChain");
      const onChainResult = await voteForSubmissionOnChain(
        challenge.onchain_id, 
        submissionReference.toString()
      );
      
      console.log("🔍 voteForSubmissionOnChain result:", onChainResult);
      
      if (!onChainResult.success) {
        setVoteError(onChainResult.error || 'On-chain voting failed');
        toast.error(onChainResult.error || 'On-chain voting failed');
        setIsVoting(false);
        return;
      }
      
      toast.success(`Vote recorded! Transaction: ${onChainResult.signature?.substring(0, 8)}...`);
  
      // After successful on-chain vote, update the database
      const result = await voteForSubmission(submissionId, auth.user.id);
      if (!result.success) {
        toast.warning("On-chain vote succeeded but couldn't update database");
        setVoteError(result.error || 'Failed to update database record');
      } else {
        // Update local state with new vote count
        setVideoSubmissions(prevSubmissions => 
          prevSubmissions.map(sub => {
            if (sub.id === submissionId) {
              return {
                ...sub, 
                voters: [...(sub.voters || []), auth.user!.id],
                vote_count: (sub.vote_count || 0) + 1
              };
            }
            return sub;
          })
        );
      }
    } catch (error) {
      console.error('🔍 Error voting:', error);
      setVoteError('Failed to vote. Please try again.');
      toast.error('Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };
  
  const isParticipant = auth.user && challenge.participants.includes(auth.user.id);
  const isVoter = auth.user && videoSubmissions.some(submission => submission.voters?.includes(auth.user!.id));
  
  // Add this function at the component level to check if user has voted in this challenge
  const hasVotedInChallenge = (userId: string) => {
    return videoSubmissions.some(submission => 
      submission.voters?.includes(userId)
    );
  };

  // First, add a helper function at the component level
  const hasUserVotedInChallenge = useCallback((userId?: string) => {
    if (!userId) return false;
    
    // Log for debugging
    console.log("Checking if user has voted:", userId);
    console.log("Available submissions:", videoSubmissions.length);
    console.log("Voter lists:", videoSubmissions.map(s => ({id: s.id, voters: s.voters})));
    
    // Check all submissions for this user's vote
    return videoSubmissions.some(submission => 
      Array.isArray(submission.voters) && submission.voters.includes(userId)
    );
  }, [videoSubmissions]);

    const handleFinalizeVoting = async () => {
  console.log("Finalize Voting button clicked", {
    auth: !!auth.user, 
    isCreator, 
    challengeId: challenge.onchain_id,
    isFinalizingVoting
  });
  
  if (!auth.user || !isCreator || !challenge.onchain_id) {
    console.log("Early return condition triggered", {
      auth: !!auth.user,
      isCreator,
      challengeId: challenge.onchain_id
    });
    return;
  }
  
  setIsFinalizingVoting(true);
  setFinalizeVotingError(null);
  setFinalizeVotingSuccess(null);
  
  try {
    console.log("Starting voting treasury distribution for challenge:", challenge.onchain_id);
    
    // Call the function to distribute the voting treasury
    const result = await finalizeVotingTreasury(challenge.onchain_id);
    console.log("Finalize voting result:", result);
    
    if (result.success) {
      setFinalizeVotingSuccess(
        `Successfully distributed voting treasury to ${result.processed} out of ${result.total} voters!`
      );
      toast.success(`Voting treasury distribution complete: ${result.processed}/${result.total} voters rewarded`);
    } else {
      setFinalizeVotingError(result.error || "Failed to distribute voting treasury");
      toast.error(result.error || "Failed to distribute voting treasury");
    }
  } catch (error) {
    console.error("Error finalizing voting:", error);
    setFinalizeVotingError("An unexpected error occurred");
    toast.error("An unexpected error occurred");
  } finally {
    setIsFinalizingVoting(false);
  }
};

  // Add this helper function to extract video ID and platform
  const getEmbedUrl = (url: string) => {
    try {
      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtube.com') 
          ? url.split('v=')[1]?.split('&')[0]
          : url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      // Twitter
      else if (url.includes('twitter.com')) {
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      }
      // Instagram
      else if (url.includes('instagram.com')) {
        return `https://www.instagram.com/embed/${url.split('/p/')[1]?.split('/')[0]}`;
      }
      // TikTok
      else if (url.includes('tiktok.com')) {
        return `https://www.tiktok.com/embed/${url.split('/video/')[1]}`;
      }
      // Return original URL if no matches
      return url;
    } catch {
      return url;
    }
  };

  const isFull = challenge.maxparticipants > 0 && challenge.participants.length >= challenge.maxparticipants;

  // Add this useEffect after your other useEffects
  useEffect(() => {
    let isMounted = true;
    
    const fetchTreasuryBalance = async () => {
      if (!challenge.onchain_id) return;
      
      setLoadingBalance(true);
      try {
        const result = await getTreasuryBalance(challenge.onchain_id);
        if (isMounted) {
          setTreasuryBalance(result);
          console.log("Treasury balance:", result);
        }
      } catch (error) {
        console.error('Error fetching treasury balance:', error);
        if (isMounted) {
          setTreasuryBalance({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch treasury balance'
          });
        }
      } finally {
        if (isMounted) {
          setLoadingBalance(false);
        }
      }
    };
    
    fetchTreasuryBalance();
    
    // Set up polling to refresh the balance every 30 seconds
    const intervalId = setInterval(fetchTreasuryBalance, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [challenge.onchain_id, getTreasuryBalance]);

  // Add this useEffect after your existing treasury balance useEffect
  useEffect(() => {
    let isMounted = true;
    
    const fetchVotingTreasuryBalance = async () => {
      if (!challenge.onchain_id) return;
      
      setLoadingVotingBalance(true);
      try {
        const result = await getVotingTreasuryBalance(challenge.onchain_id);
        if (isMounted) {
          setVotingTreasuryBalance(result);
          console.log("Voting treasury balance:", result);
        }
      } catch (error) {
        console.error('Error fetching voting treasury balance:', error);
        if (isMounted) {
          setVotingTreasuryBalance({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch voting treasury balance'
          });
        }
      } finally {
        if (isMounted) {
          setLoadingVotingBalance(false);
        }
      }
    };
    
    fetchVotingTreasuryBalance();
    
    // Set up polling to refresh the balance every 30 seconds
    const intervalId = setInterval(fetchVotingTreasuryBalance, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [challenge.onchain_id, getVotingTreasuryBalance]);

  // Add this new useEffect to calculate time remaining and check if challenge can be finalized
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      
      // Parse voting end date - check if it's a string or Date object
      const votingEnd = typeof challenge.voting_end === 'string' 
        ? new Date(challenge.voting_end) 
        : challenge.voting_end;
      
      if (!votingEnd) return "Unknown";
      
      // Calculate time difference
      const diff = votingEnd.getTime() - now.getTime();
      
      // If voting has ended
      if (diff <= 0) {
        setCanFinalize(true);
        setChallengeState("votingEnded");
        return "Challenge has ended"; // Improved message
      }
      
      // Calculate remaining time
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        return `${days}d ${hours}h remaining`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s remaining`;
      } else {
        return `${seconds}s remaining`;
      }
    };
    
    // Update time remaining initially
    setTimeRemaining(calculateTimeRemaining());
    
    // Update time remaining every second
    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [challenge.voting_end, isCreator, isFinalizing, canFinalize, challengeState, finalizeSuccess]);

  // Add this function near your other state variables and functions
const hasVotingPeriodEnded = useMemo(() => {
  if (!challenge.voting_end) return false;
  const endTime = new Date(challenge.voting_end);
  return new Date() > endTime;
}, [challenge.voting_end]);

  // Add this function in your component
const getChallengeStatus = () => {
  if (!challenge.voting_end) return "active";
  
  const now = new Date();
  const votingEnd = new Date(challenge.voting_end);
  
  if (now >= votingEnd) {
    // Check if we have a winner set
    if (challenge.winner) {
      return "completed";
    } else {
      return "finalizing";
    }
  } else {
    return "active";
  }
};

// Add this helper function near your other utility functions
const isSubmissionPeriodOpen = () => {
  const now = new Date();
  const votingEnd = new Date(challenge.submission_end);
  return now < votingEnd;
};

// Add this helper function near your other helper functions
const hasUserSubmittedVideo = (userId: string | undefined) => {
  if (!userId) return false;
  return videoSubmissions.some(submission => 
    (typeof submission.participant === 'string' && submission.participant === userId) || 
    (typeof submission.sender === 'string' && submission.sender === userId)
  );
};

// In your render method
const status = getChallengeStatus();

// Add this to your state declarations in ChallengeDetails component
const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());

// Add this helper function
const toggleSubmissionExpand = (submissionId: string) => {
  setExpandedSubmissions(prev => {
    const newSet = new Set(prev);
    if (newSet.has(submissionId)) {
      newSet.delete(submissionId);
    } else {
      newSet.add(submissionId);
    }
    return newSet;
  });
};

// Add this state to manage voter addresses
const [voterAddresses, setVoterAddresses] = useState<{
  [key: string]: {
    pubkey: string;
    username: string;
    avatar?: string;
  }
}>({});

// First, update your useEffect that fetches voter data:

useEffect(() => {
  const fetchVoterData = async () => {
    const voterData: { [key: string]: { 
      pubkey: string;
      username: string;
      avatar?: string;
    }} = {};
    
    for (const submission of videoSubmissions) {
      if (expandedSubmissions.has(submission.id) && submission.voters) {
        for (const voterId of submission.voters) {
          try {
            // Only fetch if we don't already have this voter's data
            if (!voterData[voterId]) {
              const voter = await pb.collection('users').getOne(voterId);
              voterData[voterId] = {
                pubkey: voter.pubkey || 'No wallet address',
                username: voter.username || 'Anonymous',
                avatar: voter.avatar
              };
            }
          } catch (error) {
            voterData[voterId] = {
              pubkey: 'Address unavailable',
              username: 'Anonymous',
              avatar: undefined
            };
          }
        }
      }
    }
    
    setVoterAddresses(voterData);
  };

  fetchVoterData();
}, [expandedSubmissions, videoSubmissions]);

useEffect(() => {
  const checkChallengeStatus = () => {
    if (challenge.winner) {
      setIsFinalized(true);
    }
  };
  
  checkChallengeStatus();
}, [challenge]);

// Separate rendering logic for mobile and desktop
  if (isMobile) {
    return (
      <div className="flex flex-col p-2 max-w-full mx-auto">
        {/* 1. Action buttons at the top for mobile */}
        <div className="w-full mb-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button 
              className={`w-full ${
                isCreator || isParticipant || isJoining || isFull
                  ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#b3731d] hover:bg-[#b3731d]/90'
              }`}
              onClick={handleJoinChallenge}
              disabled={isCreator || isParticipant || isJoining || isFull}
            >
              {isJoining ? "Joining..." : !auth.user ? "Sign up to Join" : 
               (isCreator ? "Creator only" : isParticipant ? "Joined" : 
                isFull ? "Full" : `Join (${challenge.participation_fee} CPT)`)}
            </Button>
            
            <Button 
              variant="destructive"
              onClick={handleReportChallenge}
              disabled={isReporting || isCreator}
              className="w-full"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              {isReporting ? "..." : "Report"}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              className="w-full"
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={
                !isParticipant || 
                isCreator || 
                hasUserSubmittedVideo(auth.user?.id) || 
                !isSubmissionPeriodOpen()
              }
              title={
                !auth.user 
                  ? "Sign up to submit videos" 
                  : isCreator 
                    ? "You cannot submit videos to your own challenge" 
                    : !isParticipant 
                      ? "Join the challenge to submit videos"
                      : hasUserSubmittedVideo(auth.user?.id)
                        ? "You have already submitted a video to this challenge"
                        : !isSubmissionPeriodOpen()
                          ? "Submission period has ended"
                          : "Submit your video"
              }
            >
              <Video className="h-4 w-4 mr-1" />
              <span className="text-xs">
                {isCreator 
                  ? "Can't submit to own challenge"
                  : hasUserSubmittedVideo(auth.user?.id)
                    ? "Already submitted"
                    : !isSubmissionPeriodOpen()
                      ? "Submission Closed"
                      : `Submit Video (${FIXED_SUBMISSION_FEE} CPT)`}
              </span>
            </Button>
            
            {/* Creator Claim Reward Button - Only for creator after voting period ends */}
            {hasVotingPeriodEnded && isCreator && (
              <Button 
                className="w-full mb-4 bg-[#B3731D] hover:bg-[#B3731D]/90"
                onClick={async () => {
                  try {
                    setIsClaiming(true);
                    setClaimError(null);
                    
                    if (!challenge.onchain_id) {
                      toast.error("No on-chain ID available");
                      return;
                    }
                    
                    const result = await claimCreatorReward(challenge.onchain_id);
                    
                    if (result.success) {
                      toast.success("Successfully claimed creator rewards!");
                      setDataVersion(v => v + 1); // Refresh data
                      // Refresh treasury balance after claiming
                      const updatedBalance = await getTreasuryBalance(challenge.onchain_id);
                      setTreasuryBalance(updatedBalance);
                    } else {
                      toast.error(result.error || "Failed to claim rewards");
                      setClaimError(result.error || "Failed to claim rewards");
                    }
                  } catch (error) {
                    console.error("Error claiming creator reward:", error);
                    toast.error("An unexpected error occurred");
                    setClaimError("An unexpected error occurred");
                  } finally {
                    setIsClaiming(false);
                  }
                }}
                disabled={isClaiming || !challenge.onchain_id}
              >
                <Wallet className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {isClaiming ? "Claiming..." : "Claim Creator Reward"}
                </span>
              </Button>
            )}

            {claimError && (
              <div className="mb-4 text-red-500 text-sm p-2 bg-red-50 rounded-md border border-red-200">
                {claimError}
              </div>
            )}

            {/* Finalize Challenge button */}
            {hasVotingPeriodEnded && (isCreator || isParticipant) && (
              <Button 
                className={`w-full mb-4 ${
                  isFinalized 
                    ? 'bg-gray-400 hover:bg-gray-400' 
                    : hasVotingPeriodEnded 
                      ? 'bg-[#B3731D] hover:bg-[#B3731D]/90' 
                      : 'bg-gray-400'
                }`}
                onClick={handleFinalizeChallenge}
                disabled={
                  isFinalizing || 
                  !challenge.onchain_id || 
                  !hasVotingPeriodEnded || 
                  isFinalized
                }
                title={
                  isFinalized 
                    ? "Challenge already finalized"
                    : !challenge.onchain_id 
                      ? "Challenge doesn't have on-chain data" 
                      : !hasVotingPeriodEnded 
                        ? "Waiting for voting to end" 
                        : "Finalize Challenge"
                }
              >
                <Trophy className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {isFinalizing 
                    ? "Finalizing..." 
                    : isFinalized
                      ? "Challenge Finalized"
                      : !hasVotingPeriodEnded 
                        ? "Waiting for voting to end" 
                        : "Finalize Challenge"
                  }
                </span>
              </Button>
            )}

            {/* Distribute Voting Rewards button */}
            {hasVotingPeriodEnded && (isCreator || isParticipant) && (
              <Button 
                className="w-full mb-4 bg-[#B3731D] hover:bg-[#B3731D]/90"
                onClick={() => {
                  if (!finalizeVotingTreasury) {
                    console.error("finalizeVotingTreasury function not available");
                    return;
                  }
                  
                  // Set loading state
                  setIsFinalizingVoting(true);
                  
                  // Clean call without alerts or debug logs
                  finalizeVotingTreasury(challenge.onchain_id)
                    .then(result => {
                      console.log("Finalize voting result:", result);
                      if (result.success) {
                        setFinalizeVotingSuccess(
                          `Successfully distributed voting treasury to ${result.processed} out of ${result.total} voters!`
                        );
                      } else {
                        setFinalizeVotingError(result.error || "Failed to distribute voting treasury");
                      }
                    })
                    .catch(err => {
                      console.error("Error:", err);
                      setFinalizeVotingError(err.message || "Unknown error");
                    })
                    .finally(() => {
                      setIsFinalizingVoting(false);
                    });
                }}
                disabled={isFinalizingVoting || !challenge.onchain_id || !hasVotingPeriodEnded}
                title={
                  !challenge.onchain_id 
                    ? "Challenge doesn't have on-chain data" 
                    : !hasVotingPeriodEnded 
                      ? "Waiting for voting to end" 
                      : "Distribute Voting Rewards"
                }
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {isFinalizingVoting ? "Processing..." : "Distribute Voting Rewards"}
                </span>
              </Button>
            )}
          </div>
          
          {/* Error/Success messages */}
          {(joinError || finalizeError || finalizeSuccess) && (
            <div className="mt-2">
              {joinError && <div className="text-red-500 text-xs">{joinError}</div>}
              {finalizeError && <div className="text-red-500 text-xs">{finalizeError}</div>}
              {finalizeSuccess && <div className="text-green-500 text-xs">{finalizeSuccess}</div>}
            </div>
          )}
        </div>

        {/* 2. Challenge thumbnail */}
        <div className="w-full mb-4 border border-[#9A9A9A] rounded-xl overflow-hidden">
          <h1 className="text-xl font-bold text-[#4A4A4A] px-3 pt-3">{challenge.title}</h1>
          <div className="aspect-video relative mt-2">
            {challenge.challengevideo ? (
              <iframe
                src={getEmbedUrl(challenge.challengevideo)}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
              />
            ) : challenge.image ? (
              <Image
                src={imageUrl}
                alt={challenge.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Add this section in your ChallengeDetails component after the challenge title */}
        <div className="grid grid-cols-1 gap-2 mb-4">
          <DeadlineTimer 
            label="Registration Ends"
            date={challenge.registration_ends}
            icon={UserPlus}
          />
          <DeadlineTimer 
            label="Submission Ends"
            date={challenge.submission_end}
            icon={Video}
          />
          <DeadlineTimer 
            label="Voting Ends"
            date={challenge.voting_end}
            icon={Vote}
          />
        </div>
        
        {/* 3. Chat section */}
        <div className="w-full mb-4">
          <div className="border border-[#9A9A9A] rounded-xl flex flex-col h-[300px]">
            <div className="p-2 border-b border-[#9A9A9A]">
              <h2 className="font-semibold text-sm">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs">No messages yet</div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex flex-col ${
                        message.expand?.sender?.id === auth.user?.id ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Simplified message display for mobile */}
                      <div className="flex items-center gap-1 mb-1">
                        <Avatar className="h-4 w-4">
                          {message.expand?.sender?.avatar ? (
                            <Image
                              src={`https://api.coinpetitive.com/api/files/users/${message.expand.sender.id}/${message.expand.sender.avatar}`}
                              alt={message.expand.sender.username || 'User avatar'}
                              width={16}
                              height={16}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="text-[8px]">
                              {(message.expand?.sender?.username || 'A').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-xs text-gray-500">
                          {message.expand?.sender?.username || 'Anonymous'}
                        </span>
                      </div>
                      <div className={`rounded-xl px-3 py-1 max-w-[85%] text-xs ${
                        message.expand?.sender?.id === auth.user?.id 
                          ? 'bg-[#b3731d] text-white' 
                          : 'bg-gray-100'
                      }`}>
                        <p className="text-xs">{message.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-2 border-t border-[#9A9A9A]">
              <div className="flex gap-1">
                <Input 
                  placeholder={!auth.user ? "Sign in to chat" : (!isParticipant && !isCreator) ? "Join challenge to chat" : "Type..."}
                  className="rounded-full text-xs h-8"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && (isParticipant || isCreator)) {
                      handleSendMessage()
                    }
                  }}
                  disabled={!auth.user || (!isParticipant && !isCreator)}
                />
                <Button 
                  size="sm"
                  className="h-8 px-3"
                  onClick={handleSendMessage}
                  disabled={!auth.user || (!isParticipant && !isCreator)}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Challenge details and metadata */}
        <div className="w-full mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-2 text-sm">
            <div className="flex items-center gap-1 text-primary">
              <User className="h-4 w-4" />
              <span className="text-xs">{challenge.expand?.creator?.username || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Users className="h-4 w-4" />
              <span className="text-xs">
                {challenge.participants.length} participating • {challenge.minparticipants} min • {challenge.maxparticipants} max
              </span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Coins className="h-4 w-4" />
              <span className="text-xs">{challenge.reward} CPT</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Ticket className="h-4 w-4" />
              <span className="text-xs">{challenge.voting_fee} CPT</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded-lg">
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-xs text-gray-600">
              {challenge.description}
            </p>
          </div>
        </div>

        {/* 5. Video Submissions */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#4A4A4A] mb-2">Video Submissions</h2>
          
          {isLoadingSubmissions ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#b3731d]"></div>
            </div>
          ) : videoSubmissions.length > 0 ? (
            <div className="space-y-4">
              {videoSubmissions.map((submission) => (
              <div key={submission.id} className="flex flex-col border border-[#9A9A9A] rounded-xl p-3">
                {/* Submission creator info */}
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    {submission.expand?.participant?.avatar ? (
                      <Image
                        src={`https://api.coinpetitive.com/api/files/users/${submission.expand.participant.id}/${submission.expand.participant.avatar}`}
                        alt={submission.expand.participant.username || 'User avatar'}
                        width={20}
                        height={20}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {((submission.expand?.participant?.username || 'A')).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium text-xs">
                    {submission.expand?.participant?.username || 'Participant'}
                  </span>
                </div>
                
                {/* Video */}
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                  {submission.video && (
                    submission.video.startsWith('http') ? (
                      <iframe 
                        src={getEmbedUrl(submission.video)}
                        className="w-full h-full object-cover"
                        allowFullScreen
                        frameBorder="0"
                      />
                    ) : (
                      <video 
                        src={`https://api.coinpetitive.com/api/files/${submission.collectionId || 'video_submitted'}/${submission.id}/${submission.video}`}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                    )
                  )}
                </div>
                
                {/* Description and interactions */}
                <div className="mt-2">
                  <p className="text-xs text-gray-700 mb-2">
                    {submission.description}
                  </p>
                  
                  <div className="flex justify-start items-center gap-6 mt-2 pl-1">
                    <div className="flex items-center gap-1">
                      <ThumbsUp 
                        className={`h-5 w-5 cursor-pointer ${
                          auth.user?.id && Array.isArray(submission.likedBy) && submission.likedBy.includes(auth.user.id) 
                          ? 'text-[#B3731D] fill-[#B3731D]' 
                          : 'text-gray-500 hover:text-[#B3731D]'
                        }`}
                        onClick={() => handleLikeVideo(submission.id)}
                      />
                      <span className="text-sm">
                        {typeof submission.likes === 'number' ? submission.likes : 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown 
                        className={`h-5 w-5 cursor-pointer ${
                          auth.user?.id && Array.isArray(submission.dislikedBy) && submission.dislikedBy.includes(auth.user.id)
                          ? 'text-[#B3731D] fill-[#B3731D]' 
                          : 'text-gray-500 hover:text-[#B3731D]'
                        }`}
                        onClick={() => handleDislikeVideo(submission.id)}
                      />
                      <span className="text-sm">
                        {typeof submission.dislikes === 'number' ? submission.dislikes : 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {/* Vote button */}
                    {!auth.user ? (
                      <Button variant="default" size="sm" className="h-7 text-xs" disabled>Sign in</Button>
                    ) : hasUserVotedInChallenge(auth.user.id) ? (
                      <Button variant="default" size="sm" className="h-7 text-xs bg-gray-400" disabled>Already voted</Button>
                    ) : (
                      <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleVote(submission.id)}
                      disabled={isVoting || !isVotingOpen()}
                      className={`h-7 text-xs ${
                        isVoting 
                          ? 'bg-[#b3731d]/40' 
                          : !isVotingOpen() 
                            ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                            : 'bg-[#b3731d]'
                      }`}
                      title={
                        !isVotingOpen() 
                          ? "Voting period has ended" 
                          : `Vote for this submission (${challenge.voting_fee} CPT)`
                      }
                    >
                      {isVoting 
                        ? "..." 
                        : !isVotingOpen() 
                          ? "Voting Closed" 
                          : `Vote ${challenge.voting_fee} CPT`
                      }
                    </Button>
                  )}
                  </div>
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between text-xs text-gray-600"
                      onClick={() => toggleSubmissionExpand(submission.id)}
                    >
                      <span>Show Voters ({submission.voters?.length || 0})</span>
                      {expandedSubmissions.has(submission.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {expandedSubmissions.has(submission.id) && (
                      <div className="mt-2 space-y-2 bg-gray-50 rounded-md p-3">
                        {submission.voters && submission.voters.length > 0 ? (
                          submission.voters.map((voterId, index) => {
                            const voterData = voterAddresses[voterId];
                            
                            return (
                              <div key={index} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                  {voterData?.avatar ? (
                                    <Image
                                      src={`https://api.coinpetitive.com/api/files/users/${voterId}/${voterData.avatar}`}
                                      alt={voterData?.username || 'Voter avatar'}
                                      width={24}
                                      height={24}
                                      className="rounded-full object-cover"
                                    />
                                  ) : (
                                    <AvatarFallback className="text-xs">
                                      {(voterData?.username || 'A').charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex flex-col flex-1">
                                  <span className="text-sm font-medium">{voterData?.username || 'Loading...'}</span>
                                  <span className="text-xs font-mono text-gray-500 truncate">
                                    {voterData?.pubkey || 'Loading...'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500 text-center">No votes yet</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
              <Video className="h-8 w-8 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">No video submissions yet</p>
            </div>
          )}
        </div>
        
        <SubmitVideoDialog 
          open={isSubmitDialogOpen} 
          onOpenChange={setIsSubmitDialogOpen}
          challengeId={challenge.id}
          onChainId={challenge.onchain_id}
          participationFee={FIXED_SUBMISSION_FEE} // Use fixed fee instead of challenge.participation_fee
          onSubmitSuccess={() => {
            setDataVersion(v => v + 1);
            setIsSubmitDialogOpen(false);
          }}
        />
      </div>
    );
  }
  
  // Desktop layout - keep your existing code for desktop
  return (
    <div className="flex gap-6 p-4 max-w-[1200px] mx-auto">
      <div className="flex-1">
        <div className="border border-[#9A9A9A] rounded-xl overflow-hidden mb-4">
          <div className="aspect-video relative">
            {challenge.challengevideo ? (
              <iframe
                src={getEmbedUrl(challenge.challengevideo)}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : challenge.image ? (
              <Image
                src={imageUrl}
                alt={challenge.title}
                fill
                className="object-cover"
              />
            ) : (
              // Fallback when neither video nor image is available
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className="p-3 mb-6">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold text-[#4A4A4A]">{challenge.title}</h1>
            <div className="flex gap-2">
            <Button 
  className={`flex items-center ${
    isCreator || isParticipant || isJoining || isFull || !isRegistrationOpen()
      ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
      : 'bg-[#b3731d] hover:bg-[#b3731d]/90'
  }`}
  onClick={handleJoinChallenge}
  disabled={isCreator || isParticipant || isJoining || isFull || !isRegistrationOpen()}
  title={
    !auth.user 
      ? "Sign up to join this challenge" 
      : isCreator 
        ? "You cannot join your own challenge" 
        : isParticipant 
          ? "You are already a participant" 
          : isJoining 
            ? "Joining..." 
            : isFull
              ? "Challenge is full"
              : !isRegistrationOpen()
                ? "Registration period has ended"
                : "Join this challenge"
  }
>
  {isJoining 
    ? "Joining..." 
    : !auth.user
      ? "Sign up to Join"
      : isCreator 
        ? "Creator can't participate" 
        : isParticipant 
          ? "Already Joined"
          : isFull
            ? "Challenge Full"
            : !isRegistrationOpen()
              ? "Registration Closed"
              : `Join Challenge ${challenge.participation_fee} CPT`}
</Button>
              {joinError && (
                <div className="text-red-500 text-sm">{joinError}</div>
              )}
              <Button 
                variant="destructive"
                onClick={handleReportChallenge}
                disabled={isReporting || isCreator}
                className="flex items-center"
                title={isCreator ? "You cannot report your own challenge" : "Report this challenge"}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                {isReporting ? "Reporting..." : "Report"}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              <span>{challenge.expand?.creator?.username || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-2 text-primary" title="Current/Min-Max Participants">
              <Users className="h-5 w-5" />
              <span>
                {challenge.participants.length} participating • {challenge.minparticipants} min • {challenge.maxparticipants} max
              </span>
            </div>
            <div className="flex items-center gap-2 text-primary" title="Challenge Reward">
              <Coins className="h-5 w-5" />
              <span>{challenge.reward} CPT</span>
            </div>
            <div className="flex items-center gap-2 text-primary" title="Voting Fee">
              <Ticket className="h-5 w-5" />
              <span>{challenge.voting_fee} CPT</span>
            </div>
          </div>
          <p className="text-gray-600">
            {challenge.description}
          </p>

          {/* Keep error/status messages for user experience */}
          {(onChainStatus || onChainError) && (
            <div className="mt-2">
              {onChainStatus && (
                <div className="text-green-600 text-sm">{onChainStatus}</div>
              )}
              {onChainError && (
                <div className="text-red-600 text-sm">{onChainError}</div>
              )}
            </div>
          )}
        </div>

        {/* Add this section in your ChallengeDetails component after the challenge title */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <DeadlineTimer 
            label="Registration Ends"
            date={challenge.registration_ends}
            icon={UserPlus}
          />
          <DeadlineTimer 
            label="Submission Ends"
            date={challenge.submission_end}
            icon={Video}
          />
          <DeadlineTimer 
            label="Voting Ends"
            date={challenge.voting_end}
            icon={Vote}
          />
        </div>
      
        {/* Video Submissions */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">Video Submissions</h2>
          
          {isLoadingSubmissions ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#b3731d]"></div>
              <p className="mt-2 text-gray-500">Loading submissions...</p>
            </div>
          ) : videoSubmissions.length > 0 ? (
            <div className="space-y-4">
              {videoSubmissions.map((submission) => (
              <div key={submission.id} className="flex gap-4 border border-[#9A9A9A] rounded-xl p-4">
                <div className="w-full md:w-1/3 flex flex-col">
                <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden relative">
                  {submission.video && (
                    submission.video.startsWith('http') ? (
                      // For external URL videos, use iframe with embed URL
                      <iframe 
                        src={getEmbedUrl(submission.video)}
                        className="w-full h-full object-cover"
                        allowFullScreen
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      // Fallback for legacy directly uploaded videos
                      <video 
                        src={`https://api.coinpetitive.com/api/files/${submission.collectionId || 'video_submitted'}/${submission.id}/${submission.video}`}
                        className="w-full h-full object-cover rounded-xl"
                        controls
                      />
                    )
                  )}
                </div>
                {/* Like/Dislike buttons under thumbnail */}
                <div className="flex justify-start items-center gap-6 mt-2 pl-1">
                  <div className="flex items-center gap-1">
                  <ThumbsUp 
                    className={`h-5 w-5 cursor-pointer ${
                    Array.isArray(submission.likedBy) && auth.user?.id && submission.likedBy.includes(auth.user.id) 
                      ? 'text-[#B3731D] fill-[#B3731D]' 
                      : 'text-gray-500 hover:text-[#B3731D]'
                    }`}
                    onClick={() => handleLikeVideo(submission.id)}
                  />
                  <span className="text-sm">
                    {typeof submission.likes === 'number' ? submission.likes : 0}
                  </span>
                  </div>
                  <div className="flex items-center gap-1">
                  <ThumbsDown 
                    className={`h-5 w-5 cursor-pointer ${
                    Array.isArray(submission.dislikedBy) && auth.user?.id && submission.dislikedBy.includes(auth.user.id)
                      ? 'text-[#B3731D] fill-[#B3731D]' 
                      : 'text-gray-500 hover:text-[#B3731D]'
                    }`}
                    onClick={() => handleDislikeVideo(submission.id)}
                  />
                  <span className="text-sm">
                    {typeof submission.dislikes === 'number' ? submission.dislikes : 0}
                  </span>
                  </div>
                </div>
                </div>
                <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                  {submission.expand?.participant?.avatar ? (
                    <Image
                    src={`https://api.coinpetitive.com/api/files/users/${submission.expand.participant.id}/${submission.expand.participant.avatar}`}
                    alt={submission.expand.participant.username || 'User avatar'}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback>
                    {((submission.expand?.participant?.username || 'A')).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                  </Avatar>
                  <span className="font-medium text-sm">
                  {submission.expand?.participant?.username || 'Participant'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {submission.description}
                </p>
                <div className="text-xs text-gray-500 mb-auto">
                  Submitted {new Date(submission.created).toLocaleDateString()}
                </div>
                <div className="flex justify-end items-center gap-4 mt-4">
                    {!auth.user ? (
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-[#b3731d]/40 hover:bg-[#b3731d]/40 cursor-not-allowed"
                        disabled={true}
                        title="Sign in to vote"
                      >
                        Sign in to vote
                      </Button>
                    ) : hasUserVotedInChallenge(auth.user.id) ? (
                    <Button 
                        variant="default" 
                        size="sm"
                        className="bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white"
                        disabled={true}
                        title="You've already voted in this challenge"
                      >
                        Already voted in challenge
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleVote(submission.id)}
                        disabled={isVoting || !isVotingOpen()}
                        className={`${
                          isVoting 
                            ? 'bg-[#b3731d]/40 cursor-not-allowed' 
                            : !isVotingOpen()
                              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                              : 'bg-[#b3731d] hover:bg-[#b3731d]/90'
                        }`}
                        title={
                          !isVotingOpen() 
                            ? "Voting period has ended" 
                            : `Vote ${challenge.voting_fee} CPT`
                        }
                      >
                        {isVoting 
                          ? "Voting..." 
                          : !isVotingOpen() 
                            ? "Voting Closed" 
                            : `Vote ${challenge.voting_fee} CPT`
                        }
                      </Button>
                    )}
                </div>
                <div className="mt-4 border-t border-gray-200 pt-4 w-full">
    <Button
      variant="ghost"
      className="w-full flex items-center justify-between text-sm text-gray-600"
      onClick={() => toggleSubmissionExpand(submission.id)}
    >
      <span>Show Voters ({submission.voters?.length || 0})</span>
      {expandedSubmissions.has(submission.id) ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </Button>
    
    {expandedSubmissions.has(submission.id) && (
      <div className="mt-2 space-y-2 bg-gray-50 rounded-md p-3">
        {submission.voters && submission.voters.length > 0 ? (
          submission.voters.map((voterId, index) => {
            const voterData = voterAddresses[voterId];
            
            return (
              <div key={index} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  {voterData?.avatar ? (
                    <Image
                      src={`https://api.coinpetitive.com/api/files/users/${voterId}/${voterData.avatar}`}
                      alt={voterData?.username || 'Voter avatar'}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {(voterData?.username || 'A').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">{voterData?.username || 'Loading...'}</span>
                  <span className="text-xs font-mono text-gray-500 truncate">
                    {voterData?.pubkey || 'Loading...'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center">No votes yet</p>
        )}
      </div>
    )}
  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <Video className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No video submissions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-[320px] flex-shrink-0">
        <Button 
          className="w-full mb-4"
          onClick={() => setIsSubmitDialogOpen(true)}
          disabled={
            !isParticipant || 
            isCreator || 
            hasUserSubmittedVideo(auth.user?.id) || 
            !isSubmissionPeriodOpen()
          }
          title={
            !auth.user 
              ? "Sign up to submit videos" 
              : isCreator 
                ? "You cannot submit videos to your own challenge" 
                : !isParticipant 
                  ? "Join the challenge to submit videos"
                  : hasUserSubmittedVideo(auth.user?.id)
                    ? "You have already submitted a video to this challenge"
                    : !isSubmissionPeriodOpen()
                      ? "Submission period has ended"
                      : "Submit your video"
          }
        >
          <Video className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {isCreator 
              ? "Can't submit to own challenge"
              : hasUserSubmittedVideo(auth.user?.id)
                ? "Already submitted a video"
                : !isSubmissionPeriodOpen()
                  ? "Submission period ended"
                  : `Submit My Video (${FIXED_SUBMISSION_FEE} CPT)`}
          </span>
        </Button>


        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {timeRemaining && (
                <span className={`${canFinalize ? 'text-red-500' : 'text-green-500'}`}>
                  {timeRemaining}
                </span>
              )}
            </span>
          </div>
        </div>

        {finalizeError && (
          <div className="mt-2 mb-4 text-red-500 text-sm p-2 bg-red-50 rounded-md border border-red-200">
            {finalizeError}
          </div>
        )}
        {finalizeSuccess && (
          <div className="mt-2 mb-4 text-green-500 text-sm p-2 bg-green-50 rounded-md border border-green-200">
            {finalizeSuccess}
          </div>
        )}

        {/* Creator Claim Reward Button - Only for creator after voting period ends */}
        {hasVotingPeriodEnded && isCreator && (
          <Button 
            className="w-full mb-4 bg-[#B3731D] hover:bg-[#B3731D]/90"
            onClick={async () => {
              try {
                setIsClaiming(true);
                setClaimError(null);
                
                if (!challenge.onchain_id) {
                  toast.error("No on-chain ID available");
                  return;
                }
                
                const result = await claimCreatorReward(challenge.onchain_id);
                
                if (result.success) {
                  toast.success("Successfully claimed creator rewards!");
                  setDataVersion(v => v + 1); // Refresh data
                  // Refresh treasury balance after claiming
                  const updatedBalance = await getTreasuryBalance(challenge.onchain_id);
                  setTreasuryBalance(updatedBalance);
                } else {
                  toast.error(result.error || "Failed to claim rewards");
                  setClaimError(result.error || "Failed to claim rewards");
                }
              } catch (error) {
                console.error("Error claiming creator reward:", error);
                toast.error("An unexpected error occurred");
                setClaimError("An unexpected error occurred");
              } finally {
                setIsClaiming(false);
              }
            }}
            disabled={isClaiming || !challenge.onchain_id}
          >
            <Wallet className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {isClaiming ? "Claiming..." : "Claim Creator Reward"}
            </span>
          </Button>
        )}

        {claimError && (
          <div className="mb-4 text-red-500 text-sm p-2 bg-red-50 rounded-md border border-red-200">
            {claimError}
          </div>
        )}

        {hasVotingPeriodEnded && (isCreator || isParticipant) && (
          <Button 
            className={`w-full mb-4 ${hasVotingPeriodEnded ? 'bg-[#B3731D] hover:bg-[#B3731D]/90' : 'bg-gray-400'}`}
            onClick={handleFinalizeChallenge}
            disabled={isFinalizing || !challenge.onchain_id || !hasVotingPeriodEnded}
            title={
              !challenge.onchain_id 
                ? "Challenge doesn't have on-chain data" 
                : !hasVotingPeriodEnded 
                  ? "Waiting for voting to end" 
                  : "Finalize Challenge"
            }
          >
            <Trophy className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {isFinalizing 
                ? "Finalizing..." 
                : !hasVotingPeriodEnded 
                  ? "Waiting for voting to end" 
                  : "Finalize Challenge"
              }
            </span>
          </Button>
        )}

        {hasVotingPeriodEnded && (isCreator || isParticipant) && (
          <Button 
            className="w-full mb-4 bg-[#B3731D] hover:bg-[#B3731D]/90"
            onClick={() => {
              if (!finalizeVotingTreasury) {
                console.error("finalizeVotingTreasury function not available");
                return;
              }
              
              // Set loading state
              setIsFinalizingVoting(true);
              
              // Clean call without alerts or debug logs
              finalizeVotingTreasury(challenge.onchain_id)
                .then(result => {
                  console.log("Finalize voting result:", result);
                  if (result.success) {
                    setFinalizeVotingSuccess(
                      `Successfully distributed voting treasury to ${result.processed} out of ${result.total} voters!`
                    );
                  } else {
                    setFinalizeVotingError(result.error || "Failed to distribute voting treasury");
                  }
                })
                .catch(err => {
                  console.error("Error:", err);
                  setFinalizeVotingError(err.message || "Unknown error");
                })
                .finally(() => {
                  setIsFinalizingVoting(false);
                });
            }}
            disabled={isFinalizingVoting || !challenge.onchain_id || !hasVotingPeriodEnded}
            title={
              !challenge.onchain_id 
                ? "Challenge doesn't have on-chain data" 
                : !hasVotingPeriodEnded 
                  ? "Waiting for voting to end" 
                  : "Distribute Voting Rewards"
            }
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {isFinalizingVoting ? "Processing..." : "Distribute Voting Rewards"}
            </span>
          </Button>
        )}

{status === "completed" && (
  <div className="p-2 bg-green-50 border border-green-100 rounded-md">
    <div className="flex items-center gap-2">
      <CheckCircle className="h-4 w-4 text-green-500" />
      <span className="text-sm text-green-700">Challenge finalized</span>
    </div>
  </div>
)}

        <div className="border border-[#9A9A9A] rounded-xl flex flex-col h-[calc(100vh-200px)]">
          <div className="p-3 border-b border-[#9A9A9A]">
            <h2 className="font-semibold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm">No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex flex-col ${
                      message.expand?.sender?.id === auth.user?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        {message.expand?.sender?.avatar ? (
                          <Image
                            src={`https://api.coinpetitive.com/api/files/users/${message.expand.sender.id}/${message.expand.sender.avatar}`}
                            alt={message.expand.sender.username || 'User avatar'}
                            width={24}
                            height={24}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <AvatarFallback>
                            {(message.expand?.sender?.username || 'A').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-xs text-gray-500">
                        {message.expand?.sender?.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.created).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                      message.expand?.sender?.id === auth.user?.id 
                        ? 'bg-[#b3731d] text-white' 
                        : 'bg-gray-100'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-3 border-t border-[#9A9A9A]">
            <div className="flex gap-2">
              <Input 
                placeholder={
                  !auth.user 
                    ? "Sign in to chat" 
                    : (!isParticipant && !isCreator)
                      ? "Join challenge to chat" 
                      : "Type your message"
                } 
                className="rounded-full text-sm"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (isParticipant || isCreator)) {
                    handleSendMessage()
                  }
                }}
                disabled={!auth.user || (!isParticipant && !isCreator)}
              />
              <Button 
                size="sm"
                onClick={handleSendMessage}
                disabled={!auth.user || (!isParticipant && !isCreator)}
                title={
                  !auth.user 
                    ? "Sign in to chat" 
                    : (!isParticipant && !isCreator)
                      ? "Join challenge to chat" 
                      : "Send message"
                }
              >
                Send
              </Button>
            </div>
            {auth.user && !isParticipant && !isCreator && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Join the challenge to participate in the chat
              </p>
            )}
          </div>
        </div>

        <SubmitVideoDialog 
          open={isSubmitDialogOpen} 
          onOpenChange={setIsSubmitDialogOpen}
          challengeId={challenge.id}
          onChainId={challenge.onchain_id}  // Pass this property
          participationFee={FIXED_SUBMISSION_FEE} // Use fixed fee instead of challenge.participation_fee
          onSubmitSuccess={() => {
            setDataVersion(v => v + 1); // Trigger refresh after submission
            setIsSubmitDialogOpen(false);
          }}
        />
      </div>
    </div>
  )
}