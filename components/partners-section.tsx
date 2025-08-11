"use client";

import type React from "react";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";

const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => {
  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.section>
  );
};

const techPartners = [
  {
    name: "Google Cloud",
    logoUrl:
      "https://via.placeholder.com/120x60/4285F4/FFFFFF?text=Google+Cloud",
  },
  {
    name: "Microsoft ",
    logoUrl: "https://via.placeholder.com/120x60/0078D4/FFFFFF?text=Azure",
  },
  {
    name: "AWS",
    logoUrl: "https://via.placeholder.com/120x60/FF9900/FFFFFF?text=AWS",
  },
  {
    name: "Stripe",
    logoUrl: "https://via.placeholder.com/120x60/635BFF/FFFFFF?text=Stripe",
  },
  {
    name: "Salesforce",
    logoUrl: "https://via.placeholder.com/120x60/00A1E0/FFFFFF?text=Salesforce",
  },
  {
    name: "HubSpot",
    logoUrl: "https://via.placeholder.com/120x60/FF7A59/FFFFFF?text=HubSpot",
  },
];

export default function PartnersSection() {
  return (
    <AnimatedSection className="py-16 md:py-24 bg-slate-950 relative overflow-hidden">
      {/* Background Gradients and Objects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Enhanced Bold Gradient Backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/40 via-transparent to-teal-900/45"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/55 via-transparent to-cyan-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/38 via-transparent to-slate-700/45"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/42 via-transparent to-cyan-800/38"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-cyan-800/35 via-transparent to-teal-800/40"></div>
        
        {/* Large Bold Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-cyan-500/38 to-teal-500/35 rounded-full filter blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
          transition={{
            duration: 32,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/35 to-cyan-500/38 rounded-full filter blur-3xl"
          animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.85, 1] }}
          transition={{
            duration: 36,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 8,
          }}
        />
        
        {/* Bold Geometric Elements */}
        <motion.div
          className="absolute top-1/6 right-12 w-28 h-28 border-2 border-cyan-400/65 rounded-full bg-gradient-to-br from-cyan-500/38 to-transparent"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, -18, 0], 
            rotate: [0, 180, 0]
          }}
          transition={{
            duration: 28,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/6 left-12 w-24 h-24 border-2 border-teal-400/40 bg-gradient-to-br from-teal-500/15 to-transparent"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
          animate={{ 
            x: [0, 18, 0], 
            y: [0, 22, 0], 
            rotate: [0, 120, 0]
          }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        
        {/* Triangle Shape */}
        <motion.div
          className="absolute top-2/3 left-20 w-0 h-0 border-l-[15px] border-l-transparent border-b-[25px] border-b-cyan-400/45 border-r-[15px] border-r-transparent"
          animate={{ 
            x: [0, 12, 0], 
            y: [0, -18, 0], 
            rotate: [0, 60, 0]
          }}
          transition={{
            duration: 24,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        
        {/* Diamond Shape */}
        <motion.div
          className="absolute bottom-1/3 right-20 w-16 h-16 border-2 border-teal-300/50 bg-gradient-to-br from-teal-400/20 to-transparent"
          style={{
            transform: 'rotate(45deg)'
          }}
          animate={{ 
            x: [0, -18, 0], 
            y: [0, 25, 0], 
            rotate: [45, 225, 45]
          }}
          transition={{
            duration: 26,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 4,
          }}
        />
        
        {/* Additional Geometric Elements */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-18 h-18 border-2 border-cyan-300/55 bg-gradient-to-br from-cyan-400/22 to-transparent"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
          animate={{ 
            x: [0, 22, 0], 
            y: [0, -20, 0], 
            rotate: [0, 90, 0]
          }}
          transition={{
            duration: 22,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-14 h-14 border-2 border-teal-300/50 bg-gradient-to-br from-teal-400/18 to-transparent"
          style={{
            transform: 'rotate(45deg)'
          }}
          animate={{ 
            x: [0, -22, 0], 
            y: [0, 30, 0], 
            rotate: [45, -135, 45]
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 5,
          }}
        />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/3 right-1/3 w-4 h-4 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-full shadow-lg shadow-cyan-400/30"
          animate={{ 
            y: [0, -35, 0],
            opacity: [0.8, 1, 0.8],
            scale: [1, 1.15, 1]
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-gradient-to-r from-teal-400/60 to-cyan-400/60 rounded-full shadow-lg shadow-teal-400/30"
          animate={{ 
            y: [0, 28, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        
        <motion.div
          className="absolute top-2/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-cyan-300/70 to-teal-300/70 rounded-full"
          animate={{ 
            y: [0, -22, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 16,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 6,
          }}
        />
        
        <motion.div
          className="absolute bottom-2/3 right-1/4 w-2 h-2 bg-gradient-to-r from-teal-300/70 to-cyan-300/70 rounded-full"
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 14,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 7,
          }}
        />
        
        <motion.div
          className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400/65 to-teal-400/65 rounded-full"
          animate={{ 
            y: [0, -18, 0],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 17,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        
        <motion.div
          className="absolute bottom-1/2 right-1/3 w-1 h-1 bg-gradient-to-r from-teal-400/65 to-cyan-400/65 rounded-full"
          animate={{ 
            y: [0, 16, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 9,
          }}
        />
      </div>
      
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Our Strategic Alliances & Technology Partners
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300">
            Collaborating with industry leaders to deliver best-in-class
            solutions and drive innovation.
          </p>
        </div>

        {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 mb-16 items-center">
          {techPartners.map((partner, idx) => (
            <motion.div
              key={partner.name}
              className="flex justify-center items-center p-4 bg-slate-800/50 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true, amount: 0.5 }}
            >
              <span className="text-white text-2xl font-semibold">
                {partner.name}
              </span>
            </motion.div>
          ))}
        </div> */}

        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 p-8 md:p-12 rounded-xl shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <motion.div
            className="md:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <span className="inline-block bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
              Strategic Partnership
            </span>
            <h2 className="text-3xl font-semibold text-white mb-4">
              Unite Group <span className="text-cyan-400">x</span> CARSI
              Education
            </h2>
            <p className="text-slate-300 mb-6">
              Combining business consulting excellence with industry-leading
              education and certification programs. We empower professionals
              across Australia and New Zealand with IICRC approved training and
              comprehensive skill development.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6 text-slate-200">
              <div className="flex items-center">
                <CheckCircle
                  size={18}
                  className="text-cyan-400 mr-2 flex-shrink-0"
                />{" "}
                IICRC Approved School
              </div>
              <div className="flex items-center">
                <CheckCircle
                  size={18}
                  className="text-cyan-400 mr-2 flex-shrink-0"
                />{" "}
                Industry Trained Professionals
              </div>
              <div className="flex items-center">
                <CheckCircle
                  size={18}
                  className="text-cyan-400 mr-2 flex-shrink-0"
                />{" "}
                500+ Certifications Issued
              </div>
              <div className="flex items-center">
                <CheckCircle
                  size={18}
                  className="text-cyan-400 mr-2 flex-shrink-0"
                />{" "}
                Comprehensive Leadership Programs
              </div>
            </div>
            <motion.a
              href="/contact" // Assuming you have a contact page
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-300 inline-flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Training Programs
              <ArrowRight
                size={18}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </motion.a>
          </motion.div>
          <motion.div
            className="md:w-1/2 mt-8 md:mt-0"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Image
              src="/professional-training-collaboration.png"
              alt="CARSI Education Partnership"
              width={500}
              height={350}
              className="rounded-lg shadow-xl object-cover mx-auto"
            />
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
