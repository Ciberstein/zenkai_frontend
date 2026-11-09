import React from 'react';

// El buscador consulta Jikan en cada tecla; sin esto se dispararia una
// peticion por caracter y el rate limit del backend cortaria la busqueda.
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
