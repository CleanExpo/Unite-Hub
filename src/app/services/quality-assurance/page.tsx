import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quality Assurance Services | Unite Group',
  description: 'Professional quality assurance and testing services to ensure your software meets the highest standards.',
};

export default function QualityAssurancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Quality Assurance Services
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Ensure your software meets the highest standards with our comprehensive quality assurance and testing services.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Manual Testing</h2>
              <p className="text-gray-600">
                Comprehensive manual testing to identify usability issues and ensure optimal user experience.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Automated Testing</h2>
              <p className="text-gray-600">
                Efficient automated testing solutions to catch bugs early and ensure consistent quality.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Performance Testing</h2>
              <p className="text-gray-600">
                Load and stress testing to ensure your application performs under real-world conditions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Security Testing</h2>
              <p className="text-gray-600">
                Comprehensive security assessments to protect your application from vulnerabilities.
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Why Choose Our QA Services?</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Experienced QA professionals with industry expertise</li>
              <li>Comprehensive testing strategies tailored to your needs</li>
              <li>Advanced testing tools and methodologies</li>
              <li>Detailed reporting and actionable insights</li>
              <li>Continuous improvement and optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}