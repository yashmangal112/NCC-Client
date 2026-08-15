export default function AmbientBackground() {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-blue-900/15 blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-900/15 blur-[100px]" />
    </div>
  );
}
