import { useEffect, useRef, type RefObject } from "react";

export function useOutsideClick(
  menuRef: RefObject<HTMLDivElement | null>,
  showOptions: boolean,
  onOutside: () => void,
) {
  // save the latest callback in a ref, so re-renders don't recreate
  // the event listeners below — only the click itself reads from it
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;
  useEffect(() => {
    if (!showOptions) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOutsideRef.current();
      }
    }

    function handleScroll() {
      onOutsideRef.current();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showOptions, menuRef]);
}
