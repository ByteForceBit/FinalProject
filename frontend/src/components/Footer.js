import React from 'react';
import { Mail, Phone, ExternalLink, Headset, Facebook, Twitter, Linkedin } from 'lucide-react';

// Reusable Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-purple-700/50 mt-6 pt-4 pb-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs">
          
          {/* Section 1: Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">TaxTracker</h3>
            <ul className="space-y-1">
              <li><a href="#" className="text-purple-300 hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="#" className="text-purple-300 hover:text-white transition-colors">Scan Receipt</a></li>
              <li><a href="#" className="text-purple-300 hover:text-white transition-colors">Transactions</a></li>
              <li><a href="#" className="text-purple-300 hover:text-white transition-colors">Risk Analysis</a></li>
            </ul>
          </div>
          
          {/* Section 2: Support & Help */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Support</h3>
            <ul className="space-y-1">
              <li><a href="#" className="text-purple-300 hover:text-white transition-colors flex items-center gap-1">
                <ExternalLink className="w-3 h-3"/> Help Center
              </a></li>
              <li><a href="#" className="text-purple-300 hover:text-white transition-colors flex items-center gap-1">
                <ExternalLink className="w-3 h-3"/> FAQs
              </a></li>
              <li><a href="#" className="text-purple-300 hover:text-white transition-colors flex items-center gap-1">
                <ExternalLink className="w-3 h-3"/> Security & Privacy
              </a></li>
            </ul>
          </div>

          {/* Section 3: Contact Info */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-sm font-semibold text-white mb-2">Contact Us</h3>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-purple-300">
                <Headset className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> 
                <span className="font-bold text-white">Toll-Free:</span> 1800-TAX-HELP
              </p>
              <p className="flex items-center gap-1.5 text-purple-300">
                <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="font-bold text-white">Sales:</span> +91 98765 43210
              </p>
              <p className="flex items-center gap-1.5 text-purple-300">
                <Mail className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                <span className="font-bold text-white">Email:</span> support@taxtracker.io
              </p>
            </div>
          </div>
          
          {/* Section 4: Socials */}
          <div className="col-span-2 md:col-span-1">
             <h3 className="text-sm font-semibold text-white mb-2">Follow Us</h3>
             <div className="flex space-x-3">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-blue-400 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-blue-600 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-blue-700 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
             </div>
          </div>
        </div>

        {/* Copyright and Bottom Text */}
        <div className="border-t border-purple-800 pt-2 mt-2 text-center">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} TaxTracker Pro. All rights reserved. | Built for modern financial clarity.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
