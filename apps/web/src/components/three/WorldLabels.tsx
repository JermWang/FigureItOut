'use client';

import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useWorldStore } from '@/store/world-store';

export default function WorldLabels() {
  const labels = useWorldStore((s) => s.labels);
  const arr = Array.from(labels.values());
  if (arr.length === 0) return null;

  return (
    <>
      {arr.map((label) => (
        <Html
          key={label.id}
          position={[label.position.x + 0.5, label.position.y + 1.6, label.position.z + 0.5]}
          center
          distanceFactor={18}
          occlude={false}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.65)',
              border: `1px solid ${label.color}`,
              borderRadius: 6,
              padding: '3px 8px',
              color: label.color,
              fontSize: 11,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxShadow: `0 0 8px ${label.color}55`,
              userSelect: 'none',
            }}
          >
            <span style={{ opacity: 0.55, fontSize: 9, marginRight: 4 }}>
              {label.agentName}
            </span>
            {label.text}
          </div>
          {/* stem line */}
          <div
            style={{
              width: 1,
              height: 12,
              background: label.color,
              opacity: 0.5,
              margin: '0 auto',
            }}
          />
        </Html>
      ))}
    </>
  );
}
