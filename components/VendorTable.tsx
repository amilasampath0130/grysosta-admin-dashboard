export default function VendorTable() {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3">ABC Store</td>
            <td className="p-3">abc@mail.com</td>
            <td className="p-3">
              <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                Pending
              </span>
            </td>
            <td className="p-3 flex gap-2">
              <button className="text-blue-600">View</button>
              <button className="text-green-600">Approve</button>
              <button className="text-red-600">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
