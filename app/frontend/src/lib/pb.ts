import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

// User Model Type
export type UserModel = {
  id: string;
  email: string;
  username: string;
  xProfile: string;
  telegram: string;
  avatar?: string;
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
  id: string;
  title: string;
  category: string;
  participants: string[];
  maxparticipats: number;
  voters: string[];
  reward: number;
  description: string;
  keywords: string[];
  registration_ends: string;
  submission_end: string;
  voting_end: string;
  image?: string;
  challengevideo?: string; // Add this new field for the video file
  state: 'registration' | 'submission' | 'voting' | 'completed';
  creator: string;
  chat: string; // Chat ID
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

// Video submission type
// Update VideoSubmissionModel type to match schema
export type VideoSubmissionModel = {
  id: string;
  description: string;
  video: string;
  challenge: string;
  participant: string;
  sender: string;
  likes: number;       // Changed from string[] to number
  dislikes: number;    // Changed from string[] to number
  likedBy: string[];   // This remains an array (relation field)
  dislikedBy: string[]; // This remains an array (relation field)
  voters?: string[];
  votersCount?: number;
  created: string;
  updated: string;
  collectionId?: string;
  expand?: {
    participant: UserModel;
    challenge: ChallengeModel;
    sender?: UserModel;
    voters?: Array<{
      id: string;
      username: string;
      avatar?: string;
    }>;
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
export const getChatMessages = async (chatId: string) => {
  try {
    const messages = await pb.collection('messages').getList(1, 50, {
      filter: `chat = "${chatId}"`,
      sort: '+created',
      expand: 'sender'
    });
    
    return {
      success: true,
      messages: messages.items
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return {
      success: false,
      messages: []
    };
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

export async function signUp(data: {
  email: string;
  password: string;
  passwordConfirm: string;
  username: string;
  xProfile?: string;
  telegram?: string;
  avatar?: File;
}) {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });

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

// Challenge Functions
export async function createChallenge(data: {
  title: string;
  category: string;
  maxParticipants: number;
  reward: number;
  description: string;
  keywords: string[];
  registrationEnd: string;
  submissionEnd: string;
  votingEnd: string;
  image?: File;
  challengevideo?: File;
}) {
  try {
    if (!pb.authStore.model) {
      throw new Error('Must be authenticated to create challenge');
    }

    const chatRoom = await pb.collection('chat').create({
      messages: []
    });

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'keywords') {
        formData.append(key, JSON.stringify(value));
      } else if (value instanceof File) {
        // Map file field names to match the database schema
        const fileFieldMap: Record<string, string> = {
          'image': 'image',
          'challengevideo': 'challengevideo'
        };
        const dbFieldName = fileFieldMap[key] || key;
        formData.append(dbFieldName, value);
      } else if (value !== undefined) {
        // Map the field names to match the database schema
        const fieldMap: Record<string, string> = {
          'maxParticipants': 'maxparticipats',
          'registrationEnd': 'registration_ends',
          'submissionEnd': 'submission_end',
          'votingEnd': 'voting_end'
        };
        
        const dbFieldName = fieldMap[key] || key;
        formData.append(dbFieldName, value.toString());
      }
    });

    formData.append('creator', pb.authStore.model.id);
    formData.append('state', 'registration');
    formData.append('participants', JSON.stringify([]));
    formData.append('voters', JSON.stringify([]));
    formData.append('chat', chatRoom.id);

    const challenge = await pb.collection('challenges').create(formData);
    
    await pb.collection('chat').update(chatRoom.id, {
      challenge: challenge.id
    });

    return { success: true, challenge: challenge as unknown as ChallengeModel };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create challenge',
    };
  }
}

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

export function useAuth() {
  const model = pb.authStore.model;
  return {
    isAuthenticated: pb.authStore.isValid && !!model,
    user: model as unknown as UserModel | null,
    signOut: () => pb.authStore.clear(),
  };
}

// Submit a video for a challenge
export async function submitVideo(challengeId: string, data: { description: string, video: File }) {
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
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('video', data.video);
    formData.append('challenge', challengeId);
    formData.append('participant', userId);
    formData.append('sender', userId); // Add the sender field with the current user's ID
    formData.append('likes', '0');
    formData.append('dislikes', '0');
    
    // Create the video submission
    const submission = await pb.collection('video_submitted').create(formData);
    
    // Update the challenge to include this video submission in the video_submited relation
    await pb.collection('challenges').update(challengeId, {
      video_submited: submission.id
    });
    
    // Also update the user's videos_submitted relation
    const user = await pb.collection('users').getOne(userId);
    const userVideos = user.videos_submitted || [];
    
    await pb.collection('users').update(userId, {
      videos_submitted: submission.id
    });
    
    return { success: true, submission };
  } catch (error) {
    console.error('Error submitting video:', error);
    return { success: false, error: 'Failed to submit video' };
  }
}

