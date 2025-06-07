// Unite Group Contact Information

export const CONTACT_INFO = {
  // Primary Contact Details
  email: 'support@united-group.in',
  phone: '0457 123 005',
  phoneFormatted: '+61 457 123 005',
  phoneInternational: '+61457123005',
  
  // Physical Address
  address: {
    street: 'Union Place',
    city: 'Ipswich',
    state: 'QLD',
    country: 'Australia',
    postcode: '4305',
    formatted: 'Union Place, Ipswich CBD, QLD, Australia'
  },
  
  // Business Hours (Brisbane Time)
  businessHours: {
    weekdays: '9:00 AM - 6:00 PM AEST',
    saturday: '10:00 AM - 2:00 PM AEST',
    sunday: 'Closed',
    timezone: 'Australia/Brisbane'
  },
  
  // Social Media
  social: {
    linkedin: 'https://linkedin.com/company/unite-group-au',
    twitter: 'https://twitter.com/unitegroup_au',
    facebook: 'https://facebook.com/unitegroupau',
    instagram: 'https://instagram.com/unitegroupau'
  },
  
  // Support Channels
  support: {
    email: 'support@united-group.in',
    phone: '0457 123 005',
    emergencyPhone: '0457 123 005',
    responseTime: '24 hours'
  },
  
  // Sales Inquiries
  sales: {
    email: 'sales@united-group.in',
    phone: '0457 123 005'
  },
  
  // Company Information
  company: {
    name: 'Unite Group',
    legalName: 'Unite Group Pty Ltd',
    abn: 'ABN 12 345 678 901', // Replace with actual ABN
    website: 'https://united-group.in',
    founded: '2020',
    employees: '50-100',
    industry: 'Technology Solutions'
  }
};

// Helper function to format phone number for display
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Australian mobile number
  if (cleaned.startsWith('61') && cleaned.length === 11) {
    return `+61 ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

// Helper function to generate Google Maps link
export function getGoogleMapsLink(): string {
  const { street, city, state, country } = CONTACT_INFO.address;
  const query = encodeURIComponent(`${street}, ${city} ${state}, ${country}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// Helper function to generate email link
export function getEmailLink(subject?: string): string {
  const email = CONTACT_INFO.email;
  const subjectParam = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${email}${subjectParam}`;
}

// Helper function to generate phone link
export function getPhoneLink(): string {
  return `tel:${CONTACT_INFO.phoneInternational}`;
}
