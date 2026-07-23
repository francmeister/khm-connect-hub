export function GlowBackdrop({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: intensity }}
    >
      <div
        className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(242,69,69,0.16), transparent 65%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute right-[-10%] top-[30%] h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(214,54,54,0.10), transparent 70%)", filter: "blur(80px)" }}
      />
    </div>
  );
}
