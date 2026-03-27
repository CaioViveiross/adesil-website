import { useState } from "react";
import { labelFonts, labelColors } from "@/data/mockData";

interface LabelCustomizerProps {
  onCustomize?: (data: { text: string; color: string; font: string }) => void;
}

const LabelCustomizer = ({ onCustomize }: LabelCustomizerProps) => {
  const [text, setText] = useState("Sua Etiqueta");
  const [selectedColor, setSelectedColor] = useState(labelColors[0]);
  const [selectedFont, setSelectedFont] = useState(labelFonts[0]);

  const handleChange = (newText?: string, newColor?: typeof selectedColor, newFont?: typeof selectedFont) => {
    const t = newText ?? text;
    const c = newColor ?? selectedColor;
    const f = newFont ?? selectedFont;
    onCustomize?.({ text: t, color: c.id, font: f.id });
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-secondary/30 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">✨</span>
        </div>
        <div>
          <h3 className="font-bold text-lg">Personalize sua Etiqueta</h3>
          <p className="text-xs text-muted-foreground">Visualize em tempo real</p>
        </div>
      </div>

      {/* Live Preview */}
      <div className="relative bg-background rounded-xl p-8 flex items-center justify-center min-h-[160px] shadow-inner border">
        <div
          className="px-8 py-4 rounded-lg border-2 transition-all duration-300 shadow-md"
          style={{
            borderColor: selectedColor.hex,
            fontFamily: selectedFont.fontFamily,
          }}
        >
          <p
            className="text-2xl md:text-3xl font-bold transition-all duration-300 text-center"
            style={{ color: selectedColor.hex }}
          >
            {text || "Sua Etiqueta"}
          </p>
        </div>
        <div
          className="absolute bottom-2 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: selectedColor.hex + "15", color: selectedColor.hex }}
        >
          Preview ao vivo
        </div>
      </div>

      {/* Text Input */}
      <div>
        <label className="text-sm font-medium mb-2 block">Texto da Etiqueta</label>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleChange(e.target.value);
          }}
          placeholder="Digite o texto..."
          className="w-full px-4 py-3 rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground mt-1">{text.length}/30 caracteres</p>
      </div>

      {/* Color Selection */}
      <div>
        <label className="text-sm font-medium mb-3 block">Cor</label>
        <div className="flex flex-wrap gap-3">
          {labelColors.map((color) => (
            <button
              key={color.id}
              onClick={() => {
                setSelectedColor(color);
                handleChange(undefined, color);
              }}
              className={`w-10 h-10 rounded-full transition-all duration-200 active:scale-95 ${
                selectedColor.id === color.id
                  ? "ring-2 ring-offset-2 ring-primary scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Selecionado: {selectedColor.name}</p>
      </div>

      {/* Font Selection */}
      <div>
        <label className="text-sm font-medium mb-3 block">Fonte</label>
        <div className="grid grid-cols-2 gap-2">
          {labelFonts.map((font) => (
            <button
              key={font.id}
              onClick={() => {
                setSelectedFont(font);
                handleChange(undefined, undefined, font);
              }}
              className={`px-4 py-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.97] ${
                selectedFont.id === font.id
                  ? "border-primary bg-secondary shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="text-sm" style={{ fontFamily: font.fontFamily }}>
                {font.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabelCustomizer;
