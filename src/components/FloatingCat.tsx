import { useEffect, useRef, useState } from 'react';

const DANCING_CAT_GIF =
  'https://i.pinimg.com/originals/ed/35/f8/ed35f861be81be2548e514085fb19385.gif';

export function FloatingCat() {
  const timeoutRef = useRef<number | null>(null);
  const [isReacting, setIsReacting] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    setIsReacting(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsReacting(false);
      timeoutRef.current = null;
    }, 780);
  };

  return (
    <div className="floating-cat-shell" data-no-paw>
      <button
        type="button"
        className={`floating-cat ${isReacting ? 'is-reacting' : ''}`}
        onClick={handleClick}
        aria-label="Friendly dancing cat"
      >
        <img
          src={DANCING_CAT_GIF}
          alt="Dancing cat"
          className="floating-cat__gif"
          loading="eager"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
        />
        <span className={`floating-cat__meow ${isReacting ? 'is-visible' : ''}`} aria-hidden="true">
          Meow!
        </span>
      </button>
    </div>
  );
}
