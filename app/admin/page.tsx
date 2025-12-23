import StatCard from "@/components/StatCard";

export default function Dashboard() {
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Mobile Users" value="12,430" />
      <StatCard title="Pending Vendors" value="32" />
      <StatCard title="Approved Vendors" value="210" />
      <StatCard title="Rejected Vendors" value="14" />
    </div>
  );
}
