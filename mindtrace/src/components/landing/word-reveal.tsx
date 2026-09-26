"use client"

import { motion } from "motion/react"
import { Fragment } from "react"

import { easeOut } from "@/lib/motion"

/**
 * Masked word-by-word rise for the hero headline. Each word slides up from
 * behind its own clip, so the reveal works for any line wrapping. `lines`
 * are joined with breaks that only apply from the md breakpoint up; on small
 * screens the text wraps naturally.
 */
export function WordReveal({
  lines,
  delay = 0,
  stagger = 0.03,
}: {
  lines: string[]
  delay?: number
  stagger?: number
}) {
  const offsets = lines.map((_, li) =>
    lines.slice(0, li).reduce((count, line) => count + line.split(" ").length, 0)
  )
  return (
    <>
      {lines.map((line, lineIndex) => {
        const words = line.split(" ")
        return (
          <Fragment key={line}>
            {lineIndex > 0 ? (
              <>
                {" "}
                <br className="hidden md:inline" />
              </>
            ) : null}
            {words.map((word, i) => {
              const order = offsets[lineIndex] + i
              return (
                <Fragment key={`${word}-${i}`}>
                  <span className="-mb-[0.1em] inline-block overflow-hidden pb-[0.1em] align-top">
                    <motion.span
                      className="inline-block"
                      initial={{ y: "105%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.55, delay: delay + order * stagger, ease: easeOut }}
                    >
                      {word}
                    </motion.span>
                  </span>
                  {i < words.length - 1 ? " " : null}
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </>
  )
}
