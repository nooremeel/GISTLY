export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search bookmarks..."
      aria-label="Search bookmarks"
      style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
    />
  );
}