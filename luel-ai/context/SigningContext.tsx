"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface SigningData {
  name: string;
  date: string;
  signatureDataUrl: string | null;
}

interface SigningContextType {
  hasConsented: boolean;
  setConsented: () => void;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  pdfArrayBuffer: ArrayBuffer | null;
  setPdfArrayBuffer: (buffer: ArrayBuffer | null) => void;
  signingData: SigningData;
  setSigningData: (data: Partial<SigningData>) => void;
  resetSigningFlow: () => void;
}

const defaultSigningData: SigningData = {
  name: "",
  date: "",
  signatureDataUrl: null,
};

const SigningContext = createContext<SigningContextType | null>(null);

export function SigningProvider({ children }: { children: React.ReactNode }) {
  const [hasConsented, setHasConsented] = useState(false);
  const [pdfFile, setPdfFileState] = useState<File | null>(null);
  const [pdfArrayBuffer, setPdfArrayBufferState] = useState<ArrayBuffer | null>(null);
  const [signingData, setSigningDataState] = useState<SigningData>(defaultSigningData);

  const setConsented = useCallback(() => setHasConsented(true), []);
  const setPdfFile = useCallback((file: File | null) => setPdfFileState(file), []);
  const setPdfArrayBuffer = useCallback((buffer: ArrayBuffer | null) => setPdfArrayBufferState(buffer), []);

  const setSigningData = useCallback((data: Partial<SigningData>) => {
    setSigningDataState((prev) => ({ ...prev, ...data }));
  }, []);

  const resetSigningFlow = useCallback(() => {
    setHasConsented(false);
    setPdfFileState(null);
    setPdfArrayBufferState(null);
    setSigningDataState(defaultSigningData);
  }, []);

  return (
    <SigningContext.Provider
      value={{
        hasConsented,
        setConsented,
        pdfFile,
        setPdfFile,
        pdfArrayBuffer,
        setPdfArrayBuffer,
        signingData,
        setSigningData,
        resetSigningFlow,
      }}
    >
      {children}
    </SigningContext.Provider>
  );
}

export function useSigning() {
  const context = useContext(SigningContext);
  if (!context) {
    throw new Error("useSigning must be used within a SigningProvider");
  }
  return context;
}
