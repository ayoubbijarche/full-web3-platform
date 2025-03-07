import { CheckCircle2, AlertTriangle, Rocket, XCircle, Info } from "lucide-react"

type FAQItem = {
  question: string;
  answer: JSX.Element;
}

export default function FAQPage() {
  const faqItems: FAQItem[] = [
    {
      question: "What is Coinpetitive.io?",
      answer: (
        <div className="space-y-4">
          <p>Coinpetitive.io is a decentralized challenge platform where users compete in skill-based challenges using the platform's native token.</p>
          <div>
            <p className="font-semibold mb-2">Key Features:</p>
            <ul className="space-y-2">
              {[
                "Skill-Based Competitions – Challenges are based on user performance, strategy, or verifiable outcomes.",
                "Decentralized System – Transactions occur on the Solana blockchain, ensuring security and transparency.",
                "Voting Mechanism – Users can vote on certain challenge results and earn rewards based on consensus.",
                "Non-Custodial – Users retain full control of their funds; Coinpetitive.io does not store or manage user assets."
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="italic">The platform is not a gambling service, investment platform, or financial intermediary.</p>
        </div>
      )
    },
    {
      question: "How do I participate in challenges?",
      answer: (
        <div className="space-y-4">
          <p>To enter a challenge, you must:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Connect your Solana-compatible wallet to Coinpetitive.io.</li>
            <li>Use Coinpetitive.io tokens to pay the challenge entry fee.</li>
            <li>Compete based on the challenge criteria (e.g., performance, results, or community voting).</li>
            <li>If you win, rewards are automatically distributed to your wallet.</li>
          </ol>
        </div>
      )
    },
    {
      question: "Is Coinpetitive.io a gambling platform?",
      answer: (
        <div className="space-y-4">
          <p className="font-bold">No. Coinpetitive.io only hosts skill-based challenges, where success is determined by:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Objective criteria</li>
            <li>User performance</li>
            <li>Community-driven voting on challenge results</li>
          </ol>
          <div className="mt-4">
            <p className="font-semibold mb-2">The platform does not support:</p>
            <ul className="space-y-2">
              {[
                "Games of chance (randomized outcomes, lotteries, or sweepstakes)",
                "Betting mechanisms that rely on luck rather than skill",
                "Casino-style games"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      question: "How do I create a challenge?",
      answer: (
        <div className="space-y-4">
          <p>Creating a challenge on Coinpetitive.io is easy! Follow these steps:</p>
          <ol className="space-y-4">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">1️⃣</span>
              <span>Navigate to the "Create Challenge" section on the platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">2️⃣</span>
              <div>
                <p>Set the challenge details, including:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Challenge name and description</li>
                  <li>Required skill or criteria for winning</li>
                  <li>Entry fee amount (in Coinpetitive.io tokens)</li>
                  <li>Challenge duration and deadline</li>
                </ul>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">3️⃣</span>
              <div>
                <p>Choose the result verification method:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Automated verification (if applicable)</li>
                  <li>Community voting (users vote on the winner)</li>
                  <li>Third-party verification (if external proof is required)</li>
                </ul>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">4️⃣</span>
              <span>Fund the challenge with the necessary reward pool.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">5️⃣</span>
              <span>Launch the challenge! It will now be open for participants.</span>
            </li>
          </ol>
          <Warning>
            <div className="space-y-2">
              <p className="font-semibold">Important Notes:</p>
              <ul className="space-y-1">
                <li>Challenge creation fees are non-refundable once the challenge is live.</li>
                <li>Coinpetitive.io does not moderate challenges—users are responsible for ensuring their challenges are fair and enforceable.</li>
                <li>Any challenge that violates fair play policies (e.g., fraud, unrealistic criteria) may be removed.</li>
              </ul>
            </div>
          </Warning>
        </div>
      )
    },
    {
      question: "What can I use the Coinpetitive.io token for?",
      answer: (
        <div className="space-y-4">
          <p>The Coinpetitive.io token is strictly a utility token used within the platform for:</p>
          <ul className="space-y-2">
            {[
              "Paying challenge entry fees",
              "Receiving challenge rewards",
              "Voting on challenge results",
              "Creating new challenges"
            ].map((use, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{use}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            {[
              "The token does not represent ownership, equity, or investment in Coinpetitive.io.",
              "It has no inherent monetary value outside of the platform.",
              "Coinpetitive.io does not encourage speculative trading of the token."
            ].map((warning, index) => (
              <div key={index} className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
          <p className="italic">Users engage in token transactions at their own discretion and risk.</p>
        </div>
      )
    },
    {
      question: "Does Coinpetitive.io store or manage my funds?",
      answer: (
        <div className="space-y-4">
          <p>No. Coinpetitive.io is a non-custodial platform, meaning:</p>
          <ul className="space-y-2">
            {[
              "You have full control over your funds at all times.",
              "The platform does not store, manage, or recover lost funds.",
              "All transactions occur on the Solana blockchain, ensuring decentralization."
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Warning>
            Coinpetitive.io cannot help recover lost wallets, stolen tokens, or forgotten private keys. Always back up your credentials securely.
          </Warning>
        </div>
      )
    },
    {
      question: "How does voting work?",
      answer: (
        <div className="space-y-4">
          <p>Voting on Coinpetitive.io is fully decentralized and transparent.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Users pay a voting fee to participate.</li>
            <li>If their vote aligns with the final challenge outcome, they receive an equal share of the losing votes' fees.</li>
            <li>In the event of a tied vote, the challenge reward pool is split equally among participants.</li>
            <li>All votes and results are recorded on-chain, ensuring full transparency.</li>
          </ul>
          <Success>
            Coinpetitive.io does not intervene or manipulate voting results. The system rewards informed decision-making based on challenge criteria and community consensus.
          </Success>
        </div>
      )
    },
    {
      question: "What blockchain does Coinpetitive.io use?",
      answer: (
        <div className="space-y-4">
          <p>Coinpetitive.io operates on the Solana blockchain, chosen for its:</p>
          <ul className="space-y-2">
            {[
              "Low transaction fees",
              "Fast processing times",
              "Scalability for decentralized applications"
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <InfoBlock>Users must use a Solana-compatible wallet to interact with the platform.</InfoBlock>
        </div>
      )
    },
    {
      question: "Do I have to pay taxes on my earnings?",
      answer: (
        <div className="space-y-4">
          <p>Coinpetitive.io does not collect, withhold, or report taxes on behalf of users.</p>
          <Warning>
            <div className="space-y-2">
              <p>Users are responsible for understanding and complying with local tax laws related to cryptocurrency transactions.</p>
              <p>Any earnings, rewards, or token transactions may be subject to taxation, depending on your jurisdiction.</p>
            </div>
          </Warning>
          <p className="font-semibold">We strongly recommend consulting a tax professional to ensure compliance.</p>
        </div>
      )
    }
  ];

  return (
    <main className="max-w-[1000px] mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Rocket className="h-8 w-8 text-primary" />
          Frequently Asked Questions (FAQ)
          <Rocket className="h-8 w-8 text-primary" />
        </h1>
      </div>

      <div className="space-y-8">
        {faqItems.map((item, index) => (
          <div key={index} className="border-b pb-8 last:border-b-0">
            <h2 className="text-xl font-semibold mb-4 flex items-start gap-2">
              <span className="text-primary">{index + 1}.</span>
              {item.question}
            </h2>
            <div className="prose max-w-none">
              {item.answer}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

// Helper function to create warning blocks
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

// Helper function to create success blocks
function Success({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

// Replace the Info component with InfoBlock
function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-blue-600 bg-blue-50 p-4 rounded-lg">
      <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}