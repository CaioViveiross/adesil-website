import Image from "next/image";

const WHATSAPP_NUMBER = "551142107059";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Vim pelo site da Adesil e gostaria de falar com vocês."
);

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Adesil no WhatsApp"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <span className="absolute inset-0 rounded-full bg-green-500/30 blur-xl transition-opacity duration-300 opacity-70 group-hover:opacity-100" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105">
        <Image
          src="/images/whatsapp_icon.png"
          alt="WhatsApp"
          width={34}
          height={34}
          className="h-8 w-8"
        />
      </span>
    </a>
  );
};

export default WhatsAppButton;