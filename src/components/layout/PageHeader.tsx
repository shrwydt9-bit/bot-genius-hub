import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-gradient">{title}</span>
        </h1>
        {subtitle ? <p className="text-muted-foreground text-lg max-w-2xl">{subtitle}</p> : null}
      </motion.div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
