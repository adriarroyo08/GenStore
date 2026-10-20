import React, { useState, useEffect, useMemo } from 'react';

interface Variant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  precio: number;
  stock: number;
  imagenes: string[];
  activo: boolean;
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantSelect: (variant: Variant | null) => void;
}

export function VariantSelector({ variants, onVariantSelect }: VariantSelectorProps) {
  // Derive unique attribute names and their possible values from variants
  const attributeMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const variant of variants) {
      for (const [attrName, attrValue] of Object.entries(variant.attributes)) {
        if (!map[attrName]) {
          map[attrName] = [];
        }
        if (!map[attrName].includes(attrValue)) {
          map[attrName].push(attrValue);
        }
      }
    }
    return map;
  }, [variants]);

  const attributeNames = useMemo(() => Object.keys(attributeMap), [attributeMap]);

  // Initialize selections: first value of each attribute
  const initialSelections = useMemo(() => {
    const sel: Record<string, string> = {};
    for (const [attrName, values] of Object.entries(attributeMap)) {
      if (values.length > 0) {
        sel[attrName] = values[0];
      }
    }
    return sel;
  }, [attributeMap]);

  const [selections, setSelections] = useState<Record<string, string>>(initialSelections);

  // Re-initialize when variants change
  useEffect(() => {
    setSelections(initialSelections);
  }, [initialSelections]);

  // Find matching variant whenever selections change
  useEffect(() => {
    if (attributeNames.length === 0) {
      onVariantSelect(null);
      return;
    }

    const allSelected = attributeNames.every((name) => selections[name] !== undefined);
    if (!allSelected) {
      onVariantSelect(null);
      return;
    }

    const matched = variants.find((variant) =>
      attributeNames.every(
        (name) => variant.attributes[name] === selections[name]
      )
    );

    onVariantSelect(matched ?? null);
  }, [selections, variants, attributeNames, onVariantSelect]);

  // Check whether a given value for an attribute is available given other current selections
  function isValueAvailable(attrName: string, attrValue: string): boolean {
    const testSelections = { ...selections, [attrName]: attrValue };
    return variants.some((variant) => {
      if (!variant.activo || variant.stock <= 0) return false;
      return attributeNames.every(
        (name) => variant.attributes[name] === testSelections[name]
      );
    });
  }

  function handleSelect(attrName: string, attrValue: string) {
    setSelections((prev) => ({ ...prev, [attrName]: attrValue }));
  }

  function isColorAttribute(attrName: string): boolean {
    return /color|colour/i.test(attrName);
  }

  if (attributeNames.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {attributeNames.map((attrName) => {
        const values = attributeMap[attrName];
        const selectedValue = selections[attrName];
        const isColor = isColorAttribute(attrName);

        return (
          <div key={attrName} className="flex flex-col gap-3 w-full">
            {/* Attribute label */}
            <p className="text-sm font-semibold text-foreground">
              {attrName}
              {selectedValue && (
                <span className="font-normal text-muted-foreground ml-1">
                  : {selectedValue}
                </span>
              )}
            </p>

            {/* Value buttons */}
            <div className="flex flex-row flex-wrap gap-2 items-center">
              {values.map((value) => {
                const isSelected = selectedValue === value;
                const available = isValueAvailable(attrName, value);

                if (isColor) {
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => available && handleSelect(attrName, value)}
                      disabled={!available}
                      title={`${value}${!available ? ' (sin stock)' : ''}`}
                      className={[
                        'relative w-10 h-10 rounded-full border-2 border-solid transition-all duration-200 shrink-0 focus:outline-none',
                        isSelected
                          ? 'border-primary scale-110 ring-2 ring-primary/30'
                          : available
                          ? 'border-transparent hover:border-primary/50'
                          : 'border-transparent opacity-30 cursor-not-allowed',
                      ].join(' ')}
                      style={{ backgroundColor: value }}
                    >
                      {/* Diagonal line overlay for unavailable */}
                      {!available && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <span className="block w-full h-0.5 bg-gray-600 rotate-45" />
                        </span>
                      )}
                    </button>
                  );
                }

                // Pill button
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => available && handleSelect(attrName, value)}
                    disabled={!available}
                    className={[
                      'px-4 py-2 text-sm rounded-lg border transition-all duration-150 focus:outline-none shrink-0',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground font-medium'
                        : available
                        ? 'border-border bg-background text-foreground hover:border-primary/60'
                        : 'border-border bg-background text-muted-foreground line-through opacity-50 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
