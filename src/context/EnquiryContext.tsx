import React, { createContext, useContext, useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  finish: string;
  imageUrl: string;
  description?: string;
}

interface EnquiryContextType {
  enquiryItems: Product[];
  addToEnquiry: (product: Product) => void;
  removeFromEnquiry: (productId: string) => void;
  clearEnquiry: () => void;
}

const EnquiryContext = createContext<EnquiryContextType | undefined>(undefined);

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [enquiryItems, setEnquiryItems] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('lusso_enquiry');
    if (saved) {
      try {
        setEnquiryItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved enquiry", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lusso_enquiry', JSON.stringify(enquiryItems));
  }, [enquiryItems]);

  const addToEnquiry = (product: Product) => {
    setEnquiryItems(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromEnquiry = (productId: string) => {
    setEnquiryItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearEnquiry = () => {
    setEnquiryItems([]);
  };

  return (
    <EnquiryContext.Provider value={{ enquiryItems, addToEnquiry, removeFromEnquiry, clearEnquiry }}>
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  const context = useContext(EnquiryContext);
  if (context === undefined) {
    throw new Error('useEnquiry must be used within an EnquiryProvider');
  }
  return context;
}
