// src/pages/test-kalkulacka/components/SortableFileList.jsx
import React, { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import '../../../styles/animations.css';

// --- Styles ---

const styles = {
  container: {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-lg)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    fontSize: 'var(--forge-text-base)',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.625rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    backgroundColor: 'var(--forge-bg-elevated)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
    position: 'relative',
    userSelect: 'none',
  },
  cardSelected: {
    backgroundColor: 'var(--forge-accent-primary)',
    borderColor: 'var(--forge-accent-primary)',
    color: 'var(--forge-bg-void)',
  },
  cardDragging: {
    opacity: 0.4,
    borderStyle: 'dashed',
    borderColor: 'var(--forge-accent-primary)',
  },
  dragHandle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    color: 'var(--forge-text-muted)',
    flexShrink: 0,
    width: '1rem',
    opacity: 0.5,
    transition: 'opacity 0.15s',
  },
  dragHandleActive: {
    cursor: 'grabbing',
  },
  statusIcon: {
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  fileName: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileNameSelected: {
    color: 'var(--forge-bg-void)',
  },
  fileMeta: {
    fontSize: '10px',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-mono)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileMetaSelected: {
    color: 'rgba(8, 9, 12, 0.6)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '10px',
    fontFamily: 'var(--forge-font-mono)',
    padding: '0.125rem 0.375rem',
    borderRadius: '999px',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  removeBtn: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: 'var(--forge-radius-sm)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--forge-text-muted)',
    transition: 'color 0.15s, background 0.15s',
    padding: 0,
  },
  overlayCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.625rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-accent-primary)',
    backgroundColor: 'var(--forge-bg-surface)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--forge-accent-primary)',
    transform: 'scale(1.02)',
    opacity: 0.95,
    pointerEvents: 'none',
    userSelect: 'none',
  },
  errorText: {
    fontSize: '10px',
    marginTop: '2px',
    paddingLeft: '1.5rem',
  },
};

// --- Status helpers ---

const STATUS_CONFIG = {
  pending: {
    icon: 'Clock',
    label: 'Ceka',
    color: 'var(--forge-text-muted)',
    bg: 'var(--forge-bg-elevated)',
    borderColor: 'var(--forge-border-default)',
  },
  processing: {
    icon: 'Loader',
    label: 'Zpracovava se',
    color: 'var(--forge-warning)',
    bg: 'rgba(255, 171, 0, 0.08)',
    borderColor: 'rgba(255, 171, 0, 0.3)',
    animate: true,
  },
  completed: {
    icon: 'CheckCircle',
    label: 'Hotovo',
    color: 'var(--forge-success)',
    bg: 'rgba(0, 212, 170, 0.08)',
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  failed: {
    icon: 'XCircle',
    label: 'Chyba',
    color: 'var(--forge-error)',
    bg: 'rgba(255, 86, 48, 0.08)',
    borderColor: 'rgba(255, 86, 48, 0.3)',
  },
};

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- Grip dots SVG (6 dots in 2x3 grid) ---

function GripDots({ color = 'currentColor', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="5" cy="3" r="1.2" fill={color} />
      <circle cx="9" cy="3" r="1.2" fill={color} />
      <circle cx="5" cy="7" r="1.2" fill={color} />
      <circle cx="9" cy="7" r="1.2" fill={color} />
      <circle cx="5" cy="11" r="1.2" fill={color} />
      <circle cx="9" cy="11" r="1.2" fill={color} />
    </svg>
  );
}

// --- Sortable File Card ---

function SortableFileCard({
  file,
  isSelected,
  onSelect,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusCfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;

  const cardStyle = {
    ...styles.card,
    ...(isSelected && !isDragging ? styles.cardSelected : {}),
    ...(isDragging ? styles.cardDragging : {}),
    ...style,
  };

  const handleClick = (e) => {
    // Don't select when clicking remove button
    if (e.target.closest('[data-remove-btn]')) return;
    onSelect(file.id);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(file);
  };

  const handleRemoveKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onRemove(file);
    }
  };

  return (
    <div ref={setNodeRef} style={cardStyle} onClick={handleClick}>
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          ...styles.dragHandle,
          ...(isDragging ? styles.dragHandleActive : {}),
        }}
        title="Pretahnout pro zmenu poradi"
        aria-label={`Pretahnout ${file.name}`}
        aria-roledescription="sortable"
      >
        <GripDots
          color={isSelected ? 'var(--forge-bg-void)' : 'var(--forge-text-muted)'}
          size={12}
        />
      </div>

      {/* Status icon */}
      <div style={styles.statusIcon}>
        <Icon
          name={statusCfg.icon}
          size={14}
          className={statusCfg.animate ? 'animate-spin' : ''}
          style={{
            color: isSelected ? 'var(--forge-bg-void)' : statusCfg.color,
          }}
        />
      </div>

      {/* File info */}
      <div style={styles.fileInfo}>
        <span
          style={{
            ...styles.fileName,
            ...(isSelected ? styles.fileNameSelected : {}),
          }}
          title={file.name}
        >
          {file.name}
        </span>
        <span
          style={{
            ...styles.fileMeta,
            ...(isSelected ? styles.fileMetaSelected : {}),
          }}
        >
          {formatFileSize(file.size)}
          {file.status === 'completed' && file.result?.metrics
            ? ` \u2022 ${Math.round((file.result.metrics.estimatedTimeSeconds || 0) / 60)} min`
            : ''}
        </span>
      </div>

      {/* Status badge */}
      <div
        style={{
          ...styles.statusBadge,
          color: isSelected ? 'var(--forge-bg-void)' : statusCfg.color,
          backgroundColor: isSelected ? 'rgba(8, 9, 12, 0.15)' : statusCfg.bg,
          border: `1px solid ${isSelected ? 'rgba(8, 9, 12, 0.2)' : statusCfg.borderColor}`,
        }}
      >
        {statusCfg.label}
      </div>

      {/* Remove button */}
      <button
        data-remove-btn
        style={{
          ...styles.removeBtn,
          color: isSelected ? 'rgba(8, 9, 12, 0.5)' : 'var(--forge-text-muted)',
        }}
        onClick={handleRemove}
        onKeyDown={handleRemoveKeyDown}
        title={`Odebrat ${file.name}`}
        aria-label={`Odebrat ${file.name}`}
        tabIndex={0}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--forge-error)';
          e.currentTarget.style.background = 'rgba(255, 86, 48, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isSelected ? 'rgba(8, 9, 12, 0.5)' : 'var(--forge-text-muted)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Icon name="X" size={12} />
      </button>
    </div>
  );
}

