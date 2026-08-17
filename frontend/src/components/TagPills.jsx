export default function TagPills({ tags, activeTag, onSelectTag }) {
  if (!tags.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0' }}>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelectTag(activeTag === tag ? null : tag)}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            border: activeTag === tag ? '2px solid #333' : '1px solid #ccc',
            background: activeTag === tag ? '#333' : '#fff',
            color: activeTag === tag ? '#fff' : '#333',
            cursor: 'pointer',
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}