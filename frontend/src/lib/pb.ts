import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090/');

// User Model Type
export type UserModel = {
  id: string;
  email: string;
  username: string;
  xProfile: string;
  telegram: string;
  avatar?: string;
  pubkey?: string; // Add this line for Solana wallet address
  createdChallenges: string[]; // Array of challenge IDs
  created: string;
  updated: string;
};

// Challenge Model Type
// Update Challenge Model Type to include chat



export type MessageModel = {
  id: string;
  text: string;
  sender: string;
  chat: string;
  created: string;
  updated: string;
  expand?: {
    sender?: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
};
export type ChatModel = {
  id: string;
  challenge: string;
  messages: string[];
  created: string;
  updated: string;
  expand?: {
    messages: MessageModel[];
    challenge: ChallengeModel;
  };
};

// Update ChallengeModel to include chat
export type ChallengeModel = {
  winner: any;
  id: string;
  title: string;
  category: string;
  participants: string[];
  minparticipants: number;
  maxparticipants: number;
  minvoters: number;
  maxvoters: number;
  voters: string[];
  reward: number;
  description: string;
  keywords: string[];
  registration_ends: Date; // Change to string since PocketBase stores dates as ISO strings
  submission_end: Date;
  voting_end: Date;
  voting_fee: number;
  participation_fee: number;
  image?: string;
  challengevideo?: string; // Changed from File to string for video URL
  state: 'registration' | 'submission' | 'voting' | 'completed';
  creator: string;
  chat: string; // Chat ID
  onchain_id : string;
  video_submited?: string;
  created: string;
  updated: string;
  expand?: {
    creator: UserModel;
    chat: ChatModel;
    video_submited?: VideoSubmissionModel;
  };
  reports?: string[];
};

interface VoteModel {
  id: string;
  voter: string;
  votecount: number;
}
// Video submission type
// Update VideoSubmissionModel type to match schema
export type VideoSubmissionModel = {
  id: string;
  description: string;
  video: string;
  challenge: string;
  participant: string[];
  sender: string;
  likes: number;       
  dislikes: number;    
  likedBy: string[];   
  dislikedBy: string[];
  votersCount?: number;
  vote_count: number;
  voters: string[];
  onchain_id: string;  
  created: string;
  updated: string;
  collectionId?: string;
  expand?: {
    participant?: {
      id: string;
      username: string;
      avatar?: string;
    };
    challenge?: ChallengeModel;
    sender?: {
      id: string;
      username: string;
      avatar?: string;
    };
    voters?: {
      [key: string]: {
        id: string;
        username: string;
        avatar?: string;
        pubkey?: string;
      }
    };
  };
};




// Add chat functions
export async function createChatForChallenge(challengeId: string) {
  try {
    const chat = await pb.collection('chat').create({
      challenge: challengeId,
      messages: []
    });
    return { success: true, chat };
  } catch (error) {
    return { success: false, error: 'Failed to create chat' };
  }
}

export async function sendMessage(chatId: string, text: string) {
  try {
    if (!pb.authStore.model) {
      throw new Error('Must be authenticated to send messages');
    }

    const message = await pb.collection('messages').create({
      text: text,  // Changed from content to text
      sender: pb.authStore.model.id,
      chat: chatId
    });

    return { success: true, message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    };
  }
}
export const getChatMessages = async (chatId: string, signal?: AbortSignal) => {
  try {
    const records = await pb.collection('messages').getFullList({
      filter: `chat="${chatId}"`,
      sort: 'created',
      expand: 'sender',
      signal, // Pass the AbortSignal
      $cancelKey: `chat-messages-${chatId}-${Date.now()}` // Add unique cancel key
    });
    
    return { success: true, messages: records };
  } catch (error) {
    // Ignore auto-cancellation errors
    if (error instanceof Error && error.message.includes('autocancelled')) {
      return { success: true, messages: [] };
    }
    console.error('Error fetching messages:', error);
    return { success: false, error: 'Failed to fetch messages' };
  }
};
// Add a simple event system
const listeners = new Set<() => void>();

export function subscribeToAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyAuthChange() {
  listeners.forEach(listener => listener());
}

// Auth Functions
export async function signIn(email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    notifyAuthChange(); // Notify listeners after successful sign in
    return {
      success: true,
      user: authData.record as unknown as UserModel,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign in',
    };
  }
}

