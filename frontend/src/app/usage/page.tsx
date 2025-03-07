import { CheckCircle2, AlertTriangle, Rocket, Video, Link, Trophy } from "lucide-react"

export default function UsagePage() {
  return (
    <main className="max-w-[1000px] mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Rocket className="h-8 w-8 text-primary" />
          How Coinpetitive.io Works
          <Rocket className="h-8 w-8 text-primary" />
        </h1>
        <p className="text-lg text-gray-600">
          A Step by Step Guide to Creating and Participating in Challenges
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1: Creating a Challenge */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            1️⃣ How to Create a Challenge
          </h2>
          <p className="mb-4">Anyone can create a challenge on Coinpetitive.io. Follow these steps:</p>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Step 1: Set Up Your Challenge</h3>
            <p className="mb-4">Go to the "Create Challenge" page and enter the following details:</p>
            <ul className="space-y-3">
              {[
                "Challenge Name – Keep it short and descriptive.",
                "Challenge Description – Explain the challenge rules and what participants need to do.",
                "Entry Fee – Set the amount participants must pay to enter (paid in Coinpetitive.io tokens).",
                "Entry Deadline – Set how long users have to enter.",
                "Submission Deadline – Set how long users have to enter.",
                "Pay Challenge Creation Fee – Challenge creation fee is the value of (1) entry fee"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>Important: Once a challenge is created, it cannot be edited or refunded. Be sure of your settings before launching.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Payouts */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            2️⃣ How Payouts Work for Challenge Creators
          </h2>
          <p className="mb-4">Challenge creators earn a portion of the entry fees paid by participants. Here's how it works:</p>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <p>When a participant joins a challenge, their entry fee is added to the reward pool.</p>
            <p>Once the challenge ends, payouts are automatically distributed as follows:</p>
            <ul className="space-y-3">
              {[
                "Winners receive the majority of the reward pool (e.g., 75% to 1st place, 25% to 2nd place, in the event of a TIE, the split is 50/50).",
                "Challenge creator receives the entry fees (minus gas fees)",
                "A small fee goes to Coinpetitive.io for platform maintenance."
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="flex items-center gap-2 text-primary font-semibold">
              <Rocket className="h-5 w-5" />
              The more participants join, the bigger the reward pool!
            </p>
          </div>
        </section>

        {/* Section 3: Submitting an Entry */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            3️⃣ How to Submit an Entry to a Challenge
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Video className="h-5 w-5" />
                Step 1: Record Your Challenge Attempt
              </h3>
              <p>Film your challenge attempt clearly so that it meets the challenge rules and requirements.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Step 2: Upload Your Video to a Social Media Platform</h3>
              <p className="mb-2">You must upload your video to one of the following:</p>
              <ul className="space-y-2 pl-6">
                {["TikTok", "Facebook", "YouTube", "Twitter/X"].map((platform) => (
                  <li key={platform} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {platform}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Link className="h-5 w-5" />
                Step 3: Include the Required Hashtag
              </h3>
              <div className="flex items-start gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>YOU MUST use the hashtag #Coinpetitive.com in your post!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Winning & Rewards */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            4️⃣ Winning & Rewards
            <Trophy className="h-6 w-6 text-primary" />
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <ul className="space-y-3">
              {[
                "If the challenge is objective-based, winners are chosen based on measurable criteria.",
                "If the challenge is voting-based, the community votes for the best submission.",
                "Once winners are confirmed, payouts are automatically distributed via the smart contract."
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* TL;DR Summary */}
        <section className="bg-primary/5 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">TL;DR – Quick Summary</h2>
          <ul className="space-y-3">
            {[
              "Create a Challenge – Set the entry fee, rules, and winner selection method.",
              "Submit an Entry – Record and upload your video to TikTok, YouTube, Twitter, or Facebook with #Coinpetitive.com.",
              "Win & Earn – If you win, you get paid directly to your crypto wallet."
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                {`${index + 1}️⃣ ${item}`}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold text-center">
            🎯 Think you have what it takes? Start competing today!
          </p>
        </section>
      </div>
    </main>
  )
}