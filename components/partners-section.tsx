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
    <AnimatedSection className="py-16 md:py-24 bg-slate-950">
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
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