// Update the signUp function in pb.ts to use the correct field name (code not secretCode)
export async function signUp(data: {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  xProfile?: string;
  telegram?: string;
  avatar?: File;
  pubkey?: string;
  secretCode: string; // Still accept secretCode from UI forms
}) {
  try {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('passwordConfirm', data.passwordConfirm);
    formData.append('code', data.secretCode); // Store as 'code' in the database
    
    if (data.xProfile) formData.append('xProfile', data.xProfile);
    if (data.telegram) formData.append('telegram', data.telegram);
    if (data.avatar) formData.append('avatar', data.avatar);
    if (data.pubkey) formData.append('pubkey', data.pubkey);

    const record = await pb.collection('users').create(formData);
    await signIn(data.email, data.password);
    notifyAuthChange(); // Notify listeners after successful sign up
    return {
      success: true,
      user: record as unknown as UserModel,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign up',
    };
  }
}

export function signOut() {
  pb.authStore.clear();
  notifyAuthChange();
  window.location.href = '/'; // Redirect to home page after signout
}


// Update createChallenge function to include creator
export const createChallenge = async (data: {
  title: string;
  category: string;
  minparticipants: number;
  maxparticipants: number;
  reward: number;
  description: string;
  keywords: string[];
  registration_end: number;
  registrationEnd: Date;
  submissionEnd: Date;
  votingEnd: Date;
  submission_end: number;
  voting_end: number;
  voting_fee: number;
  participation_fee: number;
  image?: File;
  challengevideo?: string;
  creator: string;
  minvoters: number;
  maxvoters: number;
  onchain_id: string; // This is now required and must be a string
}) => {
  try {
    if (!pb.authStore.model) {
      throw new Error('Must be authenticated to create a challenge');
    }

    const formData = new FormData();
    
    // Calculate dates based on days
    const now = new Date();
    const registrationEndDate = new Date(now.getTime() + (data.registration_end * 24 * 60 * 60 * 1000));
    const submissionEndDate = new Date(registrationEndDate.getTime() + (data.submission_end * 24 * 60 * 60 * 1000));
    const votingEndDate = new Date(submissionEndDate.getTime() + (data.voting_end * 24 * 60 * 60 * 1000));

    // Add all fields to formData
    formData.append('creator', pb.authStore.model.id);
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('maxparticipants', data.maxparticipants.toString());
    formData.append('minparticipants', data.minparticipants.toString());
    formData.append('minvoters', data.minvoters.toString());
    formData.append('maxvoters', data.maxvoters.toString());
    formData.append('reward', data.reward.toString());
    formData.append('description', data.description);
    formData.append('keywords', JSON.stringify(data.keywords));
    formData.append('registration_ends', data.registrationEnd.toISOString());
    formData.append('submission_end', data.submissionEnd.toISOString());
    formData.append('voting_end', data.votingEnd.toISOString());
    formData.append('voting_fee', data.voting_fee.toString());
    formData.append('participation_fee', data.participation_fee.toString());
    formData.append('onchain_id', data.onchain_id.toString());
    formData.append('state', 'registration'); // Set initial state
    
    // Add file fields if they exist
    if (data.image) {
      formData.append('image', data.image);
    }
    // Add video URL instead of file
    if (data.challengevideo) {
      formData.append('challengevideo', data.challengevideo);
    }

    // Create the challenge
    const challenge = await pb.collection('challenges').create(formData);

    // Update the user's challenges relation
    const user = await pb.collection('users').getOne(pb.authStore.model.id);
    const userChallenges = user.challenges || [];
    await pb.collection('users').update(pb.authStore.model.id, {
      challenges: [...userChallenges, challenge.id]
    });

    // Create a chat for the challenge
    const chatResult = await createChatForChallenge(challenge.id);
    if (chatResult.success && chatResult.chat) {
      // Update the challenge with the chat reference
      await pb.collection('challenges').update(challenge.id, {
        chat: chatResult.chat.id
      });
    }
    
    return { success: true, challenge };
  } catch (error) {
    console.error('Failed to create challenge:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create challenge' 
    };
  }
};