// Get video submissions for a challenge
export async function getVideoSubmissions(challengeId: string, signal?: AbortSignal) {
  try {
    console.log('Fetching video submissions for challenge ID:', challengeId);
    
    // First check if the challenge has a direct video_submited relation
    let directSubmission = null;
    try {
      console.log('Attempting to fetch challenge with video_submited expansion');
      const challenge = await pb.collection('challenges').getOne(challengeId, {
        expand: 'video_submited,video_submited.participant,video_submited.sender',
        $cancelKey: `challenge-direct-video-${challengeId}-${Date.now()}`,
        signal
      });
      
      console.log('Challenge data received:', challenge);
      
      if (challenge.expand?.video_submited) {
        console.log('Direct video submission found:', challenge.expand.video_submited);
        // Check if the direct submission has a collectionId already
        const submissionCollectionId = challenge.expand.video_submited.collectionId || 
                                      challenge.expand.video_submited.$collectionId || 
                                      'video_submited';
        
        console.log('Direct submission collection ID:', submissionCollectionId);
        
        directSubmission = {
          ...challenge.expand.video_submited,
          collectionId: submissionCollectionId
        };
      } else {
        console.log('No direct video submission found in challenge.expand');
      }
    } catch (error) {
      // If the request was aborted, don't log it as an error
      if (error?.name !== 'AbortError') {
        console.error('Error checking for direct video submission:', error);
      }
    }
    
    // Try both collection names to see which one works
    let submissions: Record<string, any>[] = [];
    
    // First try with the exact same name as in the challenge relation
    try {
      console.log('Attempting to fetch from video_submitted collection (single t)');
      const videoSubmited = await pb.collection('video_submitted').getFullList({
        filter: `challenge="${challengeId}"`,
        sort: '-created',
        expand: 'participant,challenge,sender',
        $cancelKey: `video-submissions-${challengeId}-${Date.now()}-1`,
        signal
      });
      console.log('video_submitted collection results:', videoSubmited);
      console.log('Checking for sender data in results:', videoSubmited.map(item => ({
        id: item.id,
        sender: item.sender,
        senderExpand: item.expand?.sender
      })));
      
      // Add collection ID to each submission
      submissions = videoSubmited.map(item => ({
        ...item,
        collectionId: 'video_submitted'
      }));
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Error fetching from video_submitted:', error);
      }
    }
    
    // If no results, try with double t (video_submitted)
    if (submissions.length === 0) {
      try {
        console.log('Attempting to fetch from video_submitted collection (double t)');
        const videoSubmitted = await pb.collection('video_submitted').getFullList({
          filter: `challenge="${challengeId}"`,
          sort: '-created',
          expand: 'participant,challenge,sender',
          $cancelKey: `video-submissions-${challengeId}-${Date.now()}-2`,
          signal
        });
        console.log('video_submitted collection results:', videoSubmitted);
        console.log('Checking for sender data in results:', videoSubmitted.map(item => ({
          id: item.id,
          sender: item.sender,
          senderExpand: item.expand?.sender
        })));
        
        // Add collection ID to each submission
        submissions = videoSubmitted.map(item => ({
          ...item,
          collectionId: 'video_submitted'
        }));
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error fetching from video_submitted:', error);
        }
      }
    }
    
    // If still no results, try videos_submitted (plural)
    if (submissions.length === 0) {
      try {
        console.log('Attempting to fetch from videos_submitted collection (plural)');
        const videosSubmitted = await pb.collection('videos_submitted').getFullList({
          filter: `challenge="${challengeId}"`,
          sort: '-created',
          expand: 'participant,challenge,sender',
          $cancelKey: `video-submissions-${challengeId}-${Date.now()}-3`,
          signal
        });
        console.log('videos_submitted collection results:', videosSubmitted);
        console.log('Checking for sender data in results:', videosSubmitted.map(item => ({
          id: item.id,
          sender: item.sender,
          senderExpand: item.expand?.sender
        })));
        
        // Add collection ID to each submission
        submissions = videosSubmitted.map(item => ({
          ...item,
          collectionId: 'videos_submitted'
        }));
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error fetching from videos_submitted:', error);
        }
      }
    }
    
    console.log('Raw video submissions received:', submissions);
    console.log('Number of submissions found:', submissions.length);
    
    // Combine the direct submission with other submissions, avoiding duplicates
    let allSubmissions = [...submissions];
    if (directSubmission && !submissions.some(s => s.id === directSubmission.id)) {
      console.log('Adding direct submission to the list');
      allSubmissions.unshift(directSubmission);
    }
    
    console.log('Final submissions list:', allSubmissions);
    console.log('Final number of submissions:', allSubmissions.length);
    
    return { success: true, submissions: allSubmissions };
  } catch (error) {
    // If the request was aborted, don't log it as an error
    if (error?.name !== 'AbortError') {
      console.error('Error fetching video submissions:', error);
    }
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
    const likedBy = Array.isArray(submission.likedBy) ? submission.likedBy : [];
    const dislikedBy = Array.isArray(submission.dislikedBy) ? submission.dislikedBy : [];

    // Remove from dislikes if present
    const newDislikedBy = dislikedBy.filter((id: string) => id !== userId);
    const newLikedBy = likedBy.includes(userId) 
      ? likedBy.filter((id: string) => id !== userId) 
      : [...likedBy, userId];

    const likesDelta = likedBy.includes(userId) ? -1 : 1;
    const dislikesDelta = dislikedBy.includes(userId) ? -1 : 0;

    const updated = await pb.collection('video_submitted').update(submissionId, {
      likes: Math.max(0, (submission.likes || 0) + likesDelta),
      dislikes: Math.max(0, (submission.dislikes || 0) + dislikesDelta),
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy
    });

    return { success: true, submission: updated };
  } catch (error) {
    return handleError(error);
  }
};

