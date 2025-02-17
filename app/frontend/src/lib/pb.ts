import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

export type AuthModel = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  xProfile: string;
  telegram: string;
  created: string;
  updated: string;
};

function isAuthModel(record: unknown): record is AuthModel {
  if (!record || typeof record !== 'object') return false;
  
  const requiredProps = ['id', 'username', 'email', 'avatar', 'xProfile', 'telegram', 'created', 'updated'];
  return requiredProps.every(prop => prop in record);
}

export async function signIn(email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    if (!isAuthModel(authData.record)) {
      throw new Error('Invalid user data received from server');
    }

    return {
      success: true,
      user: authData.record,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
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
    
    // Auto sign in after successful registration
    await signIn(data.email, data.password);

    // Transform the record to match AuthModel interface
    const user: AuthModel = {
      id: record.id,
      username: record.username,
      email: record.email,
      avatar: record.avatar,
      xProfile: record.xProfile || '',
      telegram: record.telegram || '',
      created: record.created,
      updated: record.updated,
    };

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export function signOut() {
  pb.authStore.clear();
}

// Hook to get current auth state
export function useAuth() {
  const model = pb.authStore.model;
  return {
    isAuthenticated: pb.authStore.isValid && !!model && isAuthModel(model),
    users: isAuthModel(model) ? model : null,
    signOut: () => pb.authStore.clear(),
  };
}

export type ChallengeModel = {
  id: string;
  challengetitle: string;
  category: string;
  participants: string[];
  maxparticipants: number;
  voters: string[];
  reward: number;
  description: string;
  keywords: string[];
  submission_end: string;
  voting_end: string;
  creator: string;
  created: string;
  updated: string;
  image?: string; // Optional image URL for the challenge
};

export interface CreateChallengeData {
  challengetitle: string;
  category: string;
  maxparticipants: number;
  reward: number;
  description: string;
  keywords: string[];
  submission_end: string;
  voting_end: string;
  image?: File;
}

export async function createChallenge(data: CreateChallengeData) {
  try {
    if (!pb.authStore.model) {
      throw new Error('User must be authenticated to create a challenge');
    }

    // Create FormData for file upload
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'keywords') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'submission_end' || key === 'voting_end') {
        // Ensure dates are in ISO string format
        const date = new Date(value);
        formData.append(key, date.toISOString());
      } else if (value !== undefined) {
        formData.append(key, value);
      }
    });

    formData.append('creator', pb.authStore.model.id);
    formData.append('participants', JSON.stringify([]));
    formData.append('voters', JSON.stringify([]));

    const challenge = await pb.collection('challenges').create(formData, {
      requestKey: 'create-challenge',
    });

    return {
      success: true,
      challenge
    };
  } catch (error) {
    if (error?.name !== 'AbortError') {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create challenge'
      };
    }
    return { success: false, error: 'Request cancelled' };
  }
}

export async function getChallenge(id: string) {
  try {
    const record = await pb.collection('challenges').getOne(id, {
      expand: 'creator,participants,voters',
      requestKey: `challenge-${id}`,
    });

    const challenge: ChallengeModel = {
      id: record.id,
      challengetitle: record.challengetitle,
      category: record.category,
      participants: record.participants || [],
      maxparticipants: record.maxparticipants,
      voters: record.voters || [],
      reward: record.reward,
      description: record.description,
      keywords: record.keywords || [],
      submission_end: record.submission_end,
      voting_end: record.voting_end,
      creator: record.expand?.creator?.username || record.creator,
      created: record.created,
      updated: record.updated,
      image: record.image,
    };

    return { success: true, challenge };
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Error getting challenge:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
    return { success: false, error: 'Request cancelled' };
  }
}

export async function getChallenges(signal?: AbortSignal) {
  try {
    const records = await pb.collection('challenges').getFullList({
      sort: '-created',
      expand: 'creator',
      signal,
    });

    const challenges: ChallengeModel[] = records.map(record => ({
      id: record.id,
      challengetitle: record.challengetitle,
      category: record.category,
      participants: record.participants || [],
      maxparticipants: record.maxparticipants,
      voters: record.voters || [],
      reward: record.reward,
      description: record.description,
      keywords: record.keywords || [],
      submission_end: record.submission_end,
      voting_end: record.voting_end,
      creator: record.expand?.creator?.username || record.creator,
      created: record.created,
      updated: record.updated,
      image: record.image,
    }));

    return { success: true, challenges };
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Error getting challenges:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
    return { success: false, error: 'Request cancelled' };
  }
}

export async function getUserChallenges(userId: string) {
  try {
    const challenges = await pb.collection('challenges').getFullList({
      filter: `creator = "${userId}" || participants ~ "${userId}"`,
      sort: '-created',
      expand: 'creator',
      requestKey: `user-challenges-${userId}`,
    });
    return { success: true, challenges };
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Error getting user challenges:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
    return { success: false, error: 'Request cancelled' };
  }
}

export async function participateInChallenge(challengeId: string) {
  try {
    if (!pb.authStore.model) {
      throw new Error('Must be authenticated to participate');
    }

    const userId = pb.authStore.model.id;
    const challenge = await pb.collection('challenges').getOne(challengeId, {
      requestKey: `participate-${challengeId}`,
    });
    
    // Check if user is already participating
    const participants = challenge.participants || [];
    if (participants.includes(userId)) {
      throw new Error('Already participating in this challenge');
    }

    // Check if challenge is full
    if (participants.length >= challenge.maxparticipants) {
      throw new Error('Challenge is full');
    }

    // Add user to participants
    const updatedParticipants = [...participants, userId];
    await pb.collection('challenges').update(challengeId, {
      participants: updatedParticipants,
    });

    return { success: true };
  } catch (error) {
    if (error?.name !== 'AbortError') {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to participate in challenge'
      };
    }
    return { success: false, error: 'Request cancelled' };
  }
}