export async function joinChallenge(challengeId: string, userId: string) {
  try {
    // First, get the current challenge to access its participants
    const challenge = await pb.collection('challenges').getOne(challengeId);
    
    // Get current participants array or initialize empty array if it doesn't exist
    const currentParticipants = challenge.participants || [];
    
    // Check if user is already a participant
    if (currentParticipants.includes(userId)) {
      return {
        success: false,
        error: 'You are already a participant in this challenge'
      };
    }
    
    // Add the user to the participants array
    const updatedParticipants = [...currentParticipants, userId];
    
    // Update the challenge with the new participants array
    const updatedChallenge = await pb.collection('challenges').update(challengeId, {
      participants: updatedParticipants
    });
    
    return {
      success: true,
      challenge: updatedChallenge as unknown as ChallengeModel
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join the challenge'
    };
  }
}

// Add this function after the getChallenges function
export async function getChallenges(id?: string, signal?: AbortSignal) {
  const options = {
    expand: 'creator,chat,video_submited,video_submited.participant',
    $cancelKey: `challenges-request-${id || 'all'}-${Date.now()}`,
    signal
  };

  try {
    let challenges: any[] = [];
    
    if (id) {
      console.log('Fetching challenge with ID:', id);
      const record = await pb.collection('challenges').getOne(id, options);
      console.log('Raw challenge record:', record);
      
      // Check if video_submited is expanded correctly
      if (record.expand?.video_submited) {
        console.log('Video submission found:', record.expand.video_submited);
      } else {
        console.log('No video submission found in expand');
        
        // Try to fetch the video submission directly if it exists but isn't expanded
        if (record.video_submited) {
          try {
            const videoSubmission = await pb.collection('video_submitted').getOne(record.video_submited, {
              expand: 'participant',
              $cancelKey: `video-submission-${record.video_submited}-${Date.now()}`
            });
            
            // Manually add the expanded video submission
            if (!record.expand) record.expand = {};
            record.expand.video_submited = videoSubmission;
            console.log('Manually fetched video submission:', videoSubmission);
          } catch (error) {
            console.error('Error fetching video submission:', error);
          }
        }
      }
      
      challenges = [record];
    } else {
      challenges = await pb.collection('challenges').getFullList(options);
    }
    
    // Map the database field names to our model field names
    const mappedChallenges = challenges.map(challenge => {
      console.log('Challenge expand data:', challenge.expand);
      
      return {
        ...challenge,
        // Map fields for compatibility with our model
        maxParticipants: challenge.maxparticipats,
        registrationEnd: challenge.registration_ends,
        submissionEnd: challenge.submission_end,
        votingEnd: challenge.voting_end,
      };
    });
    
    return { 
      success: true, 
      challenges: mappedChallenges as unknown as ChallengeModel[] 
    };
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch challenges' 
    };
  }
}

// Improved function to clean up expired challenges with insufficient participants
export async function cleanupExpiredChallenges() {
  try {
    // Don't make network calls on the client-side during rendering
    if (typeof window === 'undefined') {
      return { success: true, deleted: 0 };
    }
    
    console.log('Starting challenge cleanup process...');
    
    // Get all challenges - simplified approach
    const allChallenges = await pb.collection('challenges').getFullList();
    console.log(`Retrieved ${allChallenges.length} total challenges`);
    
    const now = new Date();
    let deletedCount = 0;
    
    // Process each challenge individually
    for (const challenge of allChallenges) {
      try {
        // Check if registration has ended
        const registrationEnds = new Date(challenge.registration_ends);
        
        // If registration period is over and we don't have enough participants
        if (registrationEnds < now) {
          const participantsCount = Array.isArray(challenge.participants) ? challenge.participants.length : 0;
          const minRequired = challenge.minparticipats || 1;
          
          console.log(`Challenge ${challenge.id} (${challenge.title}): Registration ended on ${registrationEnds.toLocaleString()}, has ${participantsCount}/${minRequired} participants`);
          
          if (participantsCount < minRequired) {
            console.log(`🗑️ Deleting challenge ${challenge.id} due to insufficient participants`);
            
            try {
              await pb.collection('challenges').delete(challenge.id);
              deletedCount++;
              console.log(`✓ Challenge ${challenge.id} deleted successfully`);
            } catch (deleteError) {
              console.error(`Failed to delete challenge ${challenge.id}:`, deleteError);
            }
          }
        }
      } catch (challengeError) {
        console.error(`Error processing challenge ${challenge.id}:`, challengeError);
        // Continue with other challenges
      }
    }
    
    console.log(`Challenge cleanup complete. Deleted ${deletedCount} challenges.`);
    
    return { 
      success: true, 
      deleted: deletedCount
    };
  } catch (error) {
    console.error('Error in cleanup function:', error);
    // Return success to avoid breaking the main application flow
    return { success: true, deleted: 0 };
  }
}

