import { Navbar } from '@/modules/home/ui/components/navbar';

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col min-h-screen max-h-screen">
      <Navbar />
      <div className="absolute inset-0 -z-10 w-full h-full bg-background dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)] bg-[radial-gradient(#dadde2_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="flex flex-1 flex-col px-4 pb-4">{children}</div>
    </main>
  );
}
