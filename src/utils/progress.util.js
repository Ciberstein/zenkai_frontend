const percent = (progress = 0, duration = 0) => {
  if (!duration) return 0;
  return Math.min(100, Math.round((progress / duration) * 100));
};

export default percent;