export async function getUserChallenges(userId: string) {
  try {
    const records = await pb.collection('challenges').getFullList({
      filter: `creator = "${userId}" || participants ~ "${userId}"`,
      sort: '-created',
      expand: 'creator',
    });
    return { success: true, challenges: records as unknown as ChallengeModel[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user challenges',
    };
  }
}

// ... existing code ...

// Update the useAuth function to handle this edge case
export function useAuth() {
  const model = pb.authStore.model;
  
  // Check if the token is expired but we still have a model
  if (!pb.authStore.isValid && model) {
    // Try to refresh the token silently
    try {
      // This will attempt to refresh the session if needed
      pb.authStore.clear();
      console.log("Auth token was invalid but had a model - cleared invalid state");
    } catch (error) {
      console.error("Error handling expired auth:", error);
    }
  }
  
  return {
    isAuthenticated: pb.authStore.isValid && !!model,
    user: model as unknown as UserModel | null,
    signOut: () => pb.authStore.clear(),
  };
}


export async function submitVideo(challengeId: string, data: { 
  description: string, 
  videoUrl: string,
  onchain_id?: string
}) {
  try {
    if (!pb.authStore.model) {
      return { success: false, error: 'Must be authenticated to submit a video' };
    }
    
    const userId = pb.authStore.model.id;
    
    // Get the challenge to check if the user is a participant
    const challenge = await pb.collection('challenges').getOne(challengeId);
    
    const isParticipant = challenge.participants?.includes(userId);
    if (!isParticipant) {
      return { success: false, error: 'Only participants can submit videos' };
    }
    
    // Check if user has already submitted a video for this challenge
    // Fix: Use simpler filter and handle collection not found errors
    try {
      // Try to check without complex filtering
      const existingSubmissions = await pb.collection('video_submitted').getFullList({
        filter: `challenge="${challengeId}"`,
      });
      
      // Check if the current user has already submitted a video
      const alreadySubmitted = existingSubmissions.some(submission => 
        submission.sender === userId || 
        (Array.isArray(submission.participant) && submission.participant.includes(userId)) ||
        submission.participant === userId
      );
      
      if (alreadySubmitted) {
        return { success: false, error: 'You have already submitted a video to this challenge' };
      }
    } catch (filterError) {
      // If the collection doesn't exist or there's another error, continue anyway
      console.log("Error checking for existing submissions:", filterError);
    }
    
    // Create form data for submission
    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('video', data.videoUrl);
    formData.append('challenge', challengeId);
    formData.append('participant', userId); // This field might be an array in your schema
    formData.append('sender', userId);
    formData.append('likes', '0');
    formData.append('dislikes', '0');
    formData.append('vote_count', '0');
    formData.append('voters', '[]'); // Initialize with empty array
    
    // Add the onchain_id if it exists
    if (data.onchain_id) {
      formData.append('onchain_id', data.onchain_id);
    }
    
    // Create the video submission
    const submission = await pb.collection('video_submitted').create(formData);
    console.log("Video submission created:", submission);
    
    // Update the challenge to include this video submission
    await pb.collection('challenges').update(challengeId, {
      video_submited: submission.id
    });
    
    return { success: true, submission };
  } catch (error) {
    console.error('Error submitting video:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to submit video' };
  }
}


// Get video submissions for a challenge
export async function getVideoSubmissions(challengeId: string, signal?: AbortSignal) {
  try {
    const records = await pb.collection('video_submitted').getFullList({
      filter: `challenge="${challengeId}"`,
      sort: '-created',
      expand: 'participant,challenge,sender,voters', // Add voters to expansion
      $cancelKey: `video-submissions-${challengeId}-${Date.now()}`,
      signal
    });
    
    // Log the expanded data to verify
    console.log('Expanded submissions data:', records);
    
    return { success: true, submissions: records };
  } catch (error) {
    console.error('Error fetching video submissions:', error);
    return { success: false, error: 'Failed to fetch video submissions' };
  }
}

// Report a challenge
export async function reportChallenge(challengeId: string) {
  try {
    if (!pb.authStore.model) {
      throw new Error('Must be authenticated to report a challenge');
    }
    
    // Get the current challenge
    const challenge = await pb.collection('challenges').getOne(challengeId);
    
    // Check if reports field exists, if not initialize it
    let reports = challenge.reports || [];
    const userId = pb.authStore.model.id;
    
    // Check if user already reported
    if (reports.includes(userId)) {
      return { success: false, error: 'You have already reported this challenge' };
    }
    
    // Add user to reporters
    reports.push(userId);
    
    // Update the challenge with the new reporter
    const updated = await pb.collection('challenges').update(challengeId, {
      reports: reports
    });
    
    // If reports reach 10 or more, delete the challenge
    if (reports.length >= 10) {
      await pb.collection('challenges').delete(challengeId);
      return { success: true, deleted: true, message: 'Challenge has been removed due to multiple reports' };
    }
    
    return { success: true, reportsCount: reports.length };
  } catch (error) {
    console.error('Error reporting challenge:', error);
    return { success: false, error: 'Failed to report challenge' };
  }
}

// Updated like function
export const likeVideoSubmission = async (submissionId: string) => {
  try {
    if (!pb.authStore.model) throw new Error('User not authenticated');
    const userId = pb.authStore.model.id;

    const submission = await pb.collection('video_submitted').getOne(submissionId);
    
    // Get the current like/dislike arrays - make sure they're arrays
    let likedByIds = Array.isArray(submission.likedBy) ? [...submission.likedBy] : [];
    let dislikedByIds = Array.isArray(submission.dislikedBy) ? [...submission.dislikedBy] : [];
    
    // Check if the user already liked or disliked this submission
    const isLiked = likedByIds.includes(userId);
    const isDisliked = dislikedByIds.includes(userId);
    
    // Calculate the new state based on user action
    if (isLiked) {
      // If already liked, remove the like (toggle off)
      likedByIds = likedByIds.filter(id => id !== userId);
    } else {
      // Add a like
      likedByIds.push(userId);
      
      // Remove any existing dislike from this user
      if (isDisliked) {
        dislikedByIds = dislikedByIds.filter(id => id !== userId);
      }
    }
    
    // Update the submission with new arrays and count
    const updated = await pb.collection('video_submitted').update(submissionId, {
      likedBy: likedByIds,
      dislikedBy: dislikedByIds,
      likes: likedByIds.length,
      dislikes: dislikedByIds.length
    });
    
    return { 
      success: true,
      submission: {
        ...updated,
        likedBy: likedByIds,    // Keep these as arrays
        dislikedBy: dislikedByIds,
      }
    };
  } catch (error) {
    console.error('Error liking video:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to like video' 
    };
  }
};

// Updated dislike function
export const dislikeVideoSubmission = async (submissionId: string) => {
  try {
    if (!pb.authStore.model) throw new Error('User not authenticated');
    const userId = pb.authStore.model.id;

    const submission = await pb.collection('video_submitted').getOne(submissionId);
    
    // Get the current like/dislike arrays - make sure they're arrays
    let likedByIds = Array.isArray(submission.likedBy) ? [...submission.likedBy] : [];
    let dislikedByIds = Array.isArray(submission.dislikedBy) ? [...submission.dislikedBy] : [];
    
    // Check if the user already liked or disliked this submission
    const isLiked = likedByIds.includes(userId);
    const isDisliked = dislikedByIds.includes(userId);
    
    // Calculate the new state based on user action
    if (isDisliked) {
      // If already disliked, remove the dislike (toggle off)
      dislikedByIds = dislikedByIds.filter(id => id !== userId);
    } else {
      // Add a dislike
      dislikedByIds.push(userId);
      
      // Remove any existing like from this user
      if (isLiked) {
        likedByIds = likedByIds.filter(id => id !== userId);
      }
    }
    
    // Update the submission with new arrays and count
    const updated = await pb.collection('video_submitted').update(submissionId, {
      likedBy: likedByIds,
      dislikedBy: dislikedByIds,
      likes: likedByIds.length,
      dislikes: dislikedByIds.length
    });
    
    return { 
      success: true,
      submission: {
        ...updated,
        likedBy: likedByIds,    // Keep these as arrays
        dislikedBy: dislikedByIds,
      }
    };
  } catch (error) {
    console.error('Error disliking video:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to dislike video' 
    };
  }
};

// Helper function for error handling
const handleError = (error: unknown) => {
  console.error('Error:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Operation failed' 
  };
};

export const voteForSubmission = async (submissionId: string, userId: string) => {
  try {
    const submission = await pb.collection('video_submitted').getOne(submissionId);
    const currentVoters = submission.voters || [];
    const currentVoteCount = submission.vote_count || 0;

    // Update the submission with incremented vote count
    const updated = await pb.collection('video_submitted').update(submissionId, {
      voters: [...currentVoters, userId],
      vote_count: currentVoteCount + 1
    });

    return { success: true, submission: updated };
  } catch (error) {
    console.error('Error voting for submission:', error);
    return { success: false, error: 'Failed to vote for submission' };
  }
};

// Add these functions to handle profile updates and deletion
export const updateUserProfile = async (
  userId: string, 
  data: {
    username?: string;
    email?: string;
    xProfile?: string;
    telegram?: string;
    avatar?: File;
  }, 
  password: string
) => {
  try {
    // Verify password first
    await pb.collection('users').authWithPassword(
      pb.authStore.model?.email || '',
      password
    );

    const formData = new FormData();
    if (data.username) formData.append('username', data.username);
    if (data.email) formData.append('email', data.email);
    if (data.xProfile) formData.append('xProfile', data.xProfile);
    if (data.telegram) formData.append('telegram', data.telegram);
    if (data.avatar) formData.append('avatar', data.avatar);

    const record = await pb.collection('users').update(userId, formData);
    return { success: true, user: record };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    };
  }
};

