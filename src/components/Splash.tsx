export default function Splash() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl font-semibold tracking-wide">BUIKECORE</div>
        <div className="mt-2 text-sm text-white/70">
          From quick notes to clear thinking
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/60 animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2 w-2 rounded-full bg-white/60 animate-bounce [animation-delay:-0.1s]" />
          <span className="h-2 w-2 rounded-full bg-white/60 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
