'use client';

import { motion } from "framer-motion";
import Image from "next/image";

const clients = [
  { name: "Microsoft", logo: "/images/clients/microsoft.svg" },
  { name: "Google", logo: "/images/clients/google.svg" },
  { name: "Amazon", logo: "/images/clients/amazon.svg" },
  { name: "Salesforce", logo: "/images/clients/salesforce.svg" },
  { name: "Oracle", logo: "/images/clients/oracle.svg" },
  { name: "IBM", logo: "/images/clients/ibm.svg" },
  { name: "SAP", logo: "/images/clients/sap.svg" },
  { name: "Adobe", logo: "/images/clients/adobe.svg" },
];

export function ClientLogosCarousel() {
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join 500+ companies that rely on Unite Group for their digital transformation
          </p>
        </div>
        
        {/* Infinite scroll carousel */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex space-x-12"
            animate={{
              x: [0, -1920],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {/* Double the logos for seamless loop */}
            {[...clients, ...clients].map((client, index) => (
              <div
                key={`${client.name}-${index}`}
                className="flex-shrink-0 w-40 h-20 flex items-center justify-center"
              >
                <div className="relative w-32 h-16 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                  {/* Unite Group for actual logos */}
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {client.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
