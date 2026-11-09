import React from 'react';

// Devuelve la ref que hay que colocar al final de la grilla. Cuando el
// centinela entra en pantalla se pide la siguiente pagina.
const useInfiniteScroll = (onLoadMore, { enabled = true, rootMargin = '400px' } = {}) => {
  const sentinel = React.useRef(null);

  React.useEffect(() => {
    const node = sentinel.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, enabled, rootMargin]);

  return sentinel;
};

export default useInfiniteScroll;
