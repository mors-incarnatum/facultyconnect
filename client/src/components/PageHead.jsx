export default function PageHead({ title, subtitle }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