// Updated dislike function
export const dislikeVideoSubmission = async (submissionId: string) => {
  try {
    if (!pb.authStore.model) throw new Error('User not authenticated');
    const userId = pb.authStore.model.id;

    const submission = await pb.collection('video_submitted').getOne(submissionId);
    const likedBy = Array.isArray(submission.likedBy) ? submission.likedBy : [];
    const dislikedBy = Array.isArray(submission.dislikedBy) ? submission.dislikedBy : [];

    // Remove from likes if present
    const newLikedBy = likedBy.filter((id: string) => id !== userId);
    const newDislikedBy = dislikedBy.includes(userId) 
      ? dislikedBy.filter((id: string) => id !== userId) 
      : [...dislikedBy, userId];

    const dislikesDelta = dislikedBy.includes(userId) ? -1 : 1;
    const likesDelta = likedBy.includes(userId) ? -1 : 0;

    const updated = await pb.collection('video_submitted').update(submissionId, {
      likes: Math.max(0, (submission.likes || 0) + likesDelta),
      dislikes: Math.max(0, (submission.dislikes || 0) + dislikesDelta),
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy
    });

    return { success: true, submission: updated };
  } catch (error) {
    return handleError(error);
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


export async function voteForSubmission(submissionId: string, userId: string) {
  try {
    const submission = await pb.collection('video_submitted').getOne(submissionId);
    const voters = submission.voters || [];
    
    // Check if user already voted
    if (voters.includes(userId)) {
      return {
        success: false,
        error: 'You have already voted for this submission'
      };
    }

    // Add user to voters array and increment votersCount
    const updatedSubmission = await pb.collection('video_submitted').update(submissionId, {
      voters: [...voters, userId],
      votersCount: (voters.length + 1) // Increment voters count
    });

    return {
      success: true,
      submission: updatedSubmission
    };
  } catch (error) {
    console.error('Error voting:', error);
    return {
      success: false,
      error: 'Failed to vote'
    };
  }
}