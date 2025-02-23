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
  maxParticipants: number;
  voters: string[];
  reward: number;
  description: string;
  keywords: string[];
  registrationEnd: string;
  submissionEnd: string;
  votingEnd: string;
  image?: string;
  state: 'registration' | 'submission' | 'voting' | 'completed';
  creator: string;
  chat: string; // Chat ID
  created: string;
  updated: string;
  expand?: {
    creator: UserModel;
    chat: ChatModel;
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
}) {
  try {
    if (!pb.authStore.model) {
      throw new Error('Must be authenticated to create challenge');
    }

    // First create a chat room
    const chatRoom = await pb.collection('chat').create({
      messages: []
    });

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
    formData.append('chat', chatRoom.id);

    const challenge = await pb.collection('challenges').create(formData);
    
    // Update chat with challenge reference
    await pb.collection('chat').update(chatRoom.id, {
      challenge: challenge.id
    });

    return { success: true, challenge: challenge as unknown as ChallengeModel };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create challenge',
    };
  }
}

// Add this function after the getChallenges function
export async function getChallenges(id?: string, signal?: AbortSignal) {
  const options = {
    expand: 'creator,chat',
    $cancelKey: 'challenges-request',
    signal
  };

  try {
    if (id) {
      const record = await pb.collection('challenges').getOne(id, options);
      return { 
        success: true, 
        challenges: [record] as unknown as ChallengeModel[] 
      };
    }
    const records = await pb.collection('challenges').getFullList(options);
    return { 
      success: true, 
      challenges: records as unknown as ChallengeModel[] 
    };
  } catch (error: any) {
    if (error.name === 'AbortError' || error.isAbort) {
      return { success: false, challenges: [], error: 'Request cancelled' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch challenges',
      challenges: []
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