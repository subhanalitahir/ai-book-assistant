"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";

const floatingVariants = {
  initial: { y: 0, opacity: 0 },
  animate: {
    y: [0, -10, 0],
    opacity: 1,
    transition: {
      y: {
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
      opacity: { duration: 0.5 },
    },
  },
};

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(102,56,32,0.28),_transparent_30%),linear-gradient(180deg,_#090b10_0%,_#0f1219_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <motion.div
        className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.div
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
          variants={floatingVariants}
          initial="initial"
          animate="animate"
        >
          <BookOpen className="h-9 w-9 text-[#e7c8ad]" />
        </motion.div>

        <motion.p
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.34em] text-white/70 backdrop-blur-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Sparkles className="h-4 w-4" />
          Lost in the margins
        </motion.p>

        <motion.h1
          className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55 }}
        >
          This chapter does not exist.
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55 }}
        >
          The page you tried to open has slipped between the pages. Return to
          your library and continue the conversation from a known shelf.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d8c6] px-6 py-3 text-sm font-semibold text-[#11131a] shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#f5e3d8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to library
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/books/new"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur-xl transition-colors hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4" />
              Add a new book
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </main>
  );
}
