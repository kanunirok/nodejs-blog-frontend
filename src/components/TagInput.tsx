import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { blogApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const MAX_TAGS = 5;

export function TagInput({ value, onChange, placeholder = 'Add tags...', maxTags = MAX_TAGS }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchTags = async () => {
      if (inputValue.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const response = await blogApi.searchTags(inputValue);
      if (response.data) {
        const filtered = response.data.filter((tag) => !value.includes(tag));
        setSuggestions(filtered);
        // Show suggestions if there are any and input is focused
        if (filtered.length > 0 && document.activeElement === inputRef.current) {
          setShowSuggestions(true);
        }
      }
    };

    const debounce = setTimeout(searchTags, 200);
    return () => clearTimeout(debounce);
  }, [inputValue, value]);

  const addTag = (tag: string) => {
    if (value.length >= maxTags) {
      return;
    }
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !value.includes(normalizedTag)) {
      onChange([...value, normalizedTag]);
    }
    setInputValue('');
    setSuggestions([]);
    setSelectedIndex(-1);
    setShowSuggestions(false);
    // Use setTimeout to ensure focus happens after state updates
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.length >= maxTags) {
        return;
      }
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Show suggestions when user starts typing
            if (e.target.value.trim().length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Show suggestions if there are any when input is focused
            if (suggestions.length > 0 && inputValue.trim().length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={(e) => {
            // Only hide suggestions if clicking outside the component
            // Check if the related target is not within the suggestions dropdown
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (!containerRef.current?.contains(relatedTarget)) {
              setTimeout(() => setShowSuggestions(false), 200);
            }
          }}
          placeholder={value.length === 0 ? placeholder : value.length >= maxTags ? `Maximum ${maxTags} tags reached` : ''}
          disabled={value.length >= maxTags}
          className="flex-1 min-w-[120px] border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && value.length < maxTags && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <ul className="py-1">
            {suggestions.map((tag, index) => (
              <li
                key={tag}
                onMouseDown={(e) => {
                  // Prevent blur event from firing before click
                  e.preventDefault();
                }}
                onClick={() => {
                  addTag(tag);
                }}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
