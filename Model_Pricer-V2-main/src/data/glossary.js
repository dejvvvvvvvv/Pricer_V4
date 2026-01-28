/**
 * Small glossary for technical terms used in marketing pages.
 * Tokens are referenced as [[termKey]] in FAQ content.
 */

export function getGlossary(language = "cs") {
  const isCs = language === "cs";

  return {
    slicing: {
      label: isCs ? "slicování" : "slicing",
      desc: isCs
        ? "Proces, kdy se 3D model převede na tiskové instrukce (G-code) podle nastavených parametrů (vrstva, infill, supporty…)."
        : "The process of turning a 3D model into printer instructions (G-code) using chosen print settings (layer height, infill, supports…).",
    },
    presets: {
      label: isCs ? "presety" : "presets",
      desc: isCs
        ? "Přednastavené profily kvality (např. Basic/Standard/Detail), které nastaví hodnoty parametrů pro slicování jedním klikem."
        : "Predefined quality profiles (e.g., Basic/Standard/Detail) that set multiple slicer parameters with a single click.",
    },
    infill: {
      label: isCs ? "infill" : "infill",
      desc: isCs
        ? "Výplň uvnitř modelu. Vyšší % = pevnější, ale dražší (víc materiálu a času)."
        : "Internal fill of the model. Higher % = stronger, but more expensive (more material and time).",
    },
    cli: {
      label: isCs ? "CLI" : "CLI",
      desc: isCs
        ? "Command-line rozhraní. U nás je to PrusaSlicer spouštěný na serveru bez grafiky (automatizace)."
        : "Command-line interface. We run PrusaSlicer on the server headlessly (automation).",
    },
  };
}
