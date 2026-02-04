/**
 * Onboarding steps configuration for the Widget Builder V3.
 *
 * Each step describes one screen of the first-run walkthrough overlay.
 * The `targetRef` hints which panel area to visually emphasise:
 *   - null        -> full-screen overlay with centered card (welcome)
 *   - 'right-panel' -> preview area (right side)
 *   - 'left-panel'  -> editor area (left side)
 *   - 'global-tab'  -> left panel, global/themes area
 *   - 'save-button' -> top bar, right side
 */

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: {
      cs: 'Vitejte ve Widget Builderu!',
      en: 'Welcome to Widget Builder!',
    },
    text: {
      cs: 'Zde muzete vizualne upravit vzhled vaseho widgetu. Zmente barvy, texty a layout — vsechny zmeny vidite okamzite v nahledu.',
      en: 'Here you can visually customize your widget appearance. Change colors, texts and layout — all changes are visible instantly in the preview.',
    },
    targetRef: null,
  },
  {
    id: 'preview',
    title: {
      cs: 'Nahled widgetu',
      en: 'Widget Preview',
    },
    text: {
      cs: 'Kliknete na libovolny element v nahledu pro jeho editaci. Zmeny se projevuji v realnem case.',
      en: 'Click any element in the preview to edit it. Changes are reflected in real-time.',
    },
    targetRef: 'right-panel',
  },
  {
    id: 'editor',
    title: {
      cs: 'Editor vlastnosti',
      en: 'Property Editor',
    },
    text: {
      cs: 'Po vybrani elementu zde vidite jeho editovatelne vlastnosti — barvy, rozmery, texty.',
      en: 'After selecting an element, you can see its editable properties here — colors, dimensions, texts.',
    },
    targetRef: 'left-panel',
  },
  {
    id: 'themes',
    title: {
      cs: 'Quick Themes',
      en: 'Quick Themes',
    },
    text: {
      cs: 'Pouzijte prednastavena temata pro rychly start nebo jako inspiraci.',
      en: 'Use preset themes for a quick start or as inspiration.',
    },
    targetRef: 'global-tab',
  },
  {
    id: 'save',
    title: {
      cs: 'Nezapomente ulozit!',
      en: "Don't forget to save!",
    },
    text: {
      cs: 'Po dokonceni uprav kliknete na zelene tlacitko "Ulozit" v hornim panelu.',
      en: 'After finishing edits, click the green "Save" button in the top bar.',
    },
    targetRef: 'save-button',
  },
];
