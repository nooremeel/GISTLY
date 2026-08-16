export default function BookmarkCard({ bookmark }) {
  const { title, url, note, summary, tags, collection } = bookmark;

  return (
    <div className="bookmark-card">
      <div className="bookmark-card-header">
        <a href={url} target="_blank" rel="noopener noreferrer" className="bookmark-card-title">
          {title || url || 'Untitled bookmark'}
        </a>
        <span className="bookmark-card-collection">{collection}</span>
      </div>

      {note && <p className="bookmark-card-note">{note}</p>}

      <p className="bookmark-card-summary">
        {summary || 'No summary available.'}
      </p>

      {tags?.length > 0 && (
        <div className="bookmark-card-tags">
          {tags.map((tag) => (
            <span key={tag} className="bookmark-card-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}