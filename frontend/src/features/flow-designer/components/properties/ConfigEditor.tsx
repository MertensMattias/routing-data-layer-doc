import { useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';
import { SegmentSnapshot } from '@/api/types';
import { useSegmentTypeKeys } from '@/features/flow-designer/hooks/useSegmentTypeKeys';
import { AlertCircle, GripVertical } from 'lucide-react';
import type { KeyResponse } from '@/api/types';

interface Props {
  segment: SegmentSnapshot;
}

interface DraggableConfigFieldProps {
  keyName: string;
  keyDef: KeyResponse;
  value: unknown;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onChange: (key: string, value: unknown) => void;
}

const DND_ITEM_TYPE = 'CONFIG_KEY';

/**
 * Draggable config field component
 */
const DraggableConfigField: React.FC<DraggableConfigFieldProps> = ({
  keyName,
  keyDef,
  value,
  index,
  onMove,
  onChange,
}) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: DND_ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const opacity = isDragging ? 0.5 : 1;

  return (
    <div ref={preview} style={{ opacity }}>
      <div className="flex items-start gap-2">
        <div
          ref={(node) => drag(drop(node))}
          className="mt-8 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1">
          <label
            htmlFor={`config-${keyName}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {keyDef.displayName || keyName}
            {keyDef.isRequired && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
          {renderField(keyDef, value, keyDef.isEditable, onChange)}
        </div>
      </div>
    </div>
  );
};

/**
 * Dynamic configuration editor based on segment type
 */
export const ConfigEditor: React.FC<Props> = ({ segment }) => {
  const { updateSegmentConfig, reorderConfig } = useFlowStore();
  const { data: keys, isLoading, error } = useSegmentTypeKeys(segment.segmentType);


  // Cast config to array (internal flow format)
  const configArray = (Array.isArray(segment.config) ? segment.config : []) as Array<{ key: string; value: unknown }>;

  // Create a map of key names to config values for quick lookup
  const configMap = useMemo(() => {
    if (!configArray || !keys) return new Map<string, unknown>();
    const map = new Map<string, unknown>();
    configArray.forEach((item: any) => {
      map.set(item.key, item.value);
    });
    return map;
  }, [configArray, keys]);

  // Get ordered keys based on actual config array order
  const orderedKeys = useMemo(() => {
    if (!keys) return [];

    // Map keys according to actual config array order
    const configMap = new Map(configArray.map((c: any, index: number) => [c.key, index]));

    return [...keys].sort((a, b) => {
      const orderA = configMap.get(a.keyName) ?? 999;
      const orderB = configMap.get(b.keyName) ?? 999;
      return orderA - orderB;
    });
  }, [keys, configArray]);

  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      // Update config array by finding and updating the item or adding new one
      const updatedConfig = configArray.some((c: any) => c.key === key)
        ? configArray.map((c: any) => c.key === key ? { ...c, value } : c)
        : [...configArray, { key, value }];
      updateSegmentConfig(segment.segmentName, updatedConfig);
    },
    [segment.segmentName, configArray, updateSegmentConfig],
  );

  const handleMove = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      // Use the store's reorderConfig method to reorder the actual array
      reorderConfig(segment.segmentName, dragIndex, hoverIndex);
    },
    [segment.segmentName, reorderConfig],
  );

  if (isLoading) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h3>
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading configuration</h3>
              <p className="mt-1 text-sm text-red-700">{(error as Error).message}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!keys || keys.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h3>
        <p className="text-sm text-gray-500">No configuration keys defined for this segment type.</p>
      </section>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h3>
        <p className="text-xs text-gray-500 mb-3">
          Drag and drop to reorder configuration keys.
        </p>
        <div className="space-y-4">
          {orderedKeys.map((key, index) => {
            const value = configMap.get(key.keyName) ?? key.defaultValue;
            const isDisplayed = key.isDisplayed;

            if (!isDisplayed) return null;

            return (
              <DraggableConfigField
                key={key.keyName}
                keyName={key.keyName}
                keyDef={key}
                value={value}
                index={index}
                onMove={handleMove}
                onChange={handleConfigChange}
              />
            );
          })}
        </div>
      </section>
    </DndProvider>
  );
};

/**
 * Render appropriate input field based on data type
 */
function renderField(
  key: KeyResponse,
  value: unknown,
  isEditable: boolean,
  onChange: (key: string, value: unknown) => void,
) {
  const commonProps = {
    id: `config-${key.keyName}`,
    disabled: !isEditable,
    'aria-required': key.isRequired,
    'aria-disabled': !isEditable,
    className: `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
      !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
    }`,
  };

  const dataType = key.typeName.toLowerCase();

  switch (dataType) {
    case 'string':
    case 'text':
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(key.keyName, e.target.value)}
          placeholder={key.defaultValue}
          {...commonProps}
        />
      );
    case 'number':
    case 'integer':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(key.keyName, parseFloat(e.target.value))}
          placeholder={key.defaultValue}
          {...commonProps}
        />
      );
    case 'boolean':
      return (
        <div className="flex items-center">
          <input
            id={`config-${key.keyName}`}
            type="checkbox"
            checked={typeof value === 'boolean' ? value : false}
            onChange={(e) => onChange(key.keyName, e.target.checked)}
            disabled={!isEditable}
            aria-required={key.isRequired}
            aria-disabled={!isEditable}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`config-${key.keyName}`} className="ml-2 text-sm text-gray-600">
            Enabled
          </label>
        </div>
      );
    case 'json':
    case 'object':
      return (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(key.keyName, parsed);
            } catch {
              // Keep invalid JSON until user finishes typing
            }
          }}
          rows={4}
          placeholder={key.defaultValue}
          {...commonProps}
          className={`${commonProps.className} font-mono text-xs`}
        />
      );
    default:
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(key.keyName, e.target.value)}
          placeholder={key.defaultValue}
          {...commonProps}
        />
      );
  }
}


