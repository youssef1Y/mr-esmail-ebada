import { motion } from "framer-motion";

const FloatingWhatsApp = () => {
  return (
    <motion.a
      href="https://wa.me/201097602493"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_30px_rgba(37,211,102,0.5)] transition-all"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="تواصل عبر واتساب"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.31 22.594c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.828-6.81-8.066-7.126-.228-.316-1.916-2.55-1.916-4.862 0-2.312 1.212-3.45 1.642-3.924.39-.428 1.03-.642 1.644-.642.198 0 .376.01.536.018.472.02.708.048 1.02.79.39.926 1.338 3.266 1.456 3.504.12.238.238.554.078.87-.15.326-.278.528-.516.81-.238.282-.488.502-.726.81-.218.268-.464.554-.192 1.026.272.462 1.212 2 2.602 3.238 1.786 1.59 3.292 2.084 3.762 2.312.368.178.808.148 1.092-.148.358-.376.802-.998 1.252-1.612.32-.438.724-.494 1.122-.336.406.148 2.568 1.21 3.008 1.43.44.218.732.33.84.51.108.18.108 1.048-.282 2.148z"/>
      </svg>
    </motion.a>
  );
};

export default FloatingWhatsApp;
