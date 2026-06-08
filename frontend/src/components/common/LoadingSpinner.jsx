export default function LoadingSpinner({ fullScreen = false }) {
  const content = (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  if (fullScreen) {
    return <div className="flex items-center justify-center h-64">{content}</div>;
  }
  return content;
}
