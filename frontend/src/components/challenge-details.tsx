"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Wallet, Users, MessageCircle, Share2, Trophy, User, Coins, Ticket, AlertTriangle, ThumbsUp, ThumbsDown, Heart } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import mountImage from '@/assets/mount.png'
import { SubmitVideoDialog } from "@/components/submit-video-dialog"
import { getChatMessages, sendMessage, useAuth, type MessageModel, joinChallenge, getVideoSubmissions, reportChallenge, likeVideoSubmission, dislikeVideoSubmission, voteForSubmission, type VideoSubmissionModel, type ChallengeModel } from "@/lib/pb"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"


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
    ? `http://127.0.0.1:8090/api/files/challenges/${challenge.id}/${challenge.image}`
    : "/placeholder-image.png"
  const router = useRouter()
  const [dataVersion, setDataVersion] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const isCreator = auth.user?.id === challenge.creator;
  
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
        // Pass the abort signal to the getVideoSubmissions function
        const result = await getVideoSubmissions(challenge.id, controller.signal);
        
        if (!isMounted) return;
        
        if (result.success && Array.isArray(result.submissions)) {
          console.log('Video submissions from API:', result.submissions);
          // Map the PocketBase records to VideoSubmissionModel objects
          const typedSubmissions = result.submissions.map(record => {
            // Determine the correct collection ID
            const collectionId = record.collectionId || 
                                record.$collectionId || 
                                (record.expand?.video_submited ? 'video_submited' : 'video_submitted');
            
            console.log(`Mapping submission ${record.id} with collection ID: ${collectionId}`);
            console.log('Sender data:', record.sender, record.expand?.sender);
            console.log('Participant data:', record.participant, record.expand?.participant);
            console.log('Full record:', record);
            
            // Ensure sender field is properly set
            let senderField = record.sender;
            if (!senderField && record.participant) {
              console.log('No sender field, using participant as fallback');
              senderField = record.participant;
            }
            
            return {
              id: record.id,
              description: record.description || '',
              video: record.video || '',
              challenge: record.challenge || '',
              participant: record.participant || '',
              sender: senderField || '',
              likes: record.likes || [],
              dislikes: record.dislikes || [],
              created: record.created || new Date().toISOString(),
              updated: record.updated || new Date().toISOString(),
              collectionId: collectionId,
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
        if (!isMounted) return;
        console.error('Error fetching video submissions:', error);
      } finally {
        if (isMounted) {
          setIsLoadingSubmissions(false);
        }
      }
    };
    
    fetchVideoSubmissions();
    
    // Cleanup function to prevent memory leaks and cancel requests
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
      router.push('/signup');
      return;
    }
    
    setIsJoining(true);
    setJoinError(null);
    try {
      const result = await joinChallenge(challenge.id, auth.user.id);
      if (!result.success) {
        setJoinError(result.error || 'Failed to join challenge');
      } else {
        // Force a hard refresh of the page
        window.location.reload();
      }
    } catch (error) {
      setJoinError('Failed to join challenge');
    } finally {
      setIsJoining(false);
    }
  };
  
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
    
    const submission = videoSubmissions.find(sub => sub.id === submissionId);
    if (!submission) return;
    
    const userId = auth.user.id;
    if (submission.likes.includes(userId)) {
      console.log('User has already liked this submission.');
      return;
    }
    
    try {
      const result = await likeVideoSubmission(submissionId);
      if (result.success && result.submission) {
        setVideoSubmissions(prevSubmissions => 
          prevSubmissions.map(sub => 
            sub.id === submissionId 
              ? { 
                  ...sub, 
                  likes: result.submission.likes || [],
                  dislikes: result.submission.dislikes || []
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
    
    const submission = videoSubmissions.find(sub => sub.id === submissionId);
    if (!submission) return;
    
    try {
      const result = await dislikeVideoSubmission(submissionId);
      if (result.success && result.submission) {
        setVideoSubmissions(prevSubmissions => 
          prevSubmissions.map(sub => 
            sub.id === submissionId 
              ? { 
                  ...sub, 
                  likes: result.submission.likes || [],
                  dislikes: result.submission.dislikes || []
                } 
              : sub
          )
        );
      }
    } catch (error) {
      console.error('Error disliking video:', error);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!auth.user) return;
    
    try {
      setIsVoting(true);
      setVoteError(null);
      
      const submission = videoSubmissions.find(sub => sub.id === submissionId);
      if (!submission) {
        setVoteError('Submission not found');
        return;
      }
  
      const result = await voteForSubmission(submissionId, auth.user.id);
      if (!result.success) {
        setVoteError(result.error || 'Failed to vote');
      } else {
        // Update local state with new vote count
        setVideoSubmissions(prevSubmissions => 
          prevSubmissions.map(sub => {
            if (sub.id === submissionId) {
              const updatedSubmission: VideoSubmissionModel = {
                ...sub,
                voters: [...(sub.voters || []), auth.user!.id],
                vote_count: (sub.vote_count || 0) + 1,
                ...result.submission,
                expand: {
                  participant: sub.expand?.participant || result.submission?.expand?.participant || null,
                  challenge: sub.expand?.challenge || result.submission?.expand?.challenge || null,
                  sender: sub.expand?.sender || result.submission?.expand?.sender || null,
                }
              };
              return updatedSubmission;
            }
            return sub;
          })
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
      setVoteError('Failed to vote. Please try again.');
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
  const hasUserVotedInChallenge = (videoSubmissions: VideoSubmissionModel[], userId?: string) => {
    if (!userId) return false;
    return videoSubmissions.some(submission => 
      submission.voters?.includes(userId)
    );
  };

  // Add this helper function at the component level

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
                  isCreator || isParticipant || isJoining 
                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#b3731d] hover:bg-[#b3731d]/90'
                }`}
                onClick={handleJoinChallenge}
                disabled={isCreator || isParticipant || isJoining}
                title={
                  !auth.user 
                    ? "Sign up to join this challenge" 
                    : isCreator 
                      ? "You cannot join your own challenge" 
                      : isParticipant 
                        ? "You are already a participant" 
                        : isJoining 
                          ? "Joining..." 
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
                        : "Join Challenge 100 CPT"}
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
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <span>{challenge.participants.length}</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Coins className="h-5 w-5" />
              <span>{challenge.reward} CPT</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Ticket className="h-5 w-5" />
              <span>{challenge.voting_fee} CPT</span>
            </div>
          </div>
          <p className="text-gray-600">
            {challenge.description}
          </p>
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
                  <>
                    <video 
                    src={`http://127.0.0.1:8090/api/files/${submission.collectionId || 'video_submitted'}/${submission.id}/${submission.video}`}
                    className="w-full h-full object-cover rounded-xl"
                    controls
                    />
                  </>
                  )}
                </div>
                {/* Like/Dislike buttons under thumbnail */}
                <div className="flex justify-start items-center gap-6 mt-2 pl-1">
                  <div className="flex items-center gap-1">
                  <ThumbsUp 
                    className={`h-5 w-5 cursor-pointer ${
                    Array.isArray(submission.likes) && submission.likes.includes(auth.user?.id) 
                      ? 'text-primary fill-primary' 
                      : 'text-gray-500 hover:text-primary'
                    }`}
                    onClick={() => handleLikeVideo(submission.id)}
                  />
                  <span className="text-sm">
                    {Array.isArray(submission.likes) ? submission.likes.length : 0}
                  </span>
                  </div>
                  <div className="flex items-center gap-1">
                  <ThumbsDown 
                    className={`h-5 w-5 cursor-pointer ${
                    Array.isArray(submission.dislikes) && submission.dislikes.includes(auth.user?.id)
                      ? 'text-primary fill-primary' 
                      : 'text-gray-500 hover:text-primary'
                    }`}
                    onClick={() => handleDislikeVideo(submission.id)}
                  />
                  <span className="text-sm">
                    {Array.isArray(submission.dislikes) ? submission.dislikes.length : 0}
                  </span>
                  </div>
                </div>
                </div>
                <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                  {submission.expand?.participant?.avatar ? (
                    <Image
                    src={`http://127.0.0.1:8090/api/files/users/${submission.expand.participant.id}/${submission.expand.participant.avatar}`}
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
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-[#b3731d]" />
                  <span className="text-sm text-gray-600">
                    {submission.vote_count || 0} votes
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
                    ) : !isParticipant ? (
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white"
                        disabled={true}
                        title="Join challenge to vote"
                      >
                        Join to vote
                      </Button>
                    ) : isVoter ? (
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white"
                        disabled={true}
                        title="You've already voted in this challenge"
                      >
                        Already a voter in this challenge
                      </Button>
                    ) : hasUserVotedInChallenge(videoSubmissions, auth.user?.id) ? (
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
                        disabled={isVoting}
                        className={`${
                          isVoting 
                            ? 'bg-[#b3731d]/40 cursor-not-allowed' 
                            : 'bg-[#b3731d] hover:bg-[#b3731d]/90'
                        }`}
                        title={`Vote ${challenge.voting_fee} CPT`}
                      >
                        {isVoting ? "Voting..." : `Vote ${challenge.voting_fee} CPT`}
                      </Button>
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
          disabled={!isParticipant || isCreator}
          title={
            !auth.user 
              ? "Sign up to submit videos" 
              : isCreator 
                ? "You cannot submit videos to your own challenge" 
                : !isParticipant 
                  ? "Join the challenge to submit videos" 
                  : "Submit your video"
          }
        >
          <Video className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {isCreator 
              ? "Can't submit to own challenge"
              : "Submit My Video (5 $CPT)"}
          </span>
        </Button>

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
                            src={`http://127.0.0.1:8090/api/files/users/${message.expand.sender.id}/${message.expand.sender.avatar}`}
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
          onSubmitSuccess={() => {
            setDataVersion(v => v + 1); // Trigger refresh after submission
            setIsSubmitDialogOpen(false);
          }}
        />
      </div>
    </div>
  )
}
