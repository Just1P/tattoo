import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="relative w-full h-full  overflow-hidden">
          <Image
            src="/auth/auth-img.jpg"
            alt="Tattoo art"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-4">
        {children}
      </div>
    </div>
  );
}
