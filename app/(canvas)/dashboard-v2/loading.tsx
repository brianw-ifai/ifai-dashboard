export default function DashboardV2Loading() {
  return (
    <div className="dv2-loading" role="status" aria-live="polite" style={{ display: "grid", placeItems: "center", height: "100%", padding: 24 }}>
      <p style={{ margin: 0 }}>Loading the readings</p>
    </div>
  );
}
