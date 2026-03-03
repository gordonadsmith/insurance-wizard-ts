import { useRef, useCallback } from 'react';

export const useAutoScroll = () => {
  const userScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticScrollRef = useRef<boolean>(false);

  const handleScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    
    userScrollingRef.current = true;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 3000);
  }, []);

  const scrollToBottom = useCallback(() => {
    const wizardContent = document.querySelector('.wizard-content');
    if (wizardContent) {
      programmaticScrollRef.current = true;
      wizardContent.scrollTo({
        top: wizardContent.scrollHeight,
        behavior: 'smooth'
      });
      setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 600);
    }
  }, []);

  const scrollToElement = useCallback((element: Element) => {
    programmaticScrollRef.current = true;
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 600);
  }, []);

  const scrollToTop = useCallback(() => {
    const wizardContent = document.querySelector('.wizard-content');
    if (wizardContent) {
      programmaticScrollRef.current = true;
      wizardContent.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { programmaticScrollRef.current = false; }, 600);
    }
  }, []);

  const resetScrollState = useCallback(() => {
    userScrollingRef.current = false;
  }, []);

  const triggerAutoScroll = useCallback(() => {
    userScrollingRef.current = false;
    setTimeout(scrollToBottom, 150);
    setTimeout(scrollToBottom, 500);
  }, [scrollToBottom]);

  return {
    userScrollingRef,
    handleScroll,
    scrollToBottom,
    scrollToElement,
    scrollToTop,
    resetScrollState,
    triggerAutoScroll,
  };
};
