export const metadata = {
  title: 'Under Maintenance',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[#050505] text-white">
      <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] mb-4">
        Under Maintenance
      </h1>
      <p className="text-lg md:text-xl text-gray-400 max-w-md">
        We&apos;re working on something awesome. We&apos;ll be back shortly!
      </p>
      <div className="mt-8 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
    </div>
  );
}
