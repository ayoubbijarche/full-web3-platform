"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Wallet, Users, Heart, MessageCircle, Share2, Trophy, User, Coins, Ticket } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import mountImage from '@/assets/mount.png'
import { SubmitVideoDialog } from "@/components/submit-video-dialog"

// First, fix the duplicate import
import { getChatMessages, sendMessage, useAuth, type MessageModel } from "@/lib/pb"
// Remove this line: import { useAuth } from "@/lib/pb"

// Add useEffect import
import { useState, useEffect } from "react"

interface ChallengeDetailsProps {
  challenge: {
    id: string;
    challengetitle: string;
    creator: string;
    reward: number;
    participants: string[];
    maxparticipants: number;
    image?: string;
    description: string;
    keywords?: string[];
    chat: string;
  }
}

export function ChallengeDetails({ challenge }: ChallengeDetailsProps) {
  const [messages, setMessages] = useState<MessageModel[]>([])
  const [messageInput, setMessageInput] = useState("")
  const auth = useAuth()
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const keywords = Array.isArray(challenge.keywords) ? challenge.keywords : []
  const imageUrl = challenge.image || "/placeholder-image.png"
  
  // Move useEffect here, before return
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const result = await getChatMessages(challenge.chat)
        if (result.success && Array.isArray(result.messages)) {
          // Sort messages by creation date if available
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
          setMessages(sortedMessages)
        } else {
          console.error('Failed to fetch messages or invalid response format')
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }
    
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [challenge.chat])
  
  // Move handleSendMessage here
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
  
  return (
    <div className="flex gap-6 p-4 max-w-[1200px] mx-auto">
      <div className="flex-1">
        <div className="border border-[#9A9A9A] rounded-xl overflow-hidden mb-4">
          <div className="aspect-video relative">
            <Image
              src={challenge.image || mountImage}
              alt={challenge.challengetitle}
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="p-3 mb-6">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold text-[#4A4A4A]">{challenge.challengetitle}</h1>
            <div className="flex gap-2">
              <Button 
                className="bg-[#b3731d] hover:bg-[#b3731d]/90"
                onClick={() => {
                  // Handle join challenge
                }}
              >
                Join Challenge 100 CPT
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  // Handle report challenge
                }}
              >
                Report Challenge
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              <span>{challenge.creator}</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <span>{challenge.participants.length}/{challenge.maxparticipants}</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Coins className="h-5 w-5" />
              <span>{challenge.reward} CPT</span>
            </div>
          </div>
          <p className="text-gray-600">
            {challenge.description}
          </p>
        </div>

        {/* Submissions */}
        <div className="space-y-4">
          {challenge.participants.map((participant, index) => (
            <div key={index} className="flex gap-4 border border-[#9A9A9A] rounded-xl p-4">
              <div className="w-[180px] flex-shrink-0">
                <div className="aspect-video relative rounded-lg bg-gray-100 mb-2">
                  <Image
                    src={mountImage}
                    alt="Video thumbnail"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{participant.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-3">This is the description of the video submission...</p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="text-xs">Like</span>
                  </Button>
                  <Button variant="default" size="sm">
                    Vote (5 $CPT)
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Section - Fix the structure */}
      <div className="w-[320px] flex-shrink-0">
        <Button 
          className="w-full mb-4"
          onClick={() => setIsSubmitDialogOpen(true)}
        >
          <span className="text-sm">Submit My Video (5 $CPT)</span>
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
                placeholder="Type your message" 
                className="rounded-full text-sm"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage()
                  }
                }}
              />
              <Button 
                size="sm"
                onClick={handleSendMessage}
                disabled={!auth.isAuthenticated}
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        <SubmitVideoDialog 
          open={isSubmitDialogOpen} 
          onOpenChange={setIsSubmitDialogOpen}
        />
      </div>
    </div>
  )
}

