export default function StatCard({ title, value }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}
