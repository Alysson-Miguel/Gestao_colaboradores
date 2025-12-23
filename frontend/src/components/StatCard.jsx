export default function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="w-10 h-10 bg-brand/15 text-brand rounded-lg flex items-center justify-center mb-4">
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <p className="text-3xl font-bold text-text">{value}</p>
      <p className="text-sm text-muted">{title}</p>
    </div>
  );
}
