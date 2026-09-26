import type { Metadata } from "next"
import Link from "next/link"

import { LegalArticle, LegalContact, LegalSummary } from "@/components/legal/legal-article"

export const metadata: Metadata = {
  title: "Terms of Use · MindTrace",
  description: "The terms for using MindTrace, a caregiver tool that is not a medical device and does not diagnose.",
}

export default function TermsPage() {
  return (
    <LegalArticle
      eyebrow="Legal"
      title="Terms of Use"
      intro={
        <p>
          These terms apply to your use of the MindTrace website and demo (&ldquo;MindTrace&rdquo;). By using
          MindTrace, you agree to them. If you do not agree, please do not use MindTrace.
        </p>
      }
    >
      <LegalSummary
        items={[
          <>MindTrace is a caregiver tool. It is not a medical device and does not diagnose any condition.</>,
          <>It is not for emergencies. If someone may need urgent help, call 911 or your local emergency number.</>,
          <>If you record someone, you must have their permission and follow local recording laws.</>,
          <>The current version is a demonstration with fictional, synthetic data, provided as is.</>,
        ]}
      />

      <h2 id="about">1. What MindTrace is</h2>
      <p>
        MindTrace turns conversations into a record of communication patterns over time, comparing a person only with
        their own earlier baseline. It is meant to help caregivers notice changes that may be worth discussing with a
        qualified healthcare professional. The version available today is a demonstration: it has no accounts, does
        not record audio, and shows data for Margaret Reynolds, a fictional person, with synthetic values.
      </p>

      <h2 id="not-medical">2. Not medical advice</h2>
      <p>
        MindTrace does not provide medical advice, diagnosis or treatment, and it does not create a doctor&ndash;patient
        relationship. Indicators, trends and summaries are informational only. Always seek the advice of a qualified
        healthcare professional about any health concern, and never ignore or delay professional advice because of
        something you saw in MindTrace. Please read our <Link href="/medical-disclaimer">medical disclaimer</Link>.
      </p>

      <h2 id="eligibility">3. Who can use MindTrace</h2>
      <p>
        You must be at least 18 years old and able to agree to these terms. If you use MindTrace on behalf of someone
        else, such as a parent or partner you care for, you confirm that you are allowed to do so.
      </p>

      <h2 id="consent">4. Consent and recording laws</h2>
      <p>
        When conversation recording becomes available, you are responsible for getting permission from everyone whose
        voice you record, and for following all recording, privacy and consent laws that apply to you and to them.
        Some jurisdictions require the consent of every participant. Do not record anyone who has not agreed, and
        respect the dignity and wishes of the person you care for.
      </p>

      <h2 id="your-content">5. Your content</h2>
      <p>
        You keep ownership of everything you add to MindTrace, including recordings, transcripts and notes. You give us
        permission to store and process that content only as needed to provide MindTrace to you. We will never sell
        your content or use it to train AI models, as described in our <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2 id="acceptable-use">6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use MindTrace to monitor or record anyone without their knowledge and consent.</li>
        <li>Upload content you do not have the right to share, or that is unlawful or harmful.</li>
        <li>Attempt to break, overload, reverse engineer or gain unauthorized access to MindTrace.</li>
        <li>Present MindTrace results as a medical diagnosis or clinical assessment.</li>
      </ul>

      <h2 id="ip">7. Our materials</h2>
      <p>
        The MindTrace name, design, software and content are owned by the MindTrace team or its licensors. You may
        use them only to use MindTrace as intended. The demo data is synthetic and does not describe a real person.
      </p>

      <h2 id="availability">8. Changes and availability</h2>
      <p>
        MindTrace is an early-stage project. We may change, suspend or stop any part of it at any time, and we do not
        guarantee that it will always be available or free of errors.
      </p>

      <h2 id="warranty">9. No warranties</h2>
      <p>
        MindTrace is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind,
        whether express or implied, including warranties of accuracy, fitness for a particular purpose,
        merchantability and non-infringement, to the fullest extent permitted by law.
      </p>

      <h2 id="liability">10. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the MindTrace team will not be liable for any indirect, incidental,
        special, consequential or punitive damages, or for any loss arising from decisions made based on information
        shown in MindTrace. Nothing in these terms limits liability that cannot be limited under applicable law.
      </p>

      <h2 id="changes">11. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. We will change the date at the top of this page, and give notice
        of significant changes. Continuing to use MindTrace after a change means you accept the updated terms.
      </p>

      <h2 id="contact">12. Contact</h2>
      <LegalContact />
    </LegalArticle>
  )
}
