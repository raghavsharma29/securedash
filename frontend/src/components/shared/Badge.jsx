export default function Badge({ value, type = "severity" }) {
  if (!value) return null;
  const cls = type === "severity" ? `badge badge-${value}` : `badge badge-${value?.replace(" ", "_")}`;
  return <span className={cls}>{value}</span>;
}
