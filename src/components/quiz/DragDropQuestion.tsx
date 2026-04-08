import { useMemo, useState } from "react";
import type { DragDropItemOut, DragDropMappingIn } from "../../types/quiz.types";

type Props = {
  items: DragDropItemOut[];
  value: DragDropMappingIn[];
  onChange: (next: DragDropMappingIn[]) => void;
};

function buildCurrentMap(value: DragDropMappingIn[]) {
  const map: Record<string, string> = {};
  for (const row of value) {
    if (!row.item_key || !row.target_key) continue; // ✅ CLEAN
    map[row.item_key] = row.target_key;
  }
  return map;
}

export default function DragDropQuestion({ items, value, onChange }: Props) {
  const [draggingItemKey, setDraggingItemKey] = useState<string>("");

  // ✅ CLEAN incoming mappings (fix ghost answers)
  const safeValue = useMemo(
    () => value.filter((v) => v.item_key && v.target_key),
    [value]
  );

  const currentMap = useMemo(() => buildCurrentMap(safeValue), [safeValue]);

  // ✅ ONLY VALID TARGETS (2 slots only)
  const targets = useMemo(() => {
    const map = new Map<string, string>();

    for (const item of items) {
      if (!item.target_key || !item.target_label) continue;

      if (!map.has(item.target_key)) {
        map.set(item.target_key, item.target_label);
      }
    }

    return Array.from(map.entries()).map(([target_key, target_label]) => ({
      target_key,
      target_label,
    }));
  }, [items]);

  // ✅ UNPLACED ITEMS (3 draggable)
  const unplacedItems = useMemo(() => {
    const placedKeys = new Set(Object.keys(currentMap));
    return items.filter((item) => !placedKeys.has(item.item_key));
  }, [items, currentMap]);

  function assign(itemKey: string, targetKey: string) {
    // ❌ prevent duplicate slot
    const alreadyUsed = safeValue.find((v) => v.target_key === targetKey);
    if (alreadyUsed) return;

    const next = safeValue.filter((v) => v.item_key !== itemKey);
    next.push({ item_key: itemKey, target_key: targetKey });

    onChange(next);
  }

  function clearTarget(targetKey: string) {
    const next = safeValue.filter((v) => v.target_key !== targetKey);
    onChange(next);
  }

  function removePlacedItem(itemKey: string) {
    const next = safeValue.filter((v) => v.item_key !== itemKey);
    onChange(next);
  }

  if (!items.length) {
    return <div className="dragEmpty">No draggable items found.</div>;
  }

  return (
    <div className="dragQuiz">
      <div className="dragPreviewBoard">
        <div className="dragPreviewTitle">Drag and Drop Activity</div>
        <div className="dragPreviewHint">
          Drag each item below and drop it into the correct target slot.
        </div>
      </div>

      {/* DRAG ITEMS */}
      <div className="dragBank">
        <h4 className="dragTitle">Draggable Items</h4>

        <div className="dragBankGrid">
          {unplacedItems.map((item) => (
            <button
              key={item.item_key}
              type="button"
              className="dragChip"
              draggable
              onDragStart={() => setDraggingItemKey(item.item_key)}
              onDragEnd={() => setDraggingItemKey("")}
            >
              {item.item_text}
            </button>
          ))}

          {!unplacedItems.length && (
            <div className="dragEmpty">All items are placed.</div>
          )}
        </div>
      </div>

      {/* DROP TARGETS (2 ONLY) */}
      <div className="dragTargets">
        <h4 className="dragTitle">Drop Targets</h4>

        <div className="dragTargetGrid">
          {targets.map((target) => {
            const placed = safeValue.find(
              (v) => v.target_key === target.target_key
            );

            const placedItem = items.find(
              (x) => x.item_key === placed?.item_key
            );

            return (
              <div
                key={target.target_key}
                className={`dragSlot ${draggingItemKey ? "dragSlotActive" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggingItemKey) return;
                  assign(draggingItemKey, target.target_key);
                  setDraggingItemKey("");
                }}
              >
                <div className="dragSlotLabel">{target.target_label}</div>

                {placedItem ? (
                  <div className="dragPlaced">
                    <span>{placedItem.item_text}</span>
                    <button
                      type="button"
                      className="dragMiniBtn"
                      onClick={() => removePlacedItem(placedItem.item_key)}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="dragPlaceholder">Drop here</div>
                )}

                {placedItem && (
                  <button
                    type="button"
                    className="dragClearBtn"
                    onClick={() => clearTarget(target.target_key)}
                  >
                    Clear Slot
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}