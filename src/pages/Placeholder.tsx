export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-[#800000]/30 bg-white p-6">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">This feature is currently not available.</p>
    </div>
  );
}
