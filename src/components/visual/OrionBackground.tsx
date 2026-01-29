import { motion, useReducedMotion } from "framer-motion";

export function OrionBackground() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />

      {/* Nebula blobs */}
      <motion.div
        className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        animate={reduce ? undefined : { y: [0, 18, 0], scale: [1, 1.06, 1] }}
        transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-44 right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-secondary/14 blur-3xl"
        animate={reduce ? undefined : { y: [0, -16, 0], scale: [1, 1.08, 1] }}
        transition={reduce ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-accent/12 blur-3xl"
        animate={reduce ? undefined : { x: [0, 24, 0], y: [0, -10, 0], scale: [1, 1.04, 1] }}
        transition={reduce ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Star field (cheap) */}
      <div className="absolute inset-0 opacity-60 cinematic-noise" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/80" />
    </div>
  );
}
