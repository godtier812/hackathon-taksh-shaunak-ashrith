import type { Metadata } from "next"
import Link from "next/link"

import { LegalArticle, LegalContact, LegalSummary } from "@/components/legal/legal-article"

export const metadata: Metadata = {
  title: "Medical Disclaimer · MindTrace",
  description:
    "MindTrace is not a medical device and does not diagnose, predict or treat any condition.",
}

export default function MedicalDisclaimerPage() {
  return (
    <LegalArticle
      eyebrow="Legal"
      title="Medical Disclaimer"
      intro={
        <p>
          MindTrace helps caregivers notice gradual changes in how someone communicates. It is designed to support
          conversations with healthcare professionals, never to replace them.
        </p>
      }
    >
      <LegalSummary
        title="Please read"
        items={[
          <>MindTrace does not diagnose, predict or treat any disease or condition, including dementia.</>,
          <>It is not a medical device and has not been reviewed, cleared or approved by the FDA or any regulator.</>,
          <>Changes in communication have many ordinary causes. Only a qualified professional can assess them.</>,
          <>In an emergency, call 911 or your local emergency number right away.</>,
        ]}
      />

      <h2 id="not-diagnostic">Not a diagnostic tool</h2>
      <p>
        MindTrace compares a person only with their own earlier baseline. Its indicators (pauses, repetition,
        vocabulary diversity, speech rate and semantic coherence) and its composite index are demonstration measures.
        They are not clinical tests, screening results or risk scores, and they have not been clinically validated.
        MindTrace does not tell you whether someone has, or will develop, any condition.
      </p>

      <h2 id="causes">Changes can have many causes</h2>
      <p>
        The way a person speaks can change with tiredness, stress, illness, a cold, hearing difficulties, medications,
        mood, a new environment, or simply the topic of a conversation. A change in MindTrace is a prompt to pay
        attention, not a conclusion. Please do not draw medical conclusions from it on your own.
      </p>

      <h2 id="professional">Talk to a professional</h2>
      <p>
        If you are worried about someone&rsquo;s memory, thinking or communication, speak with their doctor or another
        qualified healthcare professional. You may choose to bring a MindTrace summary to that appointment. It is
        intended only as background for the conversation, and the professional will decide what matters. Never delay
        or disregard professional advice because of something shown in MindTrace.
      </p>

      <h2 id="emergencies">Emergencies</h2>
      <p>
        MindTrace is not monitored and cannot respond to emergencies. Sudden confusion, difficulty speaking, facial
        drooping or weakness can be signs of a medical emergency. Call 911 or your local emergency number immediately.
      </p>

      <h2 id="demo-data">Demo data</h2>
      <p>
        Margaret Reynolds is a fictional person. All values, charts, notes and summaries shown in the current version
        of MindTrace are synthetic and exist only to demonstrate how the product works. See also our{" "}
        <Link href="/terms">terms of use</Link> and <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2 id="contact">Contact</h2>
      <LegalContact />
    </LegalArticle>
  )
}
