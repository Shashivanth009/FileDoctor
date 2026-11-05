import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, title, description, children, actions }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-surface-navy border border-border-color rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex items-center justify-between p-5 border-b border-border-color">
            <div>
              <h2 className="text-lg font-semibold font-heading text-main-white">{title}</h2>
              {description && <p className="text-sm text-muted-white mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-elevated-navy text-muted-white hover:text-main-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {actions && (
            <div className="flex justify-end gap-2 p-5 border-t border-border-color">
              {actions}
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

