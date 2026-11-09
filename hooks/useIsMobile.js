import React from 'react';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < breakpoint);

  React.useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (event) => setIsMobile(event.matches);

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
