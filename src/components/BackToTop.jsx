import React, { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollTop}
      className={`fixed bottom-5 right-5 z-[60] rounded-full shadow-lg border
        px-3 py-2 bg-white/90 backdrop-blur hover:bg-white
        transition ${show ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      title="กลับขึ้นด้านบน"
    >
      ⬆︎
    </button>
  );
}
