import type { Metadata } from "next"
import Link from "next/link"

import { LegalArticle, LegalContact, LegalSummary } from "@/components/legal/legal-article"

export const metadata: Metadata = {
  title: "Privacy Policy · MindTrace",
  description:
    "How MindTrace handles information: we never sell your data and never use your conversations to train AI models.",
}

export default function PrivacyPage() {
  return (
    <LegalArticle
      eyebrow="Legal"
      title="Privacy Policy"
      intro={
        <p>
          MindTrace helps caregivers notice gradual changes in how a loved one communicates. Conversations are
          personal, so we treat everything you share with us as sensitive. This policy explains what we collect, what
          we do with it, and the promises we make about it.
        </p>
      }
    >
      <LegalSummary
        items={[
          <>
            <strong>We never sell your data</strong>, and we never share it for advertising.
          </>,
          <>
            <strong>We never use your conversations, recordings, transcripts or notes to train AI models</strong>,
            ours or anyone else&rsquo;s.
          </>,
          <>You own what you put into MindTrace. You can export it or delete it at any time.</>,
          <>
            The current MindTrace demo collects no personal information. Margaret Reynolds is fictional and every
            value shown is synthetic.
          </>,
        ]}
      />

      <h2 id="demo">What the current demo collects</h2>
      <p>
        MindTrace is currently a demonstration. It has no accounts, does not record audio, and does not send any
        information you enter to our servers. Specifically:
      </p>
      <ul>
        <li>We do not collect names, email addresses, recordings or health information through the demo.</li>
        <li>We do not use advertising, analytics or tracking cookies, and we do not sell or share browsing data.</li>
        <li>
          The site remembers one setting in your own browser (whether animations are on or off) using local storage.
          It never leaves your device, and you can clear it by clearing your browser&rsquo;s site data.
        </li>
        <li>
          Like any website, the servers that host MindTrace may keep standard technical logs, such as IP address,
          browser type and pages requested, for security and reliability. These are not used to identify you or for
          advertising.
        </li>
      </ul>

      <h2 id="future">When conversation features are available</h2>
      <p>
        When recording and analysis become available, MindTrace will only process the information you choose to
        provide in order to run the service for you:
      </p>
      <ul>
        <li>Account details, such as your name and email address.</li>
        <li>Conversation recordings and the transcripts made from them.</li>
        <li>
          Communication indicators calculated from those conversations, such as pauses, repetition and speech rate.
        </li>
        <li>Notes you add, and summaries you create.</li>
      </ul>
      <p>
        We use this information only to provide MindTrace to you: to calculate indicators, show changes against the
        person&rsquo;s own baseline, and produce summaries you ask for. We will update this policy, and ask for your
        consent where required, before any of these features are switched on.
      </p>

      <h2 id="commitments">Our commitments</h2>
      <ul>
        <li>
          <strong>No sale of data.</strong> We do not sell, rent or trade personal information, and we do not
          &ldquo;share&rdquo; it for cross-context behavioral advertising.
        </li>
        <li>
          <strong>No AI training.</strong> We do not use your conversations, recordings, transcripts, notes or
          indicators to train or improve machine-learning models, and we do not allow our service providers to do so.
        </li>
        <li>
          <strong>No advertising.</strong> MindTrace does not show ads and does not build advertising profiles.
        </li>
        <li>
          <strong>Your data stays yours.</strong> You can see, export and delete it. Deleting your account deletes
          your conversations and derived data, except where we are legally required to keep something.
        </li>
        <li>
          <strong>Minimal access.</strong> Only the people and systems that need information to run the service can
          access it.
        </li>
      </ul>

      <h2 id="sharing">When information is shared</h2>
      <p>We only share personal information in these limited situations:</p>
      <ul>
        <li>
          <strong>Service providers</strong> that host or process data on our behalf, under contracts that limit
          them to providing services to us and prohibit selling your data or using it to train models.
        </li>
        <li>
          <strong>At your direction</strong>, for example when you print or send a summary to a healthcare
          professional.
        </li>
        <li>
          <strong>When required by law</strong>, such as a valid legal order, or to protect someone&rsquo;s safety.
        </li>
        <li>
          <strong>If MindTrace changes ownership</strong>, in which case this policy&rsquo;s commitments would
          continue to apply to your information.
        </li>
      </ul>

      <h2 id="health">Health-related information</h2>
      <p>
        Communication patterns can be sensitive, even though MindTrace does not diagnose any condition. MindTrace is
        not a healthcare provider. Information you store in MindTrace may not be covered by health-privacy laws such
        as HIPAA, which apply to doctors, hospitals and insurers. We protect it with the commitments in this policy
        instead. See our <Link href="/medical-disclaimer">medical disclaimer</Link> for more.
      </p>

      <h2 id="consent">Recording other people</h2>
      <p>
        If you record conversations with someone else, you are responsible for getting their permission and for
        following the recording and consent laws where you and they live. Some places require every person in a
        conversation to agree to it being recorded. See our <Link href="/terms">terms of use</Link>.
      </p>

      <h2 id="security">Security</h2>
      <p>
        We use reasonable technical and organizational safeguards appropriate to the sensitivity of the information
        we handle. No system is perfectly secure, so we cannot guarantee absolute security. If we learn of a breach
        affecting your information, we will notify you as required by law.
      </p>

      <h2 id="retention">How long we keep information</h2>
      <p>
        We keep information only for as long as you use MindTrace, or as long as we are legally required to. When you
        delete information or your account, we delete it from our active systems promptly and from backups on their
        normal schedule.
      </p>

      <h2 id="rights">Your choices and rights</h2>
      <p>
        You can ask to access, correct, export or delete your personal information. Depending on where you live, you
        may have additional rights, for example under the EU and UK GDPR or California privacy law, including the
        right to object to or restrict certain processing and the right to complain to a data protection authority.
        We will not treat you differently for exercising these rights.
      </p>

      <h2 id="children">Children</h2>
      <p>
        MindTrace is intended for adult caregivers aged 18 or older. It is not directed to children under 13, and we
        do not knowingly collect personal information from them.
      </p>

      <h2 id="changes">Changes to this policy</h2>
      <p>
        If we change this policy, we will update the date at the top of this page. If a change is significant, we will
        give notice before it takes effect. We will never weaken the commitments above for information you have
        already given us without your consent.
      </p>

      <h2 id="contact">Contact</h2>
      <LegalContact />
    </LegalArticle>
  )
}