// --- Overlay card for drag preview ---

function FileCardOverlay({ file }) {
  if (!file) return null;

  const statusCfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;

  return (
    <div style={styles.overlayCard}>
      <div style={styles.dragHandle}>
        <GripDots size={12} />
      </div>
      <div style={styles.statusIcon}>
        <Icon name={statusCfg.icon} size={14} style={{ color: statusCfg.color }} />
      </div>
      <div style={styles.fileInfo}>
        <span style={styles.fileName}>{file.name}</span>
        <span style={styles.fileMeta}>{formatFileSize(file.size)}</span>
      </div>
      <div
        style={{
          ...styles.statusBadge,
          color: statusCfg.color,
          backgroundColor: statusCfg.bg,
          border: `1px solid ${statusCfg.borderColor}`,
        }}
      >
        {statusCfg.label}
      </div>
    </div>
  );
}

// --- Main SortableFileList ---

const SortableFileList = ({
  uploadedFiles,
  selectedFileId,
  onSelectFile,
  onRemoveFile,
  onReorderFiles,
  onAddModel,
}) => {
  const [activeId, setActiveId] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts (prevents accidental drags on click)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // File IDs for SortableContext
  const fileIds = useMemo(
    () => uploadedFiles.map((f) => f.id),
    [uploadedFiles]
  );

  const activeFile = activeId
    ? uploadedFiles.find((f) => f.id === activeId)
    : null;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = uploadedFiles.findIndex((f) => f.id === active.id);
    const newIndex = uploadedFiles.findIndex((f) => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(uploadedFiles, oldIndex, newIndex);
    onReorderFiles(reordered);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (!uploadedFiles || uploadedFiles.length === 0) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>
          Nahrane modely ({uploadedFiles.length})
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddModel}
          title="Pridat model"
          aria-label="Pridat model"
        >
          <Icon name="Plus" size={16} />
        </Button>
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
          <div style={styles.listContainer} role="list" aria-label="Seznam nahranch modelu">
            {uploadedFiles.map((file, idx) => (
              <div
                key={file.id}
                role="listitem"
                className="slide-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <SortableFileCard
                  file={file}
                  isSelected={selectedFileId === file.id}
                  onSelect={onSelectFile}
                  onRemove={onRemoveFile}
                />
                {/* Error detail below card */}
                {file.status === 'failed' && file.error && (
                  <p
                    style={{
                      ...styles.errorText,
                      color: file.errorSeverity === 'warning'
                        ? 'var(--forge-warning)'
                        : 'var(--forge-error)',
                    }}
                    title={file.errorRaw || file.error}
                  >
                    {file.error}
                  </p>
                )}
                {/* Processing progress below card */}
                {file.status === 'processing' && (
                  <div style={{ paddingLeft: '1.5rem', marginTop: '2px' }}>
                    <div
                      style={{
                        height: '3px',
                        backgroundColor: 'var(--forge-bg-elevated)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="animate-pulse"
                        style={{
                          height: '100%',
                          width: '60%',
                          backgroundColor: 'var(--forge-accent-primary)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay (elevated clone during drag) */}
        <DragOverlay dropAnimation={null}>
          {activeFile ? <FileCardOverlay file={activeFile} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default SortableFileList;
