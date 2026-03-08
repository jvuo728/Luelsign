import { SigningProvider } from "@/context/SigningContext";

export default function SigningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SigningProvider>{children}</SigningProvider>;
}
