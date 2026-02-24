import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const containerVariants = (staggerDelay = 0.1) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export const StaggerContainer = ({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) => (
  <motion.div
    variants={containerVariants(staggerDelay)}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }: StaggerItemProps) => (
  <motion.div variants={itemVariants} className={className}>
    {children}
  </motion.div>
);
