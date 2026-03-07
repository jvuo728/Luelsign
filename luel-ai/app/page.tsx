import Image from "next/image";
import RecipientSetupForm from "./components/RecipientSetupForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 py-16 px-8 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Recipient Setup and Send
          </h1>
        </div>
        <RecipientSetupForm />
      </main>
    </div>
  );
}
