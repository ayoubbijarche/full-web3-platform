import { JSX } from 'react';

export default function PrivacyPage() {
  return (
    <main>
      <div className="max-w-[1000px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">COINPETITIVE.IO TERMS OF SERVICE</h1>
        
        <div className="space-y-6 text-gray-700">
          <div className="mb-6">
            <p className="text-sm mb-4">
              Effective Date: <span className="font-semibold">[01/01/2025]</span><br />
              Last Updated: <span className="font-semibold">[02/24/2025]</span>
            </p>
            <p className="mb-4">
              Welcome to Coinpetitive.io, a decentralized platform facilitating skill-based challenges. 
              By accessing or using Coinpetitive.io, you acknowledge and agree to these Terms of Service ("Terms"). 
              If you do not agree with any part of these Terms, you should not use the platform.
            </p>
          </div>

          {/* User Responsibility Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">User Responsibility & Assumption of Risk</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="mb-4">
                By using this platform, you acknowledge and accept full responsibility for your participation 
                in any challenge, including but not limited to physical, mental, or skill-based competitions.
              </p>
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="text-red-500 mr-2">🚨</span>
                  Coinpetitive.io is not liable for:
                </p>
                <ul className="list-none space-y-2 pl-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    Personal injury, physical harm, or health risks resulting from participation in any challenge.
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    Property damage or financial losses incurred due to challenge participation.
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    Users engaging in challenges beyond their skill level, physical ability, or personal safety limits.
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    Any disputes between users regarding challenge outcomes, fairness, or enforcement.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Numbered Sections */}
          {[...Array(11)].map((_, index) => (
            <section key={index + 1} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{index + 1}. {getTitleForSection(index + 1)}</h2>
              <div className="prose max-w-none">
                {getContentForSection(index + 1)}
              </div>
            </section>
          ))}

          {/* Acknowledgment Section */}
          <section className="mt-8 border-t pt-8">
            <h2 className="text-xl font-semibold mb-4">Acknowledgment & Acceptance</h2>
            <p>
              By using Coinpetitive.io, you acknowledge that you have read, understood, and agreed to these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

// Helper functions to get section titles and content
function getTitleForSection(section: number): string {
  const titles = {
    1: "General Disclaimer",
    2: "Token Utility & Non-Security Statement",
    3: "Non-Custodial & No Money Transmission Policy",
    4: "No Gambling or Sweepstakes Involvement",
    5: "Voting Mechanism Transparency",
    6: "Sell Limit & Liquidity Protection",
    7: "Tax Responsibility Disclaimer",
    8: "Anti-Sybil & Fair Play Policy",
    9: "No Legal or Financial Advice",
    10: "Changes to Terms & Policies",
    11: "Contact Information"
  }
  return titles[section as keyof typeof titles] || ""
}

function getContentForSection(section: number): JSX.Element {
  const contents: Record<number, JSX.Element> = {
    1: (
      <div className="space-y-4">
        <p>
          Coinpetitive.io is a decentralized challenge platform that allows users to participate in skill-based competitions. 
          The platform does not provide financial, investment, or gambling services.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Participation requires users to utilize the platform's native token for entry fees, rewards, challenge creation, and voting.</li>
          <li>Coinpetitive.io does not guarantee financial returns or act as a custodian of user funds.</li>
          <li>Users are solely responsible for their own transactions, wallets, and private keys.</li>
          <li>By using this platform, you agree that Coinpetitive.io is not liable for any losses, including but not limited to financial loss, token devaluation, or smart contract vulnerabilities.</li>
        </ul>
      </div>
    ),
    2: (
      <div className="space-y-4">
        <p>The Coinpetitive.io token is strictly a utility token designed for platform-related functions, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Challenge entry fees</li>
          <li>Rewards distribution</li>
          <li>Challenge creation fees</li>
          <li>Voting mechanisms</li>
        </ul>
        <h3 className="font-semibold mt-4">Non-Security Representation:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>The token does not represent ownership, equity, debt, or an investment contract in Coinpetitive.io or any associated entity.</li>
          <li>It has no inherent monetary value outside the platform.</li>
          <li>Coinpetitive.io does not promote or endorse speculative trading of the token.</li>
          <li>Buying, selling, or transferring the token is done at the user's sole risk.</li>
          <li>Users should conduct their own due diligence before engaging in token transactions.</li>
        </ul>
      </div>
    ),
    3: (
      <div className="space-y-4">
        <ul className="list-disc pl-6 space-y-2">
          <li>Coinpetitive.io does not act as a financial intermediary, broker, or money transmitter.</li>
          <li>All transactions occur on a decentralized blockchain network, where users retain full control over their funds.</li>
          <li>The platform does not store, manage, or recover lost funds.</li>
          <li>Users are solely responsible for managing their wallets, private keys, and any associated risks.</li>
          <li>Coinpetitive.io cannot assist with lost or stolen tokens, forgotten private keys, or unauthorized transactions.</li>
        </ul>
      </div>
    ),
    4: (
      <div className="space-y-4">
        <p>Coinpetitive.io only hosts skill-based challenges. The platform does not allow or support:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Games of chance</li>
          <li>Lotteries, sweepstakes, or randomized giveaways</li>
          <li>Betting mechanisms reliant on luck rather than skill</li>
        </ul>
        <p>All challenge results are determined by:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Objective criteria</li>
          <li>User performance</li>
          <li>Verifiable, skill-based outcomes</li>
        </ul>
        <p>Challenges that include voting-based results are designed as strategic decision-making mechanisms, not gambling.</p>
      </div>
    ),
    5: (
      <div className="space-y-4">
        <ul className="list-disc pl-6 space-y-2">
          <li>Voting on Coinpetitive.io challenges is a decentralized and public process.</li>
          <li>All votes, results, and payouts are recorded on-chain for transparency and verification.</li>
          <li>Users who vote correctly receive an equal share of the losing votes' fees.</li>
          <li>In the event of a tied vote, the challenge reward pool is split equally.</li>
          <li>Coinpetitive.io does not intervene in, override, or manipulate voting outcomes.</li>
          <li>Users agree to participate in voting at their own discretion and risk.</li>
        </ul>
      </div>
    ),
    6: (
      <div className="space-y-4">
        <p>To prevent market manipulation and excessive volatility, the following protections apply:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Users may not sell more than 1% of the circulating token supply within a 24-hour period.</li>
          <li>This rule is enforced by smart contract and applies automatically.</li>
          <li>Liquidity pool transactions include a 1% burn fee.</li>
          <li>This mechanism helps maintain long-term token health and sustainability.</li>
          <li>These restrictions are designed to ensure fair market behavior and discourage price manipulation.</li>
        </ul>
      </div>
    ),
    7: (
      <div className="space-y-4">
        <ul className="list-disc pl-6 space-y-2">
          <li>Users are solely responsible for understanding and complying with their local tax regulations regarding cryptocurrency transactions.</li>
          <li>Coinpetitive.io does not withhold, collect, or report taxes on behalf of users.</li>
          <li>Any earnings, rewards, or token-related gains may be subject to taxation in your jurisdiction.</li>
          <li>Users are strongly encouraged to consult a tax professional regarding their obligations.</li>
        </ul>
      </div>
    ),
    8: (
      <div className="space-y-4">
        <p>Coinpetitive.io enforces strict anti-Sybil protections to maintain fair competition and prevent exploitative behaviors.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Users may not create multiple accounts or use automated scripts to manipulate challenge outcomes.</li>
          <li>Bot-driven exploits, collusion, or fraudulent voting are strictly prohibited.</li>
        </ul>
        <p>Violating these fair play policies may result in:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Revocation of rewards</li>
          <li>Temporary or permanent account restrictions</li>
          <li>Exclusion from future challenges</li>
        </ul>
        <p>Coinpetitive.io reserves the right to take necessary actions against violators.</p>
      </div>
    ),
    9: (
      <div className="space-y-4">
        <p>Nothing on Coinpetitive.io should be interpreted as:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Legal advice</li>
          <li>Financial guidance</li>
          <li>Investment recommendations</li>
        </ul>
        <p>Participation in the platform is entirely at the user's own risk. Users should conduct independent research and consult professionals before making cryptocurrency-related decisions.</p>
      </div>
    ),
    10: (
      <div className="space-y-4">
        <p>Coinpetitive.io reserves the right to modify or update these Terms at any time to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ensure compliance with regulatory requirements</li>
          <li>Improve platform functionality</li>
          <li>Address security concerns</li>
        </ul>
        <h3 className="font-semibold mt-4">User Agreement to Policy Changes</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Any modifications will be publicly communicated.</li>
          <li>Continued use of Coinpetitive.io constitutes acceptance of the updated Terms.</li>
          <li>Users are encouraged to review this document regularly.</li>
        </ul>
      </div>
    ),
    11: (
      <div className="space-y-4">
        <p>For any questions or concerns regarding these Terms, please contact: <a href="mailto:support@coinpetitive.io" className="text-primary hover:underline">support@coinpetitive.io</a></p>
      </div>
    )
  }

  return contents[section] || <p>Section content not available.</p>
}