import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

// User Model Type
export type UserModel = {
  id: string;
  email: string;
  username: string;
  xProfile: string;
  telegram: string;
  createdChallenges: string[]; // Array of challenge IDs
  created: string;
  updated: string;
};

// Challenge Model Type
export type ChallengeModel = {
  id: string;
  title: string;
  category: string;
  participants: string[]; // Array of user IDs
  maxParticipants: number;
  voters: string[]; // Array of user IDs
  reward: number;
  description: string;
  keywords: string[];
  registrationEnd: string;
  submissionEnd: string;
  votingEnd: string;
  image?: string;
  state: 'registration' | 'submission' | 'voting' | 'completed';
  creator: string; // User ID
  created: string;
  updated: string;
};

// Auth Functions
export async function signIn(email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
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
}) {
  try {
    const record = await pb.collection('users').create(data);
    await signIn(data.email, data.password);
    
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
}) {
  try {
    if (!pb.authStore.model) {
      throw new Error('Must be authenticated to create challenge');
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'keywords') {
        formData.append(key, JSON.stringify(value));
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    formData.append('creator', pb.authStore.model.id);
    formData.append('state', 'registration');
    formData.append('participants', JSON.stringify([]));
    formData.append('voters', JSON.stringify([]));

    const challenge = await pb.collection('challenges').create(formData);
    return { success: true, challenge: challenge as unknown as ChallengeModel };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create challenge',
    };
  }
}

export async function getChallenge(id: string) {
  try {
    const record = await pb.collection('challenges').getOne(id, {
      expand: 'creator,participants,voters',
    });
    return { success: true, challenge: record as unknown as ChallengeModel };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get challenge',
    };
  }
}

export async function getChallenges() {
  try {
    const records = await pb.collection('challenges').getFullList({
      sort: '-created',
      expand: 'creator',
    });
    return { success: true, challenges: records as unknown as ChallengeModel[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get challenges',
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