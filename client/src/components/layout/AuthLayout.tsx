import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PosTerminalMockup } from '../visuals/PosTerminalMockup';
import { DotPattern } from '../visuals/DotPattern';
import { AmbientGlow } from '../visuals/AmbientGlow';
import { motion } from 'framer-motion';
import { pageVariants, staggerContainer, staggerItem } from '../../lib/motion';
import { EditorialHeading, EditorialSubtext } from '../typography/EditorialHeading';

export interface AuthLayoutProps {
  children: React.ReactNode;
  showPreview?: boolean;
  title?: React.ReactNode;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showPreview = true,
  title = (
    <>
      Retail POS for<br />Ghanaian businesses.
    </>
  ),
  subtitle = 'Set up your store in minutes, accept MoMo & Cash, and start selling.',
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden relative selection:bg-[#0D5C3A]/20 selection:text-[#0D5C3A]">
      {/* Background Plane: Subtle dot texture & controlled ambient glow */}
      <DotPattern variant="dark" size="md" opacity={0.35} />
      <AmbientGlow color="emerald" position="top-left" className="opacity-40" />
      <AmbientGlow color="amber" position="bottom-right" className="opacity-25" />

      {/* Header with clear hierarchy and no competing badges */}
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-14 relative z-10 flex flex-col justify-center">
        {showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Visual Anchor & Product Introduction */}
            <motion.div 
              className="lg:col-span-7 flex flex-col justify-center"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Primary Message */}
              <div className="max-w-xl">
                <motion.div variants={staggerItem}>
                  <EditorialHeading variant="h1" className="mb-4 text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#062F1D]">
                    {title}
                  </EditorialHeading>
                </motion.div>
                
                <motion.div variants={staggerItem}>
                  <EditorialSubtext className="text-slate-600 text-base sm:text-lg leading-relaxed">
                    {subtitle}
                  </EditorialSubtext>
                </motion.div>
              </div>

              {/* Primary Visual Anchor: POS Product Preview */}
              <motion.div 
                variants={staggerItem} 
                className="mt-8 lg:mt-10 relative w-full max-w-xl"
              >
                {/* Controlled ambient glow behind device */}
                <div className="absolute inset-x-8 -bottom-6 h-28 bg-[#0D5C3A]/15 blur-3xl rounded-full pointer-events-none" />
                
                {/* Mockup Container */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-white/70 backdrop-blur-md p-2.5 shadow-xl shadow-slate-200/50">
                  <div className="rounded-xl overflow-hidden border border-slate-100">
                    <PosTerminalMockup />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT COLUMN: Focused Action Form */}
            <motion.div 
              className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>

          </div>
        ) : (
          <motion.div 
            className="max-w-4xl mx-auto w-full min-h-[60vh] flex flex-col justify-center relative z-20"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};
