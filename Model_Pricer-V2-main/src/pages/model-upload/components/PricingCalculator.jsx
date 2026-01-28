import React from 'react';
import Icon from '../../../components/AppIcon';
import { BarLoader } from 'react-spinners';

// --- Constants for Pricing ---
const PRICE_PER_HOUR = 75; // Price per hour of printing in CZK
const FILAMENT_DIAMETER_MM = 1.75; // Standard filament diameter
const PLA_DENSITY_G_CM3 = 1.24; // Density of PLA
const PRICE_PER_GRAM_PLA = 2.0; // Price per gram of PLA in CZK

/**
 * Converts filament length (in mm) to weight (in grams).
 * @param {number} length_mm - Length of the filament in millimeters.
 * @returns {number} Estimated weight in grams.
 */
const calculateWeightGrams = (length_mm) => {
  if (!length_mm || length_mm <= 0) return 0;
  const radius_cm = (FILAMENT_DIAMETER_MM / 2) / 10;
  const length_cm = length_mm / 10;
  const volume_cm3 = Math.PI * Math.pow(radius_cm, 2) * length_cm;
  return volume_cm3 * PLA_DENSITY_G_CM3;
};

/**
 * Formats seconds into a human-readable string (H hod M min S s).
 * @param {number} totalSeconds - Total seconds.
 * @returns {string} Formatted time string.
 */
const formatPrintTime = (totalSeconds) => {
  if (totalSeconds <= 0) return '-';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let result = '';
  if (hours > 0) result += `${hours} hod `;
  if (minutes > 0) result += `${minutes} min `;
  if (seconds > 0 && hours === 0) result += `${seconds} s`; // Show seconds only if total time is less than an hour
  return result.trim();
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

const PricingCalculator = ({ selectedFile }) => {

  // --- Initial State: No file selected ---
  if (!selectedFile) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Calculator" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Kalkulace ceny</h3>
        <p className="text-sm text-muted-foreground">
          Vyberte nahraný model pro zobrazení detailů a ceny tisku.
        </p>
      </div>
    );
  }

  const { status, result, error } = selectedFile;

  // --- Loading State: Pending or Processing ---
  if (status === 'pending' || status === 'processing') {
    return (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Icon name="Loader" size={24} className="text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
                {status === 'pending' ? "Čekám na spuštění..." : "Probíhá analýza a výpočet..."}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
                Zpracovávám váš model. To může trvat několik sekund.
            </p>
            <BarLoader color="hsl(var(--primary))" width="100%" />
        </div>
    );
  }

  // --- Error State: Slicing Failed ---
  if (status === 'failed') {
    return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
            <Icon name="XCircle" size={24} className="text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Výpočet se nezdařil</h3>
            <p className="text-sm text-destructive/80">
                {error || "Došlo k neznámé chybě."}
            </p>
        </div>
    );
  }

  // --- Success State: Calculation Completed ---
  if (status === 'completed' && result) {
    const weightGrams = calculateWeightGrams(result.material);
    const materialCost = weightGrams * PRICE_PER_GRAM_PLA;
    const printingCost = (result.time / 3600) * PRICE_PER_HOUR;
    const total = materialCost + printingCost;

    return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Odhad ceny a tisku</h3>
            <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">Předpokládaná cena tisku</p>
                <div className="text-4xl font-bold text-primary my-1">{formatPrice(total)}</div>
            </div>
        </div>

        <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center"><Icon name="Clock" className="mr-2" size={14}/>Odhadovaná doba tisku</span>
                <span className="font-medium text-foreground">{formatPrintTime(result.time)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center"><Icon name="Database" className="mr-2" size={14}/>Spotřeba materiálu</span>
                <span className="font-medium text-foreground">{weightGrams.toFixed(1)} g</span>
            </div>
        </div>

        <div className="border-t border-border pt-4 mt-4 space-y-2 text-xs">
             <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cena za materiál (PLA)</span>
                <span className="text-foreground">{formatPrice(materialCost)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cena za čas tiskárny</span>
                <span className="text-foreground">{formatPrice(printingCost)}</span>
            </div>
        </div>
      </div>
    );
  }

  // --- Fallback state, should not be reached ---
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">Nastal neočekávaný stav.</p>
    </div>
  );
};

export default PricingCalculator;
