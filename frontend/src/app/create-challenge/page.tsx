'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, createChallenge as createChallengeDB } from "@/lib/pb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Upload } from "lucide-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchor } from "@/lib/anchor-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/hooks/use-toast"


type ChallengeResult = {
  success: boolean;
  challenge?: any;
  error?: string;
};

const categories = [
  "Food",
  "Art",
  "Fitness",
  "Gaming",
  "Music",
]

export default function CreateChallengePage() {
  const router = useRouter()
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")

  const [formData, setFormData] = useState({
    challengetitle: "",
    category: "",
    minparticipants: "0",
    maxparticipants: "",
    voters: "",
    votingFees: "0",
    participation_fee: "0",
    reward: "0",
    description: "",
    challengevideo: "", // Changed from File to string
    keywords: "",
    registration_end: "",
    submission_end: "",
    voting_end: "",
    participantsNickname: "",
    votersNickname: "",
    minvoters: "0",
    maxvoters: "0",
  })

  const validateForm = () => {
    const requiredFields = {
      challengetitle: "Challenge Name",
      category: "Category",
      maxparticipants: "Participants",
      reward: "Reward",
      description: "Description",
      registration_end: "Registration Period",
      submission_end: "Submission Period",
      voting_end: "Voting Period",
      votingFees: "Voting Fee",
      participation_fee: "Participation Fee"
    }

    const emptyFields = Object.entries(requiredFields).filter(
      ([key]) => !formData[key as keyof typeof formData]
    )

    if (!selectedImage) {
      return "Challenge image is required"
    }

    if (emptyFields.length > 0) {
      return `Please fill in the following required fields: ${emptyFields
        .map(([_, label]) => label)
        .join(", ")}`
    }

    if (Number(formData.maxparticipants) <= 0) {
      return "Number of participants must be greater than 0"
    }

    if (Number(formData.reward) <= 0) {
      return "Reward must be greater than 0"
    }

    if (Number(formData.registration_end) <= 0) {
      return "Registration period must be greater than 0 days"
    }

    if (Number(formData.submission_end) <= 0) {
      return "Submission period must be greater than 0 days"
    }

    if (Number(formData.voting_end) <= 0) {
      return "Voting period must be greater than 0 days"
    }

    const minVoters = parseInt(formData.minvoters) || 0;
    const maxVoters = parseInt(formData.maxvoters) || 0;

    if (minVoters < 0) {
      return "Minimum voters cannot be negative";
    }

    if (maxVoters < minVoters) {
      return "Maximum voters must be greater than or equal to minimum voters";
    }

    return null
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to create a challenge</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Get Anchor context for blockchain interactions
  const { createChallenge: createOnChainChallenge, wallet } = useAnchor();

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    // Check if wallet is connected
    if (!wallet) {
      setError("Please connect your wallet to create a challenge");
      setIsLoading(false);
      return;
    }

    try {
      // First create the challenge on the blockchain
      console.log("Creating challenge on the blockchain...");
      
      // Convert values to correct format for blockchain
      const rewardLamports = Number(formData.reward) * LAMPORTS_PER_SOL;
      const registrationFeeLamports = Number(formData.participation_fee) * LAMPORTS_PER_SOL;
      const submissionFeeLamports = 0; // No separate submission fee in the UI, use 0
      const votingFeeLamports = Number(formData.votingFees) * LAMPORTS_PER_SOL;
      
      // Send the transaction to the blockchain
      const onChainResult = await createOnChainChallenge({
        reward: rewardLamports,
        registrationFee: registrationFeeLamports,
        submissionFee: submissionFeeLamports,
        votingFee: votingFeeLamports
      });
      
      if (!onChainResult.success) {
        throw new Error(onChainResult.error || "Failed to create challenge on blockchain");
      }
      
      console.log("Challenge created on blockchain:", onChainResult);

      // Now create the challenge in your database
      const now = new Date();
      
      // Calculate the end dates
      const registrationEndDate = new Date(now.getTime() + (parseInt(formData.registration_end) * 24 * 60 * 60 * 1000));
      const submissionEndDate = new Date(registrationEndDate.getTime() + (parseInt(formData.submission_end) * 24 * 60 * 60 * 1000));
      const votingEndDate = new Date(submissionEndDate.getTime() + (parseInt(formData.voting_end) * 24 * 60 * 60 * 1000));

      // Then create the challenge in your database
      const result = await createChallengeDB({
        title: formData.challengetitle,
        category: formData.category,
        minparticipants: parseInt(formData.minparticipants) || 1,
        maxparticipants: parseInt(formData.maxparticipants) || 0,  // Convert to number
        minvoters: parseInt(formData.minvoters) || 0,
        maxvoters: parseInt(formData.maxvoters) || 0,
        reward: Number(formData.reward),
        description: formData.description,
        keywords: formData.keywords.split(",").map(k => k.trim()).filter(k => k),
        // Match the expected parameter names from createChallenge function
        registration_end: parseInt(formData.registration_end),
        submission_end: parseInt(formData.submission_end),
        voting_end: parseInt(formData.voting_end),
        registrationEnd: registrationEndDate,
        submissionEnd: submissionEndDate,
        votingEnd: votingEndDate,
        image: selectedImage || undefined,
        challengevideo: formData.challengevideo || undefined,
        voting_fee: Number(formData.votingFees),
        participation_fee: Number(formData.participation_fee),
        creator: auth.user?.id || '',
        onchain_id: onChainResult.challengeId || '' // Store the on-chain challenge ID
        // The transaction signature is logged but not stored since there's no field for it in the API
      });

      if (result.success && result.challenge) {
        toast({
          title: "Challenge Created",
          description: "Your challenge has been created successfully!"
        });
        router.push(`/challenge/${result.challenge.id}`);
      } else {
        setError(result.error || "Failed to create challenge in database");
      }
    } catch (error: unknown) {
      console.error('Challenge creation error:', error);
      
      // Better handling of Solana errors
      if (error && typeof error === 'object' && 'logs' in error && Array.isArray(error.logs)) {
        console.error('Transaction logs:', error.logs);
        // Extract the specific error from Solana logs if possible
        const errorMessage = error.logs.find((log: string) => log.includes('Error:'));
        setError(errorMessage || (error instanceof Error ? error.message : "An error occurred"));
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred during challenge creation");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newKeyword = keywordInput.trim()
      
      if (newKeyword && keywords.length < 5 && !keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword])
        setKeywordInput("")
        setFormData(prev => ({ 
          ...prev, 
          keywords: [...keywords, newKeyword].join(',')
        }))
      }
    } else if (e.key === 'Backspace' && keywordInput === '') {
      e.preventDefault()
      const newKeywords = keywords.slice(0, -1)
      setKeywords(newKeywords)
      setFormData(prev => ({ 
        ...prev, 
        keywords: newKeywords.join(',')
      }))
    }
  }

  const removeKeyword = (indexToRemove: number) => {
    const newKeywords = keywords.filter((_, index) => index !== indexToRemove)
    setKeywords(newKeywords)
    setFormData(prev => ({ 
      ...prev, 
      keywords: newKeywords.join(',')
    }))
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="text-[#B3731D] mb-1">Great!</div>
        <h1 className="text-3xl font-semibold mb-8">Lets Challenge People</h1>

        <div className="grid grid-cols-[300px,1fr] gap-8">
          <div className="bg-gray-100 rounded-3xl flex items-center justify-center h-[300px] relative overflow-hidden group border border-[#8a8a8a]">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="Challenge preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer text-white flex flex-col items-center">
                    <Upload className="w-8 h-8 mb-2" />
                    <span>Change Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </>
            ) : (
              <label className="cursor-pointer text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <span className="text-sm text-gray-500">Upload Challenge Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Basic Details</h2>
            
            <div className="grid grid-cols-[1fr,300px] gap-4">
              <div>
                <Label>Challenge Name</Label>
                <Input 
                  placeholder="Type Here"
                  value={formData.challengetitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, challengetitle: e.target.value }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger className="border-[#8a8a8a] rounded-[50px]">
                    <SelectValue placeholder="Select One" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-16">
              <div>
                <Label>Registration Period (days)</Label>
                <div className="relative w-[260px]">
                  <Input 
                    type="number"
                    min="1"
                    value={formData.registration_end}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      registration_end: e.target.value 
                    }))}
                    placeholder="Enter days"
                    className="pl-10 pr-8 border-[#8a8a8a] rounded-[50px] min-h-[44px] text-sm w-full"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label>Submission Period (days)</Label>
                <div className="relative w-[260px]">
                  <Input 
                    type="number"
                    min="1"
                    value={formData.submission_end}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      submission_end: e.target.value 
                    }))}
                    placeholder="Enter days"
                    className="pl-10 pr-8 border-[#8a8a8a] rounded-[50px] min-h-[44px] text-sm w-full"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label>Voting Period (days)</Label>
                <div className="relative w-[260px]">
                  <Input 
                    type="number"
                    min="1"
                    value={formData.voting_end}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      voting_end: e.target.value 
                    }))}
                    placeholder="Enter days"
                    className="pl-10 pr-8 border-[#8a8a8a] rounded-[50px] min-h-[44px] text-sm w-full"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Participants</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    min="1"
                    placeholder="Min"
                    value={formData.minparticipants}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minparticipants: Math.max(1, parseInt(e.target.value) || 0).toString() 
                    }))}
                    className="border-[#8a8a8a] rounded-[50px]"
                    required
                  />
                  <Input 
                    type="number"
                    min="1"
                    placeholder="Max"
                    value={formData.maxparticipants}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxparticipants: Math.max(
                        parseInt(formData.minparticipants) || 1,
                        parseInt(e.target.value) || 0
                      ).toString() 
                    }))}
                    className="border-[#8a8a8a] rounded-[50px]"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Voters</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={formData.minvoters}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minvoters: Math.max(0, parseInt(e.target.value) || 0).toString() 
                    }))}
                    className="border-[#8a8a8a] rounded-[50px]"
                    required
                  />
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={formData.maxvoters}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxvoters: Math.max(
                        parseInt(formData.minvoters) || 0,
                        parseInt(e.target.value) || 0
                      ).toString() 
                    }))}
                    className="border-[#8a8a8a] rounded-[50px]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Voting Fee</Label>
                <Input 
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.votingFees}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    votingFees: e.target.value 
                  }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                  placeholder="0.000 CPT"
                  required
                />
              </div>
              <div>
                <Label>Participation Fee</Label>
                <Input 
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.participation_fee}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    participation_fee: e.target.value 
                  }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                  placeholder="0.000 CPT"
                  required
                />
              </div>
              <div>
                <Label>Reward</Label>
                <Input 
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.reward}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reward: e.target.value 
                  }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                  placeholder="0.000 CPT"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Description & Rules</Label>
              <Textarea 
                placeholder="Type Here"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-32 border-[#8a8a8a] rounded-[20px]"
                required
              />
            </div>

            <h2 className="text-xl font-semibold pt-4">Other Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Challenge Video URL</Label>
                <Input 
                  type="url"
                  placeholder="Paste video URL from YouTube, Twitter, Instagram, etc."
                  value={formData.challengevideo}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    challengevideo: e.target.value 
                  }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported platforms: YouTube, Twitter, Instagram, TikTok, etc.
                </p>
              </div>
              <div>
                <Label>Keywords</Label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 p-2 min-h-[44px] border border-[#8a8a8a] rounded-[50px] bg-white">
                    {keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-[#f8f1e9] text-[#B3731D] rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      placeholder={keywords.length >= 5 ? "Maximum 5 keywords" : "Type and press Enter"}
                      className="flex-1 outline-none border-none bg-transparent placeholder:text-gray-400 min-w-[120px]"
                      disabled={keywords.length >= 5}
                    />
                  </div>
                  <div className="absolute right-3 top-[50%] -translate-y-[50%] text-xs text-gray-400">
                    {keywords.length}/5
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or comma to add a keyword. Maximum 5 keywords allowed.
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold pt-4">Advanced Option (Optional)</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Voters</Label>
                <Input 
                  placeholder="Nick Name"
                  value={formData.votersNickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, votersNickname: e.target.value }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                />
              </div>
              <div>
                <Label>Participants</Label>
                <Input 
                  placeholder="Nick Name"
                  value={formData.participantsNickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, participantsNickname: e.target.value }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                className="px-8 rounded-[50px]"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                className="px-8 bg-[#B3731D] hover:bg-[#B3731D]/90 rounded-[50px]"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Challenge Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center mt-4">
          {error}
        </div>
      )}
    </div>
  )
}