export const deleteUserAccount = async (userId: string, password: string) => {
  try {
    // Verify password first
    await pb.collection('users').authWithPassword(
      pb.authStore.model?.email || '',
      password
    );

    await pb.collection('users').delete(userId);
    pb.authStore.clear();
    return { success: true };
  } catch (error) {
    console.error('Failed to delete account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account' 
    };
  }
};



// Create a simple function to change password directly if user knows their old password
export async function changePassword(oldPassword: string, newPassword: string) {
  try {
    if (!pb.authStore.model) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const userId = pb.authStore.model.id;
    
    // Verify old password first
    await pb.collection('users').authWithPassword(
      pb.authStore.model.email,
      oldPassword
    );
    
    // Update with new password
    await pb.collection('users').update(userId, {
      password: newPassword,
      passwordConfirm: newPassword
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to change password' 
    };
  }
}

// Add this new simpler function for password reset
export async function resetForgottenPassword(email: string, code: string, newPassword: string) {
  try {
    console.log('Resetting password for email:', email);
    
    // Get all users for debugging
    const allUsers = await pb.collection('users').getFullList();
    console.log('Available users:', allUsers.map(u => ({id: u.id, email: u.email})));
    
    // Find the user by email
    const users = allUsers.filter(u => 
      u.email && u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (users.length === 0) {
      console.log('No user found with email:', email);
      return { success: false, error: "No account found with this email" };
    }
    
    const user = users[0];
    console.log('Found user:', user.id);
    
    // Check if the recovery code matches
    const userCode = String(user.code || '').trim();
    const inputCode = String(code || '').trim();
    
    console.log('Comparing codes:', {userCode, inputCode});
    
    if (userCode !== inputCode) {
      console.log('Code mismatch');
      return { success: false, error: "Incorrect recovery code" };
    }
    
    console.log('Code verified, resetting password');
    
    // Reset the password
    await pb.collection('users').update(user.id, {
      password: newPassword,
      passwordConfirm: newPassword,
    });
    
    console.log('Password reset successful');
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reset password' 
    };
  }
}

// Add this new function for requesting a password reset
export async function requestPasswordReset(email: string) {
  try {
    // This automatically sends a password reset email with PocketBase
    await pb.collection('users').requestPasswordReset(email);
    
    return {
      success: true,
      message: "Password reset email sent"
    };
  } catch (error) {
    console.error("Failed to request password reset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send reset email"
    };
  }
}

// Update the confirmPasswordReset function to use PocketBase's functionality
export async function confirmPasswordReset(token: string, newPassword: string) {
  try {
    // Confirm the password reset with PocketBase
    await pb.collection('users').confirmPasswordReset(
      token, 
      newPassword, 
      newPassword // Confirm password
    );
    
    return {
      success: true,
      message: "Password reset successful"
    };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset password"
    };
  }
}

